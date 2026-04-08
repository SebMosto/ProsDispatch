import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { getErrorStatus } from "../_shared/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvoiceRow = {
  id: string;
  job_id: string;
  contractor_id: string;
  status: "draft" | "sent" | "paid" | "void" | "overdue";
  total_amount: number;
};

type ProfileRow = {
  id: string;
  business_name: string | null;
  stripe_connect_id: string | null;
  stripe_connect_onboarded: boolean | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing invoice token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate token and fetch invoice id
    const { data: tokenRow, error: tokenError } = await supabase
      .from("invoice_tokens")
      .select("invoice_id, expires_at")
      .eq("token", token)
      .single<{ invoice_id: string; expires_at: string }>();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, job_id, contractor_id, status, total_amount")
      .eq("id", tokenRow.invoice_id)
      .single<InvoiceRow>();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.status !== "sent") {
      return new Response(JSON.stringify({ error: "Invoice is not payable" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch contractor Stripe Connect configuration
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, business_name, stripe_connect_id, stripe_connect_onboarded")
      .eq("id", invoice.contractor_id)
      .single<ProfileRow>();

    if (profileError || !profile) {
      throw new Error("Failed to load contractor profile");
    }

    if (!profile.stripe_connect_id) {
      return new Response(JSON.stringify({ error: "Contractor is not configured for payouts" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.stripe_connect_onboarded) {
      return new Response(JSON.stringify({ error: "Contractor Stripe onboarding incomplete" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create Payment Intent on connected account
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: invoice.total_amount,
        currency: "cad",
        metadata: {
          invoice_id: invoice.id,
        },
      },
      {
        stripeAccount: profile.stripe_connect_id,
      },
    );

    const invoiceSummary = {
      id: invoice.id,
      total_amount: invoice.total_amount,
      contractor_name: profile.business_name ?? "ProsDispatch Contractor",
    };

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        invoice_summary: invoiceSummary,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const status = getErrorStatus(error);
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

    console.error("create-payment-intent error", { message });

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

