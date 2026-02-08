// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyInviteToken } from "../_shared/invite.ts";
import { getErrorStatus } from "../_shared/errors.ts";

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await verifyInviteToken(token, serviceRoleKey);
    if (!payload || !payload.job_id) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .select(`
        id,
        title,
        description,
        service_date,
        status,
        created_at,
        contractor_id,
        clients (
          first_name,
          last_name
        ),
        properties (
          address_line1,
          city,
          province,
          postal_code
        )
      `)
      .eq("id", payload.job_id)
      .is("deleted_at", null)
      .single();

    if (error || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch contractor profile separately to ensure we get the data even if relation is tricky
    const { data: contractor } = await supabaseAdmin
      .from("profiles")
      .select("business_name, email")
      .eq("id", job.contractor_id)
      .single();

    // Sanitize response (though the select is already specific)
    const response = {
      id: job.id,
      title: job.title,
      description: job.description,
      service_date: job.service_date,
      status: job.status,
      created_at: job.created_at,
      client: {
        // @ts-ignore
        first_name: job.clients?.first_name,
        // @ts-ignore
        last_name: job.clients?.last_name,
      },
      property: {
        // @ts-ignore
        address: job.properties?.address_line1,
        // @ts-ignore
        city: job.properties?.city,
        // @ts-ignore
        province: job.properties?.province,
        // @ts-ignore
        postal_code: job.properties?.postal_code,
      },
      contractor: {
        business_name: contractor?.business_name || "Service Provider",
        email: contractor?.email,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in get-invite-details:", error);
    const statusCode = getErrorStatus(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
