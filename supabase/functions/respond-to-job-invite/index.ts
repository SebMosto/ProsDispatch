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
    const { token, response } = await req.json();

    if (!token || !response) {
      throw new Error('Token and response are required');
    }

    if (!['approve', 'decline'].includes(response)) {
        throw new Error('Invalid response. Must be "approve" or "decline".');
    }

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

    // 2. Map Response to Job Status
    // If approved -> 'approved'. If declined -> 'draft' (revert) or maybe 'archived'?
    // PRD says: "Approve or Decline".
    // SPEC-003 Job Lifecycle:
    // sent -> approved
    // sent -> draft (effectively a decline/rework loop)
    // sent -> archived (if client rejects entirely)

    // Let's assume:
    // Approve -> 'approved'
    // Decline -> 'draft' (so contractor can edit and re-send or archive).
    // Or should we add a 'declined' state? SPEC-003 doesn't have 'declined'.
    // "No backward transitions in MVP1" - Wait.
    // SPEC-003 says: "Non-reversible: No backward transitions in MVP1."
    // BUT "Allowed Transitions" lists: "sent -> draft"
    // So "sent -> draft" is allowed.

    const newStatus = response === 'approve' ? 'approved' : 'draft';

    // 3. Update Job (as Contractor via Service Role impersonation or just direct update)
    // We need to use RPC to ensure state machine and logging.
    // However, RPC uses auth.uid(). Since we are anonymous here, auth.uid() is null.
    // The RPC might fail if it enforces "job_contractor_id != auth.uid()".
    // Let's check RPC code.
    // "if job_contractor_id != auth.uid() then raise exception 'Unauthorized'; end if;"
    // Yes, RPC checks auth.uid().

    // Since we are in Edge Function with Service Role, we can bypass RPC and do direct updates + manual event logging.
    // Or we can try to impersonate user? No, we don't have their JWT.

    // We will do direct updates using Service Role, mimicking what the RPC does.

    // Get Contractor ID for logging
    const { data: job } = await supabaseAdmin.from('jobs').select('contractor_id, status').eq('id', tokenRecord.job_id).single();

    if (!job) throw new Error('Job not found');

    // Update Job Status
    const { error: updateError } = await supabaseAdmin
        .from('jobs')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', tokenRecord.job_id);

    if (updateError) throw updateError;

    // Log Event
    // "Homeowner actions are logged in job_events using the Contractor's user ID for the created_by field"
    await supabaseAdmin.from('job_events').insert({
        job_id: tokenRecord.job_id,
        previous_status: job.status,
        new_status: newStatus,
        created_by: job.contractor_id // Shadowing the contractor
    });

    // 4. Invalidate Token
    await supabaseAdmin
        .from('job_tokens')
        .update({ status: 'used' })
        .eq('token', token);

    return new Response(JSON.stringify({ success: true, newStatus }), {
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
