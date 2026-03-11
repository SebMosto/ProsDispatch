import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvoiceRow = {
  id: string;
  job_id: string;
  contractor_id: string;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "void" | "overdue";
  subtotal: number;
  tax_data: unknown;
  total_amount: number;
  pdf_url: string | null;
  date_issued: string | null;
  date_due: string | null;
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  preferred_language?: string | null;
  tax_gst_rate?: number | null;
  tax_qst_rate?: number | null;
};

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  preferred_language: string | null;
};

type JobRow = {
  id: string;
  title: string;
  client_id: string;
};

type TaxLine = {
  label: string;
  rate: number;
  amount: number;
};

const roundHalfUp = (value: number) => Math.round(value + Number.EPSILON);

const calculateTotals = (
  items: InvoiceItemRow[],
  gstRate: number,
  qstRate: number,
): { subtotal: number; taxData: TaxLine[]; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const taxes: TaxLine[] = [];

  const gst = roundHalfUp(subtotal * gstRate);
  if (gst > 0) {
    taxes.push({
      label: "GST",
      rate: gstRate,
      amount: gst,
    });
  }

  let qst = 0;
  if (qstRate > 0) {
    qst = roundHalfUp(subtotal * qstRate);
    if (qst > 0) {
      taxes.push({
        label: "QST",
        rate: qstRate,
        amount: qst,
      });
    }
  }

  const total = subtotal + gst + qst;

  return {
    subtotal,
    taxData: taxes,
    total,
  };
};

const buildEmailContent = (opts: {
  contractorName: string;
  clientName: string;
  jobTitle: string;
  invoiceNumber: string;
  totalFormatted: string;
  payUrl: string;
  language: "en" | "fr";
}) => {
  const {
    contractorName,
    clientName,
    jobTitle,
    invoiceNumber,
    totalFormatted,
    payUrl,
    language,
  } = opts;

  if (language === "fr") {
    return {
      subject: `Facture ${invoiceNumber} – ${contractorName}`,
      html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto;">
        <h1 style="font-size: 20px; margin-bottom: 8px;">Nouvelle facture de ${contractorName}</h1>
        <p style="margin: 0 0 8px;">Bonjour ${clientName},</p>
        <p style="margin: 0 0 8px;">
          Votre entrepreneur vous a envoyé une facture pour le mandat <strong>${jobTitle}</strong>.
        </p>
        <p style="margin: 0 0 8px;">
          <strong>Facture&nbsp;:</strong> ${invoiceNumber}<br/>
          <strong>Montant total&nbsp;:</strong> ${totalFormatted}
        </p>
        <p style="margin: 16px 0;">
          <a href="${payUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;">
            Payer maintenant
          </a>
        </p>
        <p style="margin: 16px 0 0; font-size: 12px; color:#64748b;">
          Ce lien vous permet de payer sans créer de compte. Si vous avez des questions, veuillez contacter directement votre entrepreneur.
        </p>
        <p style="margin-top: 24px; font-size: 11px; color:#94a3b8;">Dispatch • ProsDispatch</p>
      </div>
    `,
    };
  }

  return {
    subject: `Invoice ${invoiceNumber} from ${contractorName}`,
    html: `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">New invoice from ${contractorName}</h1>
      <p style="margin: 0 0 8px;">Hi ${clientName},</p>
      <p style="margin: 0 0 8px;">
        Your contractor has sent you an invoice for <strong>${jobTitle}</strong>.
      </p>
      <p style="margin: 0 0 8px;">
        <strong>Invoice:</strong> ${invoiceNumber}<br/>
        <strong>Total:</strong> ${totalFormatted}
      </p>
      <p style="margin: 16px 0;">
        <a href="${payUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;">
          Pay now
        </a>
      </p>
      <p style="margin: 16px 0 0; font-size: 12px; color:#64748b;">
        This link lets you pay without creating an account. If you have questions, please contact your contractor directly.
      </p>
      <p style="margin-top: 24px; font-size: 11px; color:#94a3b8;">Dispatch • ProsDispatch</p>
    </div>
  `,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

    if (!supabaseUrl || !anonKey || !serviceKey || !resendApiKey) {
      throw new Error("Missing environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticated client for the contractor
    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for privileged operations
    const service = createClient(supabaseUrl, serviceKey);

    // 1. Authenticate contractor
    const {
      data: { user },
      error: authError,
    } = await authed.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id: invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Missing invoice_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Load invoice + ownership check
    const { data: invoice, error: invoiceError } = await service
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single<InvoiceRow>();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.contractor_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.status !== "draft") {
      return new Response(JSON.stringify({ error: "Invoice is not in draft status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Load items (must have at least one)
    const { data: items, error: itemsError } = await service
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id)
      .returns<InvoiceItemRow[]>();

    if (itemsError) {
      throw new Error("Failed to load invoice items");
    }
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Invoice must have at least one line item" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Calculate totals based on contractor tax configuration
    const { data: profile } = await service
      .from("profiles")
      .select("id, full_name, business_name, preferred_language, tax_gst_rate, tax_qst_rate")
      .eq("id", invoice.contractor_id)
      .single<ProfileRow>();

    const gstRate = profile?.tax_gst_rate ?? 0.05;
    const qstRate = profile?.tax_qst_rate ?? 0.0;

    const { subtotal, taxData, total } = calculateTotals(items, gstRate, qstRate);

    const today = new Date().toISOString().slice(0, 10);

    // 5. Generate PDF via internal Edge Function call
    const pdfResponse = await fetch(`${siteUrl}/functions/v1/generate-invoice-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ invoice_id: invoice.id }),
    });

    if (!pdfResponse.ok) {
      throw new Error("Failed to generate invoice PDF");
    }

    const pdfPayload = await pdfResponse.json();
    const pdfUrl = pdfPayload?.pdf_url as string | undefined;

    // 6. Create invoice token (NanoID-like, 21 chars)
    const rawToken = crypto.randomUUID().replace(/-/g, "");
    const token = rawToken.slice(0, 21);

    const { error: tokenError } = await service.from("invoice_tokens").insert({
      token,
      invoice_id: invoice.id,
    });

    if (tokenError) {
      throw new Error("Failed to create invoice token");
    }

    const payUrl = `${siteUrl.replace(/\/$/, "")}/pay/${token}`;

    // 7. Update invoice with final totals and SENT status
    const { error: updateError } = await service
      .from("invoices")
      .update({
        status: "sent",
        subtotal,
        tax_data: taxData,
        total_amount: total,
        pdf_url: pdfUrl ?? invoice.pdf_url,
        date_issued: today,
        date_due: today,
      })
      .eq("id", invoice.id);

    if (updateError) {
      throw new Error("Failed to finalize invoice");
    }

    // 8. Email homeowner
    // Fetch job and client details
    const { data: job } = await service
      .from("jobs")
      .select("id, title, client_id")
      .eq("id", invoice.job_id)
      .single<JobRow>();

    let client: ClientRow | null = null;
    if (job?.client_id) {
      const { data: clientRow } = await service
        .from("clients")
        .select("id, name, email, preferred_language")
        .eq("id", job.client_id)
        .single<ClientRow>();
      client = clientRow ?? null;
    }

    if (!client?.email) {
      // No email to send to; treat as non-fatal but report error
      console.error("Invoice finalized but client has no email", {
        invoice_id: invoice.id,
        client_id: client?.id,
      });
    } else {
      const resend = new Resend(resendApiKey);
      const language =
        (client.preferred_language ?? profile?.preferred_language ?? "en").startsWith("fr")
          ? "fr"
          : "en";

      const contractorName = profile?.business_name ?? profile?.full_name ?? "Your Contractor";
      const totalFormatted = new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", {
        style: "currency",
        currency: "CAD",
      }).format(total / 100);

      const email = buildEmailContent({
        contractorName,
        clientName: client.name,
        jobTitle: job?.title ?? "",
        invoiceNumber: invoice.invoice_number,
        totalFormatted,
        payUrl,
        language,
      });

      const { error: emailError } = await resend.emails.send({
        from: "ProsDispatch <noreply@prosdispatch.com>",
        to: [client.email],
        subject: email.subject,
        html: email.html,
      });

      if (emailError) {
        console.error("Failed to send invoice email", {
          invoice_id: invoice.id,
          message: emailError.message,
        });
      }
    }

    // 9. Transition job status to invoiced via existing state machine
    if (invoice.job_id) {
      await service.rpc("transition_job_state", {
        job_id: invoice.job_id,
        new_status: "invoiced",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoice.id,
        status: "sent",
        token,
        pdf_url: pdfUrl ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("finalize-and-send-invoice error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({
        error: "Failed to finalize and send invoice",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

