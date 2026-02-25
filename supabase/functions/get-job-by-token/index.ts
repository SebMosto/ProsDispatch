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
    const { token } = await req.json()

    if (!token) throw new Error('Token is required')

    // Use service role key to bypass RLS since token is the "auth"
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify token validity
    const { data: validToken, error: tokenError } = await supabaseAdmin
      .from('job_tokens')
      .select('job_id, expires_at')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString()) // Check expiry
      .single()

    if (tokenError || !validToken) {
        console.error('Token verification failed:', tokenError)
        throw new Error('Invalid or expired token')
    }

    // Fetch Job Details (Sanitized)
    // Only return what is necessary for the homeowner
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(`
        title,
        description,
        service_date,
        status,
        clients (
          name
        ),
        properties (
          address_line1,
          city,
          province,
          postal_code
        )
      `)
      .eq('id', validToken.job_id)
      .single()

    if (jobError || !job) {
        console.error('Job fetch failed:', jobError)
        throw new Error('Job not found')
    }

    return new Response(
      JSON.stringify({ job }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
