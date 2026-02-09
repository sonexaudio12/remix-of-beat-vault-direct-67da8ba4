import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sanitizeForPdf(text: string): string {
  if (!text) return '';
  return text.replace(/[\x00-\x1f\x7f]/g, '').substring(0, 500);
}

interface LicenseGenerationRequest {
  orderId: string;
  orderItemId: string;
  itemType: 'beat' | 'sound_kit';
  itemTitle: string;
  licenseName: string;
  licenseType: string;
  customerName: string;
  customerEmail: string;
  purchaseDate: string;
  price: number;
  bpm?: number;
  genre?: string;
}

interface LicenseTerms {
  streamLimit: string;
  radioRights: boolean;
  videoRights: boolean;
  commercialRights: boolean;
  exclusiveRights: boolean;
  description: string;
}

function getLicenseTerms(licenseType: string): LicenseTerms {
  switch (licenseType.toLowerCase()) {
    case 'mp3':
      return { streamLimit: '5,000 streams', radioRights: false, videoRights: false, commercialRights: false, exclusiveRights: false, description: 'MP3 Lease License - Non-exclusive rights for personal and promotional use' };
    case 'wav':
      return { streamLimit: '50,000 streams', radioRights: true, videoRights: true, commercialRights: false, exclusiveRights: false, description: 'WAV Lease License - Non-exclusive rights with radio and video broadcasting' };
    case 'stems':
      return { streamLimit: '500,000 streams', radioRights: true, videoRights: true, commercialRights: true, exclusiveRights: false, description: 'Trackout/Stems License - Full commercial rights with individual track files' };
    case 'exclusive':
      return { streamLimit: 'Unlimited', radioRights: true, videoRights: true, commercialRights: true, exclusiveRights: true, description: 'Exclusive License - Full ownership and exclusive rights transfer' };
    case 'sound_kit':
      return { streamLimit: 'Unlimited', radioRights: true, videoRights: true, commercialRights: true, exclusiveRights: false, description: 'Sound Kit License - Royalty-free usage in your productions' };
    default:
      return { streamLimit: '5,000 streams', radioRights: false, videoRights: false, commercialRights: false, exclusiveRights: false, description: 'Standard Lease License' };
  }
}

async function generateFromTemplate(
  supabase: any,
  templateFilePath: string,
  data: LicenseGenerationRequest
): Promise<Uint8Array> {
  // Download the template PDF
  const { data: fileData, error } = await supabase.storage
    .from('licenses')
    .download(templateFilePath);

  if (error) throw new Error(`Failed to download template: ${error.message}`);

  const templateBytes = new Uint8Array(await fileData.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  if (pages.length === 0) throw new Error("Template PDF has no pages");

  // Add an overlay page at the end with purchase details
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();
  let y = height - 60;
  const leftMargin = 50;
  const lineHeight = 18;

  const purchaseDate = new Date(data.purchaseDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Header
  page.drawText("LICENSE CERTIFICATE", {
    x: leftMargin, y, size: 20, font: helveticaBold, color: rgb(0.2, 0.1, 0.4),
  });

  y -= 30;
  page.drawLine({ start: { x: leftMargin, y }, end: { x: 562, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  y -= 25;
  page.drawText("This certificate confirms the following license purchase:", {
    x: leftMargin, y, size: 11, font: helvetica,
  });

  y -= 30;
  const fields = [
    ["Licensee (Buyer):", data.customerName || data.customerEmail],
    ["Email:", data.customerEmail],
    ["Licensed Work:", `"${data.itemTitle}"`],
    ["License Type:", data.licenseName],
    ["Purchase Date:", purchaseDate],
    ["Purchase Price:", `$${data.price.toFixed(2)}`],
    ["Order Reference:", data.orderId],
  ];

  if (data.itemType === 'beat' && data.bpm) {
    fields.splice(3, 0, ["BPM / Genre:", `${data.bpm} BPM | ${data.genre || 'N/A'}`]);
  }

  for (const [label, value] of fields) {
    page.drawText(label, { x: leftMargin, y, size: 10, font: helveticaBold });
    page.drawText(value, { x: leftMargin + 130, y, size: 10, font: helvetica });
    y -= lineHeight;
  }

  y -= 20;
  page.drawLine({ start: { x: leftMargin, y }, end: { x: 562, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  y -= 20;
  page.drawText("This is an automatically generated license certificate.", {
    x: leftMargin, y, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });
  y -= 14;
  page.drawText(`Generated on ${new Date().toISOString().split('T')[0]}`, {
    x: leftMargin, y, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });
  y -= 14;
  page.drawText("Sonex Beats - All Rights Reserved", {
    x: leftMargin, y, size: 9, font: helveticaBold, color: rgb(0.2, 0.1, 0.4),
  });

  return await pdfDoc.save();
}

async function generateFromScratch(data: LicenseGenerationRequest): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();
  const terms = getLicenseTerms(data.licenseType);
  const purchaseDate = new Date(data.purchaseDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let y = height - 60;
  const leftMargin = 50;
  const rightMargin = 562;
  const lineHeight = 18;
  const sectionGap = 25;

  page.drawText(data.itemType === 'sound_kit' ? "SOUND KIT LICENSE AGREEMENT" : "BEAT LICENSE AGREEMENT", {
    x: leftMargin, y, size: 20, font: timesRomanBold, color: rgb(0.2, 0.1, 0.4),
  });

  y -= 25;
  page.drawText(terms.description, { x: leftMargin, y, size: 10, font: timesRoman, color: rgb(0.4, 0.4, 0.4) });

  y -= 20;
  page.drawLine({ start: { x: leftMargin, y }, end: { x: rightMargin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  y -= sectionGap;
  page.drawText("This License Agreement is made effective as of:", { x: leftMargin, y, size: 11, font: timesRoman });
  y -= lineHeight;
  page.drawText(purchaseDate, { x: leftMargin, y, size: 12, font: timesRomanBold, color: rgb(0.2, 0.1, 0.4) });

  y -= sectionGap;
  page.drawText("BETWEEN:", { x: leftMargin, y, size: 12, font: timesRomanBold });
  y -= lineHeight;
  page.drawText(`Producer: SonexLite ("Licensor")`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  y -= lineHeight;
  page.drawText(`Licensee: ${data.customerName || data.customerEmail} ("Licensee")`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  y -= lineHeight;
  page.drawText(`Email: ${data.customerEmail}`, { x: leftMargin + 20, y, size: 11, font: timesRoman });

  y -= sectionGap;
  page.drawText("LICENSED WORK:", { x: leftMargin, y, size: 12, font: timesRomanBold });
  y -= lineHeight;
  page.drawText(`Title: "${data.itemTitle}"`, { x: leftMargin + 20, y, size: 11, font: timesRomanBold });

  if (data.itemType === 'beat' && data.bpm) {
    y -= lineHeight;
    page.drawText(`BPM: ${data.bpm} | Genre: ${data.genre || 'N/A'}`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  }

  y -= lineHeight;
  page.drawText(`License Type: ${data.licenseName}`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  y -= lineHeight;
  page.drawText(`Purchase Price: $${data.price.toFixed(2)}`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  y -= lineHeight;
  page.drawText(`Order Reference: ${data.orderId}`, { x: leftMargin + 20, y, size: 10, font: timesRoman, color: rgb(0.5, 0.5, 0.5) });

  y -= sectionGap;
  page.drawText("RIGHTS GRANTED:", { x: leftMargin, y, size: 12, font: timesRomanBold });
  y -= lineHeight;

  const rights = [
    `• Streaming Limit: ${terms.streamLimit}`,
    `• Radio Broadcasting: ${terms.radioRights ? 'Included' : 'Not included'}`,
    `• Music Video Rights: ${terms.videoRights ? 'Included' : 'Not included'}`,
    `• Commercial Use: ${terms.commercialRights ? 'Full commercial rights' : 'Non-commercial only'}`,
    `• Exclusivity: ${terms.exclusiveRights ? 'Exclusive rights - beat removed from sale' : 'Non-exclusive license'}`,
  ];

  for (const right of rights) {
    page.drawText(right, { x: leftMargin + 20, y, size: 11, font: timesRoman });
    y -= lineHeight;
  }

  y -= sectionGap - lineHeight;
  page.drawText("TERMS AND CONDITIONS:", { x: leftMargin, y, size: 12, font: timesRomanBold });
  y -= lineHeight;

  const termsText = [
    '1. Credit Requirement: The Licensee must credit the Producer as "prod. by SonexLite"',
    "   in all works using this beat, unless explicitly waived in writing.",
    "",
    "2. Ownership: The Producer retains ownership of the underlying composition and",
    "   master recording. This license grants usage rights only.",
    "",
    "3. Transferability: This license is non-transferable and may not be resold,",
    "   sublicensed, or assigned to any third party.",
    "",
    "4. Modifications: The Licensee may modify the beat for their production but may",
    "   not distribute the beat instrumentally without vocals.",
    "",
    `5. Stream Limits: Usage is limited to ${terms.streamLimit} across all platforms.`,
    "   Additional streams require a new license purchase.",
  ];

  for (const line of termsText) {
    if (line === "") { y -= 8; }
    else {
      page.drawText(line, { x: leftMargin + 20, y, size: 10, font: timesRoman });
      y -= lineHeight - 3;
    }
  }

  y = 80;
  page.drawLine({ start: { x: leftMargin, y: y + 20 }, end: { x: rightMargin, y: y + 20 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page.drawText("This is an automatically generated license agreement.", { x: leftMargin, y, size: 9, font: timesRoman, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  page.drawText(`Generated on ${new Date().toISOString().split('T')[0]} | Order: ${data.orderId}`, { x: leftMargin, y, size: 9, font: timesRoman, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  page.drawText("Sonex Beats - All Rights Reserved", { x: leftMargin, y, size: 9, font: timesRomanBold, color: rgb(0.2, 0.1, 0.4) });

  return await pdfDoc.save();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const data: LicenseGenerationRequest = await req.json();

    if (!data.orderId || !data.orderItemId || !data.itemTitle || !data.customerEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    data.itemTitle = sanitizeForPdf(data.itemTitle);
    data.customerName = sanitizeForPdf(data.customerName);
    data.customerEmail = sanitizeForPdf(data.customerEmail);
    data.licenseName = sanitizeForPdf(data.licenseName);

    console.log("Generating license PDF for:", {
      orderId: data.orderId, itemTitle: data.itemTitle,
      licenseName: data.licenseName, licenseType: data.licenseType,
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if an active template exists for this license type
    const templateType = data.itemType === 'sound_kit' ? 'sound_kit' : data.licenseType;
    const { data: template } = await supabase
      .from('license_templates')
      .select('file_path, is_active')
      .eq('type', templateType)
      .single();

    let pdfBytes: Uint8Array;

    if (template?.file_path && template?.is_active) {
      console.log(`Using uploaded template for type: ${templateType}`);
      pdfBytes = await generateFromTemplate(supabase, template.file_path, data);
    } else {
      console.log(`No active template found, generating from scratch`);
      pdfBytes = await generateFromScratch(data);
    }

    const sanitizedTitle = data.itemTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `generated/${data.orderId}/${data.orderItemId}_${sanitizedTitle}_License.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('licenses')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      throw new Error(`Failed to upload license PDF: ${uploadError.message}`);
    }

    console.log(`License PDF uploaded: ${fileName}`);

    return new Response(
      JSON.stringify({ success: true, filePath: fileName, message: `License PDF generated for ${data.itemTitle}` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error generating license PDF:", error);
    const message = error instanceof Error ? error.message : "Failed to generate license PDF";
    return new Response(JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
