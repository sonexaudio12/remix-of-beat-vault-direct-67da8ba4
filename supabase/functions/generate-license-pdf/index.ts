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
  customerAddress?: string;
  purchaseDate: string;
  price: number;
  bpm?: number;
  genre?: string;
  // Producer settings (fetched from admin_settings)
  producerLegalName?: string;
  producerAlias?: string;
  producerJurisdiction?: string;
  // Preview mode
  preview?: boolean;
}

interface LicenseTerms {
  streamLimit: string;
  radioRights: boolean;
  videoRights: boolean;
  commercialRights: boolean;
  exclusiveRights: boolean;
  description: string;
  fileType: string;
}

function getLicenseTerms(licenseType: string): LicenseTerms {
  switch (licenseType.toLowerCase()) {
    case 'mp3':
      return { streamLimit: '5,000 streams', radioRights: false, videoRights: false, commercialRights: false, exclusiveRights: false, description: 'MP3 Lease License - Non-exclusive rights for personal and promotional use', fileType: 'MP3' };
    case 'wav':
      return { streamLimit: '50,000 streams', radioRights: true, videoRights: true, commercialRights: false, exclusiveRights: false, description: 'WAV Lease License - Non-exclusive rights with radio and video broadcasting', fileType: 'WAV' };
    case 'stems':
      return { streamLimit: '500,000 streams', radioRights: true, videoRights: true, commercialRights: true, exclusiveRights: false, description: 'Trackout/Stems License - Full commercial rights with individual track files', fileType: 'STEMS' };
    case 'exclusive':
      return { streamLimit: 'Unlimited', radioRights: true, videoRights: true, commercialRights: true, exclusiveRights: true, description: 'Exclusive License - Full ownership and exclusive rights transfer', fileType: 'WAV + STEMS' };
    case 'sound_kit':
      return { streamLimit: 'Unlimited', radioRights: true, videoRights: true, commercialRights: true, exclusiveRights: false, description: 'Sound Kit License - Royalty-free usage in your productions', fileType: 'ZIP' };
    default:
      return { streamLimit: '5,000 streams', radioRights: false, videoRights: false, commercialRights: false, exclusiveRights: false, description: 'Standard Lease License', fileType: 'MP3' };
  }
}

/**
 * Build the placeholder map from request data + admin settings.
 */
function buildPlaceholders(data: LicenseGenerationRequest): Record<string, string> {
  const purchaseDate = new Date(data.purchaseDate);
  const terms = getLicenseTerms(data.licenseType);

  return {
    '{CONTRACT_DATE}': purchaseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    '{CURRENT_YEAR}': String(purchaseDate.getFullYear()),
    '{CUSTOMER_FULLNAME}': data.customerName || data.customerEmail,
    '{CUSTOMER_EMAIL}': data.customerEmail,
    '{CUSTOMER_ADDRESS}': data.customerAddress || 'N/A',
    '{PRODUCT_TITLE}': data.itemTitle,
    '{LICENSE_NAME}': data.licenseName,
    '{FILE_TYPE}': terms.fileType,
    '{PRODUCT_PRICE}': `$${data.price.toFixed(2)}`,
    '{ORDER_ID}': data.orderId,
    '{PRODUCT_OWNER_FULLNAME}': data.producerLegalName || 'N/A',
    '{PRODUCER_ALIAS}': data.producerAlias || 'SonexLite',
    '{STATE_PROVINCE_COUNTRY}': data.producerJurisdiction || 'N/A',
  };
}

/**
 * Replace placeholder text in every page of the PDF using pdf-lib's page.drawText overlay approach.
 * Since pdf-lib cannot edit existing text, we use a two-pass strategy:
 * 1. Extract text content via the PDF operators
 * 2. Overlay replacement text on known placeholder positions
 *
 * For a simpler and more reliable approach, we'll scan the raw PDF content stream bytes
 * and do text replacement at the content-stream level.
 */
async function replaceTextInPdf(pdfBytes: Uint8Array, placeholders: Record<string, string>): Promise<Uint8Array> {
  // Convert PDF bytes to string for text replacement in content streams
  // This works because placeholder text like {CUSTOMER_FULLNAME} will appear as literal text in the PDF content stream
  let pdfString = '';
  const decoder = new TextDecoder('latin1');
  pdfString = decoder.decode(pdfBytes);

  let modified = false;
  for (const [placeholder, value] of Object.entries(placeholders)) {
    // Escape special PDF characters in replacement value
    const safeValue = value
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    
    // Replace in both regular text strings (text) and hex strings
    if (pdfString.includes(placeholder)) {
      pdfString = pdfString.replaceAll(placeholder, safeValue);
      modified = true;
    }
  }

  if (!modified) {
    console.log("No placeholders found in PDF template - returning original with overlay page");
    return pdfBytes;
  }

  console.log("Placeholder replacement completed in PDF content streams");
  const encoder = new TextEncoder();
  // Encode back to latin1 bytes
  const resultBytes = new Uint8Array(pdfString.length);
  for (let i = 0; i < pdfString.length; i++) {
    resultBytes[i] = pdfString.charCodeAt(i);
  }
  return resultBytes;
}

async function generateFromTemplate(
  supabase: any,
  templateFilePath: string,
  data: LicenseGenerationRequest
): Promise<Uint8Array> {
  const { data: fileData, error } = await supabase.storage
    .from('licenses')
    .download(templateFilePath);

  if (error) throw new Error(`Failed to download template: ${error.message}`);

  let templateBytes = new Uint8Array(await fileData.arrayBuffer());
  const placeholders = buildPlaceholders(data);

  // Replace placeholders in the PDF
  templateBytes = await replaceTextInPdf(templateBytes, placeholders);

  // Load the modified PDF and add a certificate overlay page
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  if (pages.length === 0) throw new Error("Template PDF has no pages");

  // Add a certificate overlay page at the end
  const page = pdfDoc.addPage([612, 792]);
  const { height } = page.getSize();
  let y = height - 60;
  const leftMargin = 50;
  const lineHeight = 18;

  const purchaseDate = new Date(data.purchaseDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

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
    ["Producer:", `${data.producerAlias || 'SonexLite'} (${data.producerLegalName || 'N/A'})`],
    ["Governing Law:", data.producerJurisdiction || 'N/A'],
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
  page.drawText(`${data.producerAlias || 'Sonex Beats'} - All Rights Reserved`, {
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

  const producerAlias = data.producerAlias || 'SonexLite';
  const producerLegalName = data.producerLegalName || producerAlias;
  const jurisdiction = data.producerJurisdiction || 'the applicable jurisdiction';

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
  page.drawText(`Producer: ${producerLegalName} a/k/a "${producerAlias}" ("Licensor")`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  y -= lineHeight;
  page.drawText(`Licensee: ${data.customerName || data.customerEmail} ("Licensee")`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  y -= lineHeight;
  page.drawText(`Email: ${data.customerEmail}`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  if (data.customerAddress) {
    y -= lineHeight;
    page.drawText(`Address: ${data.customerAddress}`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
  }

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
  page.drawText(`File Format: ${terms.fileType}`, { x: leftMargin + 20, y, size: 11, font: timesRoman });
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
    `1. Credit Requirement: The Licensee must credit the Producer as "prod. by ${producerAlias}"`,
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
    "",
    `6. Governing Law: This agreement shall be governed by the laws of ${jurisdiction}.`,
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
  page.drawText(`${producerAlias} - All Rights Reserved`, { x: leftMargin, y, size: 9, font: timesRomanBold, color: rgb(0.2, 0.1, 0.4) });

  return await pdfDoc.save();
}

/**
 * Fetch producer settings from admin_settings table.
 */
async function fetchProducerSettings(supabase: any): Promise<{
  producerLegalName: string;
  producerAlias: string;
  producerJurisdiction: string;
}> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['producer_legal_name', 'producer_alias', 'producer_jurisdiction']);

  if (error) {
    console.error("Error fetching producer settings:", error);
    return { producerLegalName: '', producerAlias: 'SonexLite', producerJurisdiction: '' };
  }

  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.setting_key] = row.setting_value;
  }

  return {
    producerLegalName: map['producer_legal_name'] || '',
    producerAlias: map['producer_alias'] || 'SonexLite',
    producerJurisdiction: map['producer_jurisdiction'] || '',
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Allow service role key OR authenticated admin user
    let isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
    let isAdmin = false;

    if (!isServiceRole && authHeader?.startsWith('Bearer ')) {
      // Verify user JWT and check admin role
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await userClient.auth.getUser(token);
      if (!userError && userData?.user) {
        const { data: roleData } = await userClient.rpc('is_admin');
        isAdmin = roleData === true;
      }
    }

    if (!isServiceRole && !isAdmin) {
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
    if (data.customerAddress) data.customerAddress = sanitizeForPdf(data.customerAddress);

    console.log("Generating license PDF for:", {
      orderId: data.orderId, itemTitle: data.itemTitle,
      licenseName: data.licenseName, licenseType: data.licenseType,
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch producer settings and merge into request data
    const producerSettings = await fetchProducerSettings(supabase);
    data.producerLegalName = data.producerLegalName || producerSettings.producerLegalName;
    data.producerAlias = data.producerAlias || producerSettings.producerAlias;
    data.producerJurisdiction = data.producerJurisdiction || producerSettings.producerJurisdiction;

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

    // For preview mode, return PDF directly without storing
    if (data.preview) {
      return new Response(pdfBytes, {
        status: 200,
        headers: { "Content-Type": "application/pdf", ...corsHeaders },
      });
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
