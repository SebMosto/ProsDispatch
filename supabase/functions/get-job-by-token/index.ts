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
      throw new Error("Missing environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify Token
    const { data: tokenRecord, error: tokenError } = await supabaseClient
      .from("job_tokens")
      .select("job_id, expires_at")
      .eq("token", token)
      .single();

    if (tokenError || !tokenRecord) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
       return new Response(JSON.stringify({ error: "Token expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 410, // Gone
      });
    }

    // Fetch Job Details
    // Using Service Role to bypass RLS since the token grants access
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select(`
        id,
        title,
        description,
        status,
        service_date,
        contractor_id,
        clients (
          name
        ),
        properties (
          address_line1,
          city,
          province,
          postal_code
        ),
        profiles:contractor_id (
            full_name,
            business_name,
            email
        )
      `)
      .eq("id", tokenRecord.job_id)
      .single();

    if (jobError || !job) {
       return new Response(JSON.stringify({ error: "Job not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Return specific public fields
    // Safe to cast as any because we know the structure from the select
    const jobData = job as any;
    const responseData = {
      id: jobData.id,
      title: jobData.title,
      description: jobData.description,
      status: jobData.status,
      service_date: jobData.service_date,
      client_name: jobData.clients?.name,
      property_address: jobData.properties ? `${jobData.properties.address_line1}, ${jobData.properties.city}, ${jobData.properties.province} ${jobData.properties.postal_code}` : null,
      contractor_name: jobData.profiles?.business_name || jobData.profiles?.full_name || "Contractor",
      contractor_email: jobData.profiles?.email
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
