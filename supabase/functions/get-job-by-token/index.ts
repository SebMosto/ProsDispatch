import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      throw new Error('Token is required');
    }

    // Initialize Supabase client with Service Role Key to bypass RLS
    // because this is a public endpoint for unauthenticated homeowners
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Validate Token
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('job_tokens')
      .select('job_id, status, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenRecord) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (tokenRecord.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Token already used or expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
        // Ideally we should update status to expired here, but for now just return error
        return new Response(JSON.stringify({ error: 'Token expired' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 2. Fetch Job Details (Limited Scope)
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        title,
        description,
        service_date,
        status,
        contractor_id,
        clients ( name ),
        properties ( address_line1, city, province, postal_code )
      `)
      .eq('id', tokenRecord.job_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Fetch Contractor Details (Profile)
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('business_name, full_name, email')
        .eq('id', job.contractor_id)
        .single();

    // Construct public safe response
    const responseData = {
      job: {
        title: job.title,
        description: job.description,
        service_date: job.service_date,
        client_name: job.clients?.name,
        property_address: job.properties,
        status: job.status
      },
      contractor: {
        business_name: profile?.business_name || 'Contractor',
        full_name: profile?.full_name,
        email: profile?.email
      }
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
