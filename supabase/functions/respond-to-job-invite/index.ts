import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { token, action } = await req.json();

    if (!token || !['approve', 'decline'].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("job_tokens")
      .select("job_id, status, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
       return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (tokenData.status !== 'pending') {
         return new Response(JSON.stringify({ error: "Token already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'approve') {
        const { error: updateError } = await supabaseAdmin.rpc('transition_job_state', {
            job_id: tokenData.job_id,
            new_status: 'approved'
        });

        if (updateError) {
             throw updateError;
        }

        await supabaseAdmin
            .from("job_tokens")
            .update({ status: 'used' })
            .eq("token", token);

    } else if (action === 'decline') {
        const { error: updateError } = await supabaseAdmin.rpc('transition_job_state', {
            job_id: tokenData.job_id,
            new_status: 'draft'
        });

         if (updateError) {
             throw updateError;
        }

        await supabaseAdmin
            .from("job_tokens")
            .update({ status: 'declined' })
            .eq("token", token);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
