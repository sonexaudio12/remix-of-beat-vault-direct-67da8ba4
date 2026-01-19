import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadRequest {
  orderId: string;
  customerEmail: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, customerEmail }: DownloadRequest = await req.json();

    if (!orderId || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing orderId or customerEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify order exists and is completed
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          beat_id,
          license_tier_id,
          beat_title,
          license_name,
          download_count
        )
      `)
      .eq("id", orderId)
      .eq("customer_email", customerEmail)
      .eq("status", "completed")
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found or not completed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if download has expired
    if (order.download_expires_at && new Date(order.download_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Download link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get beats and license tiers for file paths
    const beatIds = order.order_items.map((item: any) => item.beat_id).filter(Boolean);
    const licenseTierIds = order.order_items.map((item: any) => item.license_tier_id).filter(Boolean);

    const { data: beats } = await supabase
      .from("beats")
      .select("id, mp3_file_path, wav_file_path, stems_file_path")
      .in("id", beatIds);

    const { data: licenseTiers } = await supabase
      .from("license_tiers")
      .select("id, type, license_pdf_path")
      .in("id", licenseTierIds);

    // Generate signed URLs for each purchased item
    const downloads = [];

    for (const item of order.order_items) {
      const beat = beats?.find((b: any) => b.id === item.beat_id);
      const licenseTier = licenseTiers?.find((lt: any) => lt.id === item.license_tier_id);

      if (!beat || !licenseTier) continue;

      const itemDownloads: any = {
        beatTitle: item.beat_title,
        licenseName: item.license_name,
        files: [],
      };

      // Get files based on license type
      const filesToInclude: string[] = [];

      switch (licenseTier.type) {
        case "stems":
          if (beat.stems_file_path) filesToInclude.push(beat.stems_file_path);
          // Falls through to include WAV and MP3
        case "wav":
          if (beat.wav_file_path) filesToInclude.push(beat.wav_file_path);
          // Falls through to include MP3
        case "mp3":
          if (beat.mp3_file_path) filesToInclude.push(beat.mp3_file_path);
          break;
      }

      // Generate signed URLs for audio files
      for (const filePath of filesToInclude) {
        const { data: signedUrl, error: signError } = await supabase.storage
          .from("beats")
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (!signError && signedUrl) {
          const fileName = filePath.split("/").pop() || filePath;
          itemDownloads.files.push({
            name: fileName,
            url: signedUrl.signedUrl,
            type: fileName.endsWith(".zip") ? "stems" : fileName.endsWith(".wav") ? "wav" : "mp3",
          });
        }
      }

      // Generate signed URL for license PDF
      if (licenseTier.license_pdf_path) {
        const { data: pdfUrl, error: pdfError } = await supabase.storage
          .from("licenses")
          .createSignedUrl(licenseTier.license_pdf_path, 3600);

        if (!pdfError && pdfUrl) {
          itemDownloads.files.push({
            name: `License_${item.beat_title}_${licenseTier.type}.pdf`,
            url: pdfUrl.signedUrl,
            type: "license",
          });
        }
      }

      downloads.push(itemDownloads);

      // Increment download count
      await supabase
        .from("order_items")
        .update({ download_count: (item.download_count || 0) + 1 })
        .eq("id", item.id);
    }

    return new Response(
      JSON.stringify({
        order: {
          id: order.id,
          customerEmail: order.customer_email,
          total: order.total,
          createdAt: order.created_at,
          expiresAt: order.download_expires_at,
        },
        downloads,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Get download URLs error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
