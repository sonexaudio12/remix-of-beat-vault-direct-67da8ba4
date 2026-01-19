import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Beat-specific fields
  bpm?: number;
  genre?: string;
}

interface LicenseTerms {
  streamLimit: string;
  radioRights: boolean;
  videoRights: boolean;
  commercialRights: boolean;
  exclusiveRights: boolean;
  keepAfterExclusive: boolean;
  description: string;
}

function getLicenseTerms(licenseType: string): LicenseTerms {
  switch (licenseType.toLowerCase()) {
    case 'mp3':
      return {
        streamLimit: '5,000 streams',
        radioRights: false,
        videoRights: false,
        commercialRights: false,
        exclusiveRights: false,
        keepAfterExclusive: false,
        description: 'MP3 Lease License - Non-exclusive rights for personal and promotional use',
      };
    case 'wav':
      return {
        streamLimit: '50,000 streams',
        radioRights: true,
        videoRights: true,
        commercialRights: false,
        exclusiveRights: false,
        keepAfterExclusive: false,
        description: 'WAV Lease License - Non-exclusive rights with radio and video broadcasting',
      };
    case 'stems':
      return {
        streamLimit: '500,000 streams',
        radioRights: true,
        videoRights: true,
        commercialRights: true,
        exclusiveRights: false,
        keepAfterExclusive: true,
        description: 'Trackout/Stems License - Full commercial rights with individual track files',
      };
    case 'exclusive':
      return {
        streamLimit: 'Unlimited',
        radioRights: true,
        videoRights: true,
        commercialRights: true,
        exclusiveRights: true,
        keepAfterExclusive: true,
        description: 'Exclusive License - Full ownership and exclusive rights transfer',
      };
    default:
      return {
        streamLimit: '5,000 streams',
        radioRights: false,
        videoRights: false,
        commercialRights: false,
        exclusiveRights: false,
        keepAfterExclusive: false,
        description: 'Standard Lease License',
      };
  }
}

async function generateLicensePdf(data: LicenseGenerationRequest): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { height } = page.getSize();
  
  const terms = getLicenseTerms(data.licenseType);
  const producerName = "SonexLite";
  const purchaseDate = new Date(data.purchaseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  let y = height - 60;
  const leftMargin = 50;
  const rightMargin = 562;
  const lineHeight = 18;
  const sectionGap = 25;
  
  // Header
  page.drawText("BEAT LICENSE AGREEMENT", {
    x: leftMargin,
    y,
    size: 20,
    font: timesRomanBold,
    color: rgb(0.2, 0.1, 0.4),
  });
  
  y -= 25;
  page.drawText(terms.description, {
    x: leftMargin,
    y,
    size: 10,
    font: timesRoman,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Divider line
  y -= 20;
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: rightMargin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  y -= sectionGap;
  
  // Agreement intro
  page.drawText("This License Agreement (\"Agreement\") is made effective as of:", {
    x: leftMargin,
    y,
    size: 11,
    font: timesRoman,
  });
  
  y -= lineHeight;
  page.drawText(purchaseDate, {
    x: leftMargin,
    y,
    size: 12,
    font: timesRomanBold,
    color: rgb(0.2, 0.1, 0.4),
  });
  
  y -= sectionGap;
  
  // Parties section
  page.drawText("BETWEEN:", {
    x: leftMargin,
    y,
    size: 12,
    font: timesRomanBold,
  });
  
  y -= lineHeight;
  page.drawText(`Producer: ${producerName} ("Licensor")`, {
    x: leftMargin + 20,
    y,
    size: 11,
    font: timesRoman,
  });
  
  y -= lineHeight;
  page.drawText(`Licensee: ${data.customerName || data.customerEmail} ("Licensee")`, {
    x: leftMargin + 20,
    y,
    size: 11,
    font: timesRoman,
  });
  
  y -= lineHeight;
  page.drawText(`Email: ${data.customerEmail}`, {
    x: leftMargin + 20,
    y,
    size: 11,
    font: timesRoman,
  });
  
  y -= sectionGap;
  
  // Licensed work section
  page.drawText("LICENSED WORK:", {
    x: leftMargin,
    y,
    size: 12,
    font: timesRomanBold,
  });
  
  y -= lineHeight;
  page.drawText(`Title: "${data.itemTitle}"`, {
    x: leftMargin + 20,
    y,
    size: 11,
    font: timesRomanBold,
  });
  
  if (data.itemType === 'beat' && data.bpm) {
    y -= lineHeight;
    page.drawText(`BPM: ${data.bpm} | Genre: ${data.genre || 'N/A'}`, {
      x: leftMargin + 20,
      y,
      size: 11,
      font: timesRoman,
    });
  }
  
  y -= lineHeight;
  page.drawText(`License Type: ${data.licenseName}`, {
    x: leftMargin + 20,
    y,
    size: 11,
    font: timesRoman,
  });
  
  y -= lineHeight;
  page.drawText(`Purchase Price: $${data.price.toFixed(2)}`, {
    x: leftMargin + 20,
    y,
    size: 11,
    font: timesRoman,
  });
  
  y -= lineHeight;
  page.drawText(`Order Reference: ${data.orderId}`, {
    x: leftMargin + 20,
    y,
    size: 10,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  y -= sectionGap;
  
  // Rights granted section
  page.drawText("RIGHTS GRANTED:", {
    x: leftMargin,
    y,
    size: 12,
    font: timesRomanBold,
  });
  
  y -= lineHeight;
  const rights = [
    `• Streaming Limit: ${terms.streamLimit}`,
    `• Radio Broadcasting: ${terms.radioRights ? 'Included' : 'Not included'}`,
    `• Music Video Rights: ${terms.videoRights ? 'Included' : 'Not included'}`,
    `• Commercial Use: ${terms.commercialRights ? 'Full commercial rights' : 'Non-commercial only'}`,
    `• Exclusivity: ${terms.exclusiveRights ? 'Exclusive rights - beat removed from sale' : 'Non-exclusive license'}`,
  ];
  
  for (const right of rights) {
    page.drawText(right, {
      x: leftMargin + 20,
      y,
      size: 11,
      font: timesRoman,
    });
    y -= lineHeight;
  }
  
  y -= sectionGap - lineHeight;
  
  // Terms section
  page.drawText("TERMS AND CONDITIONS:", {
    x: leftMargin,
    y,
    size: 12,
    font: timesRomanBold,
  });
  
  y -= lineHeight;
  const termsText = [
    "1. Credit Requirement: The Licensee must credit the Producer as \"prod. by SonexLite\"",
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
    if (line === "") {
      y -= 8;
    } else {
      page.drawText(line, {
        x: leftMargin + 20,
        y,
        size: 10,
        font: timesRoman,
      });
      y -= lineHeight - 3;
    }
  }
  
  // Footer
  y = 80;
  page.drawLine({
    start: { x: leftMargin, y: y + 20 },
    end: { x: rightMargin, y: y + 20 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  page.drawText("This is an automatically generated license agreement.", {
    x: leftMargin,
    y,
    size: 9,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  y -= 14;
  page.drawText(`Generated on ${new Date().toISOString().split('T')[0]} | Order: ${data.orderId}`, {
    x: leftMargin,
    y,
    size: 9,
    font: timesRoman,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  y -= 14;
  page.drawText("Sonex Beats - All Rights Reserved", {
    x: leftMargin,
    y,
    size: 9,
    font: timesRomanBold,
    color: rgb(0.2, 0.1, 0.4),
  });
  
  return await pdfDoc.save();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: LicenseGenerationRequest = await req.json();
    
    console.log("Generating license PDF for:", {
      orderId: data.orderId,
      itemTitle: data.itemTitle,
      licenseName: data.licenseName,
      customerEmail: data.customerEmail,
    });

    // Generate the PDF
    const pdfBytes = await generateLicensePdf(data);
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // Create filename for storage
    const sanitizedTitle = data.itemTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `generated/${data.orderId}/${data.orderItemId}_${sanitizedTitle}_License.pdf`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('licenses')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload license PDF: ${uploadError.message}`);
    }
    
    console.log(`License PDF uploaded: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        filePath: fileName,
        message: `License PDF generated for ${data.itemTitle}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error generating license PDF:", error);
    const message = error instanceof Error ? error.message : "Failed to generate license PDF";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
