import { createClient } from "jsr:@supabase/supabase-js@2";

interface JobClient {
  name: string | null;
}

interface JobProperty {
  address_line1: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
}

interface JobData {
  title: string;
  description: string | null;
  status: string;
  service_date: string | null;
  contractor_id: string;
  client: JobClient | null;
  property: JobProperty | null;
}

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate token
    const { data: jobToken, error: tokenError } = await supabase
      .from("job_tokens")
      .select("job_id, expires_at, opened_at")
      .eq("token", token)
      .single();

    if (tokenError || !jobToken) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(jobToken.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 410, // Gone
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Mark as opened if not already
    if (!jobToken.opened_at) {
      await supabase
        .from("job_tokens")
        .update({ opened_at: new Date().toISOString() })
        .eq("token", token);
    }

    // 3. Fetch Job Details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        title,
        description,
        status,
        service_date,
        contractor_id,
        client:clients (
          name
        ),
        property:properties (
          address_line1,
          city,
          province,
          postal_code
        )
      `)
      .eq("id", jobToken.job_id)
      .returns<JobData>()
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch Contractor Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, business_name")
      .eq("id", job.contractor_id)
      .single();

    // 5. Construct Response
    const responseData = {
      title: job.title,
      description: job.description,
      status: job.status,
      service_date: job.service_date,
      client_name: job.client?.name,
      property_address: job.property, // pass object
      contractor: {
        name: profile?.full_name,
        business_name: profile?.business_name,
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
