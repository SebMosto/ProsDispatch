// supabase/functions/get-job-by-token/index.ts
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let token: string | null = null;

    if (req.method === "GET") {
        const url = new URL(req.url);
        token = url.searchParams.get("token");
    } else {
        const body = await req.json().catch(() => ({}));
        token = body.token;
    }

    if (!token) {
        return new Response(JSON.stringify({ error: "Missing token" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify Token & Fetch Data
    const { data: tokenData, error: tokenError } = await serviceClient
        .from("job_tokens")
        .select(`
            *,
            jobs (
                title,
                description,
                service_date,
                status,
                contractor_id,
                client_id,
                property_id
            )
        `)
        .eq("token", token)
        .single();

    if (tokenError || !tokenData) {
         return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
         return new Response(JSON.stringify({ error: "Token expired" }), {
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const job = tokenData.jobs;
    // Type assertion or check
    if (!job) {
         return new Response(JSON.stringify({ error: "Job data missing" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { data: propertyData } = await serviceClient
        .from("properties")
        .select("address_line1, city, province, postal_code, country")
        .eq("id", job.property_id)
        .single();

    const { data: contractorData } = await serviceClient
        .from("profiles")
        .select("business_name, full_name")
        .eq("id", job.contractor_id)
        .single();

    const { data: clientData } = await serviceClient
        .from("clients")
        .select("name")
        .eq("id", job.client_id)
        .single();

    const responseData = {
        token: tokenData.token,
        status: tokenData.status,
        job: {
            title: job.title,
            description: job.description,
            service_date: job.service_date,
            status: job.status
        },
        property: propertyData,
        contractor: {
            business_name: contractorData?.business_name || "Contractor",
            full_name: contractorData?.full_name
        },
        client: {
            name: clientData?.name
        }
    };

    // Update 'viewed' status if it's pending
    if (tokenData.status === 'pending') {
         await serviceClient
            .from("job_tokens")
            .update({ status: 'viewed' })
            .eq("token", token);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
