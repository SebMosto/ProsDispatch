// Using Deno 2 compatible imports
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://cdn.skypack.dev/pdf-lib?dts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { calculateInvoiceTotals } from "../_shared/taxCalculator.ts";
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "Missing invoice_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch Invoice & Related Data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_items(*), jobs(client_id, property_id)")
      .eq("id", invoice_id)
      .eq("contractor_id", user.id)
      .single();

    if (invoiceError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.status !== "draft") {
       return new Response(JSON.stringify({ error: "Invoice is not in draft status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const { data: client } = await supabase.from("clients").select("*").eq("id", invoice.jobs.client_id).single();

    // 3. Calculate Totals (Canonical)
    const totals = calculateInvoiceTotals(invoice.invoice_items);

    // 4. Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const drawText = (text: string, x: number, y: number, size: number = 12) => {
        page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
    };

    let y = height - 50;
    drawText(`INVOICE ${invoice.invoice_number}`, 50, y, 20);
    y -= 40;

    drawText(`From: ${profile?.business_name || profile?.full_name || 'Contractor'}`, 50, y);
    y -= 20;
    drawText(`To: ${client?.name || 'Client'}`, 50, y);
    y -= 20;
    drawText(`Date: ${new Date().toLocaleDateString()}`, 50, y);
    y -= 40;

    // Items Header
    drawText("Description", 50, y, 10);
    drawText("Amount", 400, y, 10);
    y -= 20;

    // Items
    for (const item of invoice.invoice_items) {
        drawText(item.description, 50, y, 10);
        drawText(`$${(item.amount / 100).toFixed(2)}`, 400, y, 10);
        y -= 20;
    }

    y -= 20;
    drawText(`Subtotal: $${(totals.subtotal / 100).toFixed(2)}`, 350, y);
    y -= 20;

    for (const tax of totals.tax_data) {
       drawText(`${tax.label} (${(tax.rate * 100).toFixed(3)}%): $${(tax.amount / 100).toFixed(2)}`, 350, y);
       y -= 20;
    }

    drawText(`Total: $${(totals.total / 100).toFixed(2)}`, 350, y, 14);

    const pdfBytes = await pdfDoc.save();

    // 5. Upload PDF
    const fileName = `${invoice.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from("invoices").getPublicUrl(fileName);

    // 6. Update Database & Create Token
    const token = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: updateError } = await supabase.from("invoices").update({
      status: "sent",
      pdf_url: publicUrl,
      subtotal: totals.subtotal,
      tax_data: totals.tax_data,
      total_amount: totals.total,
      date_issued: now.split("T")[0], // YYYY-MM-DD
    }).eq("id", invoice_id);

    if (updateError) {
      throw new Error(`DB Update failed: ${updateError.message}`);
    }

    const { error: tokenError } = await supabase.from("invoice_tokens").insert({
      token,
      invoice_id: invoice_id,
    });

    if (tokenError) {
       throw new Error(`Token creation failed: ${tokenError.message}`);
    }

    // 7. Send Email
    if (client?.email) {
      const resend = new Resend(resendApiKey);

      // Use standard testing email if domain not verified, or assume it works.
      // Usually defaults to 'onboarding@resend.dev' if strictly testing, but for prod we want real one.
      // I'll use a descriptive FROM. If domain isn't allowed, Resend throws 403.
      // I'll wrap in try/catch to not fail the whole process if email fails (soft fail).
      try {
        await resend.emails.send({
          from: "Invoices <noreply@prosdispatch.com>",
          to: client.email,
          subject: `Invoice ${invoice.invoice_number}`,
          html: `
            <h1>New Invoice Available</h1>
            <p>You have received an invoice from ${profile?.business_name || profile?.full_name}.</p>
            <p>Total: $${(totals.total / 100).toFixed(2)}</p>
            <p><a href="${publicUrl}">View Invoice PDF</a></p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Continue, do not fail request.
      }
    }

    return new Response(JSON.stringify({ success: true, token, pdfUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in finalize-invoice:", error);
    const statusCode = getErrorStatus(error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
