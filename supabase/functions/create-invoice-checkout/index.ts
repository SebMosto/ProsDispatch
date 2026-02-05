import { createClient } from "jsr:@supabase/supabase-js@2";
import { initStripe, createCheckoutSession } from "../_shared/stripe.ts";
import { getErrorStatus } from "../_shared/errors.ts";
import { validateReturnUrl } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { invoiceToken, returnUrl } = await req.json();

    if (!invoiceToken || !returnUrl) {
      throw new Error("Missing invoiceToken or returnUrl");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const siteUrl = Deno.env.get("SITE_URL");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
        throw new Error("Missing required environment variables");
    }

    validateReturnUrl(returnUrl, siteUrl);

    // 1. Get Invoice using Anon Key (RPC)
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: invoices, error: invoiceError } = await supabaseAnon
      .rpc("get_invoice_by_token", { access_token: invoiceToken });

    if (invoiceError) {
        console.error("Error fetching invoice:", invoiceError);
        throw new Error("Failed to fetch invoice");
    }
    if (!invoices || invoices.length === 0) {
      throw new Error("Invalid or expired invoice token");
    }
    const invoice = invoices[0];

    if (invoice.status === 'paid') {
         return new Response(JSON.stringify({ error: "Invoice is already paid" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }

    // 2. Get Contractor's Stripe Account ID using Service Role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", invoice.contractor_id)
      .single();

    if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Failed to fetch contractor profile");
    }

    if (!profile?.stripe_account_id) {
        return new Response(JSON.stringify({ error: "Contractor has not connected a payment account." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }

    // 3. Create Checkout Session
    const stripe = initStripe();
    const session = await createCheckoutSession(stripe, {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "cad",
                    product_data: {
                        name: `Invoice #${invoice.invoice_number}`,
                        description: `Payment for Invoice ${invoice.invoice_number}`,
                    },
                    unit_amount: invoice.total_amount, // in cents
                },
                quantity: 1,
            },
        ],
        success_url: `${returnUrl}?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?status=canceled`,
        metadata: {
            invoice_id: invoice.id,
            contractor_id: invoice.contractor_id,
        },
    }, {
        stripeAccount: profile.stripe_account_id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    console.error("Error creating invoice checkout:", error);
    const status = getErrorStatus(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: status,
    });
  }
});
