import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with SERVICE_ROLE_KEY to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { token } = await req.json();

    if (!token) {
        throw new Error("Missing token");
    }

    // 1. Get Token and Job
    const { data: jobToken, error: tokenError } = await supabase
        .from("job_tokens")
        .select(`
            *,
            job:jobs(
                id,
                title,
                description,
                service_date,
                status,
                contractor_id,
                client:clients(name),
                property:properties(address_line1, city, province, postal_code)
            )
        `)
        .eq("token", token)
        .single();

    if (tokenError || !jobToken) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 2. Validate
    if (jobToken.status !== 'active') {
         return new Response(JSON.stringify({ error: "Token is no longer active" }), {
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const now = new Date();
    if (new Date(jobToken.expires_at) < now) {
         return new Response(JSON.stringify({ error: "Token expired" }), {
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 3. Mark as opened (optional, if first open)
    if (!jobToken.opened_at) {
        await supabase
            .from("job_tokens")
            .update({ opened_at: new Date().toISOString() })
            .eq("token", token);
    }

    // 4. Fetch Contractor Profile
    const { data: contractor, error: profileError } = await supabase
        .from("profiles")
        .select("business_name, full_name, email")
        .eq("id", jobToken.job.contractor_id)
        .single();

    if (profileError || !contractor) {
        // Fallback if profile not found (should not happen)
        console.error("Profile not found for job:", jobToken.job.id);
    }

    // 5. Return Data (Sanitized)
    const job = jobToken.job;
    const responseData = {
        id: job.id,
        title: job.title,
        description: job.description,
        service_date: job.service_date,
        status: job.status,
        client_name: job.client?.name || "Client",
        property_address: job.property ? `${job.property.address_line1}, ${job.property.city}` : "Address not available",
        contractor: {
            name: contractor?.business_name || contractor?.full_name || "Contractor",
            email: contractor?.email
        }
    };

    return new Response(JSON.stringify({ data: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
