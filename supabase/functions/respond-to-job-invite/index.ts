import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, action } = await req.json()

    if (!token || !['approve', 'decline'].includes(action)) {
        throw new Error('Valid token and action (approve/decline) are required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify token validity
    const { data: validToken, error: tokenError } = await supabaseAdmin
      .from('job_tokens')
      .select('job_id, expires_at')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !validToken) throw new Error('Invalid or expired token')

    // Get current job status
    const { data: job, error: jobFetchError } = await supabaseAdmin
        .from('jobs')
        .select('status, contractor_id')
        .eq('id', validToken.job_id)
        .single()

    if (jobFetchError || !job) throw new Error('Job not found')

    let newStatus = job.status

    if (action === 'approve') {
        if (job.status === 'sent') {
            newStatus = 'approved'
        } else if (job.status === 'approved') {
             return new Response(
                JSON.stringify({ message: 'Job already approved', status: 'approved' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
        }
    } else if (action === 'decline') {
        if (job.status === 'sent') {
            newStatus = 'draft' // Send back to draft for revision
        }
    }

    if (newStatus !== job.status) {
        // Update Job
        const { error: updateError } = await supabaseAdmin
            .from('jobs')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', validToken.job_id)

        if (updateError) throw updateError

        // Log Event (Attributed to contractor since homeowner is anonymous)
        const { error: eventError } = await supabaseAdmin
            .from('job_events')
            .insert({
                job_id: validToken.job_id,
                previous_status: job.status,
                new_status: newStatus,
                created_by: job.contractor_id
            })

        if (eventError) console.error('Failed to log event:', eventError)
    }

    return new Response(
      JSON.stringify({ message: `Job ${action}d successfully`, status: newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
