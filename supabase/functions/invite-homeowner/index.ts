import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { job_id, email } = await req.json()

    if (!job_id) throw new Error('job_id is required')

    // Verify job ownership and status
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select('*, clients!inner(name, email), properties!inner(address_line1, city)')
      .eq('id', job_id)
      .eq('contractor_id', user.id)
      .single()

    if (jobError || !job) throw new Error('Job not found or unauthorized')

    // Create or get token (using service_role to ensure unique and bypass potential RLS conflicts)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check for existing valid token
    const { data: existingToken } = await supabaseAdmin
      .from('job_tokens')
      .select('token')
      .eq('job_id', job_id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle() // Use maybeSingle to avoid error if multiple (shouldn't happen with unique logic but just in case)

    let token = existingToken?.token

    if (!token) {
        // Create new token
        const { data: newToken, error: tokenError } = await supabaseAdmin
            .from('job_tokens')
            .insert({ job_id }) // expires_at defaults to +7 days
            .select('token')
            .single()

        if (tokenError) throw tokenError
        token = newToken.token
    }

    // Attempt to update job status to 'sent' via RPC (as the user)
    // Only if current status is 'draft'
    if (job.status === 'draft') {
        const { error: rpcError } = await supabaseClient
            .rpc('transition_job_state', {
                job_id,
                new_status: 'sent'
            })

        if (rpcError) {
            console.error('State transition error:', rpcError)
            // Decide if we should block sending email.
            // If transition fails, maybe we shouldn't send?
            // But if it's just a warning, proceed.
            // Let's assume strict compliance: if we can't mark as sent, don't send.
            throw new Error(`Failed to update job status: ${rpcError.message}`)
        }
    }

    // Send Email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
        console.warn('RESEND_API_KEY not set, skipping email send')
        return new Response(
            JSON.stringify({ message: 'Invite generated (email skipped)', token }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const resend = new Resend(resendApiKey)
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173' // Fallback for dev
    const inviteUrl = `${siteUrl}/job-invite/${token}`

    // Determine recipient email
    const recipientEmail = email || job.clients.email
    if (!recipientEmail) {
        throw new Error('No recipient email provided or found on client record')
    }

    const { error: emailError } = await resend.emails.send({
      from: 'ProsDispatch <onboarding@resend.dev>', // Use verified domain later
      to: [recipientEmail],
      subject: `Job Approval Request: ${job.title}`,
      html: `
        <p>Hello,</p>
        <p>You have a new job estimate to review from your contractor.</p>
        <p><strong>Job:</strong> ${job.title}</p>
        <p><strong>Property:</strong> ${job.properties.address_line1}, ${job.properties.city}</p>
        <p>Please review and approve the job details here:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>Thank you!</p>
      `
    })

    if (emailError) {
        console.error('Resend error:', emailError)
        throw new Error(`Failed to send email: ${emailError.message}`)
    }

    return new Response(
      JSON.stringify({ message: 'Invite sent successfully', token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in invite-homeowner:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
