import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate Token and Fetch Job
    const { data: tokenData, error: tokenError } = await supabase
      .from("job_tokens")
      .select(`
        *,
        jobs (
          id,
          title,
          description,
          service_date,
          status,
          client_id,
          property_id,
          created_at,
          updated_at,
          contractor_id
        )
      `)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .in("status", ["pending", "used"]) // Allow viewing used tokens? Maybe, but actions should be restricted.
      // Actually PRD says "Homeowner Invite Link... Homeowner Accept/Decline (guest token)".
      // If they already accepted, they should probably see the status.
      // So I'll allow 'used' but the frontend will show different UI.
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const job = tokenData.jobs;

    // Fetch Contractor Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, full_name")
      .eq("id", job.contractor_id)
      .single();

    // Fetch Property Details
    const { data: property } = await supabase
      .from("properties")
      .select("address_line1, city, province, postal_code")
      .eq("id", job.property_id)
      .single();

    // Fetch Client Details
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", job.client_id)
      .single();

    const responseData = {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        service_date: job.service_date,
        status: job.status,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
      contractor: {
        business_name: profile?.business_name || profile?.full_name || "Contractor",
      },
      property: property,
      client: client,
      tokenStatus: tokenData.status,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
