import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvoiceRow = {
  id: string;
  job_id: string;
  contractor_id: string;
  invoice_number: string;
  date_issued: string | null;
  date_due: string | null;
  subtotal: number;
  tax_data: unknown;
  total_amount: number;
  pdf_url: string | null;
};

type InvoiceItemRow = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  tax_gst_rate?: number | null;
  tax_qst_rate?: number | null;
  preferred_language?: string | null;
};

type ClientRow = {
  id: string;
  name: string;
};

type PropertyRow = {
  id: string;
  address_line1: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
};

type JobRow = {
  id: string;
  title: string;
  client_id: string;
  property_id: string | null;
};

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    (amountCents || 0) / 100,
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { invoice_id: invoiceId } = await req.json();

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "Missing invoice_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
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

    // 2. Fetch items
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id)
      .order("created_at", { ascending: true })
      .returns<InvoiceItemRow[]>();

    if (itemsError) {
      throw new Error("Failed to load invoice items");
    }

    // 3. Fetch contractor profile
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, full_name, business_name, address_line1, address_line2, city, province, postal_code, tax_gst_rate, tax_qst_rate, preferred_language",
      )
      .eq("id", invoice.contractor_id)
      .single<ProfileRow>();

    // 4. Fetch job, client, property
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, client_id, property_id")
      .eq("id", invoice.job_id)
      .single<JobRow>();

    let client: ClientRow | null = null;
    let property: PropertyRow | null = null;

    if (job?.client_id) {
      const { data: clientRow } = await supabase
        .from("clients")
        .select("id, name")
        .eq("id", job.client_id)
        .single<ClientRow>();
      client = clientRow ?? null;
    }

    if (job?.property_id) {
      const { data: propertyRow } = await supabase
        .from("properties")
        .select("id, address_line1, city, province, postal_code")
        .eq("id", job.property_id)
        .single<PropertyRow>();
      property = propertyRow ?? null;
    }

    // 5. Build a simple PDF document (single page, textual layout)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();

    let cursorY = height - 50;
    const fontSizeTitle = 18;
    const fontSizeBody = 10;

    const drawText = (text: string, size = fontSizeBody, offsetX = 50) => {
      page.drawText(text, {
        x: offsetX,
        y: cursorY,
        size,
        font,
      });
      cursorY -= size + 4;
    };

    // Header
    const contractorName =
      profile?.business_name ||
      profile?.full_name ||
      "ProsDispatch Contractor";

    drawText(`Invoice ${invoice.invoice_number}`, fontSizeTitle);
    cursorY -= 8;
    drawText(contractorName, fontSizeBody);
    if (profile?.address_line1) {
      drawText(profile.address_line1);
    }
    const cityLine = [profile?.city, profile?.province, profile?.postal_code]
      .filter(Boolean)
      .join(", ");
    if (cityLine) {
      drawText(cityLine);
    }

    cursorY -= 10;
    drawText(
      `Bill To: ${client?.name ?? "Homeowner"}`,
      fontSizeBody,
    );
    if (property?.address_line1) {
      drawText(property.address_line1);
    }
    const propertyCityLine = [
      property?.city,
      property?.province,
      property?.postal_code,
    ]
      .filter(Boolean)
      .join(", ");
    if (propertyCityLine) {
      drawText(propertyCityLine);
    }

    cursorY -= 12;
    drawText(`Date Issued: ${invoice.date_issued ?? ""}`, fontSizeBody);
    drawText(`Due Date: ${invoice.date_due ?? ""}`, fontSizeBody);
    if (job?.title) {
      drawText(`Job: ${job.title}`, fontSizeBody);
    }

    cursorY -= 16;
    drawText("Line Items", fontSizeBody);
    drawText("Description / Qty × Unit / Amount", fontSizeBody);

    items?.forEach((item) => {
      cursorY -= 4;
      drawText(item.description, fontSizeBody);
      drawText(
        `  ${item.quantity} × ${formatCurrency(item.unit_price)} = ${formatCurrency(item.amount)}`,
        fontSizeBody,
        60,
      );
    });

    cursorY -= 16;
    drawText(`Subtotal: ${formatCurrency(invoice.subtotal)}`, fontSizeBody);

    const taxLines = Array.isArray(invoice.tax_data)
      ? (invoice.tax_data as Array<{ label: string; rate: number; amount: number }>)
      : [];

    taxLines.forEach((tax) => {
      drawText(
        `${tax.label} (${(tax.rate * 100).toFixed(2)}%): ${formatCurrency(
          tax.amount,
        )}`,
        fontSizeBody,
      );
    });

    drawText(`Total: ${formatCurrency(invoice.total_amount)}`, fontSizeBody);

    cursorY -= 24;
    drawText("Dispatch — Powered by ProsDispatch", fontSizeBody);

    const pdfBytes = await pdfDoc.save();

    // 6. Upload to storage bucket
    const path = `${invoice.contractor_id}/${invoice.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Failed to upload invoice PDF");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("invoices").getPublicUrl(path);

    const pdfUrl = publicUrl;

    return new Response(JSON.stringify({ pdf_url: pdfUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-invoice-pdf error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({
        error: "Failed to generate invoice PDF",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

