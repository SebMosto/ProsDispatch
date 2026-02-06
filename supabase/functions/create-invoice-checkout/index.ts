// supabase/functions/create-invoice-checkout/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createCheckoutSession, Stripe } from "../_shared/stripe.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const siteUrl = Deno.env.get("SITE_URL");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const { invoiceToken, returnUrl } = await req.json();

    if (!invoiceToken) throw new Error("Missing invoiceToken");
    if (!returnUrl) throw new Error("Missing returnUrl");

    // Validate returnUrl
    validateReturnUrl(returnUrl, siteUrl);

    // Use Anon Key for token validation (respects RLS)
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    // 1. Fetch Invoice using token-based lookup
    const { data: invoices, error: invoiceError } = await supabaseAnon
      .rpc('get_invoice_by_token', { access_token: invoiceToken });

    if (invoiceError || !invoices || invoices.length !== 1) {
      console.error("Invoice fetch error:", invoiceError);
      throw new Error("Invalid or expired invoice token");
    }

    const invoice = invoices[0];

    if (invoice.status === 'paid') {
       throw new Error("Invoice is already paid");
    }

    // 2. Fetch Contractor Profile for Stripe Account ID using admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: contractor, error: contractorError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", invoice.contractor_id)
      .single();

    if (contractorError || !contractor) {
      console.error("Contractor fetch error:", contractorError);
      throw new Error("Contractor not found");
    }

    if (!contractor.stripe_account_id) {
      throw new Error("Contractor is not connected to Stripe");
    }

    // 3. Create Session
    // We use a single line item for the total amount to avoid rounding issues
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Invoice #${invoice.invoice_number}`,
              description: `Payment for Invoice #${invoice.invoice_number}`,
            },
            unit_amount: Math.round(invoice.total_amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        invoice_id: invoice.id,
      },
    };

    // Use Direct Charges by passing the connected account ID
    const session = await createCheckoutSession(sessionParams, contractor.stripe_account_id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in create-invoice-checkout:", error);
    const statusCode = getErrorStatus(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    // Sanitize error message for public
    let publicMessage = "Internal Server Error";
    if (statusCode < 500) {
        publicMessage = message;
    }

    return new Response(JSON.stringify({ error: publicMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
