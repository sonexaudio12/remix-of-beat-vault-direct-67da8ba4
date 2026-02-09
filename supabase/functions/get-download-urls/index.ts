import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

 // Simple in-memory rate limiting (per IP, resets on function cold start)
 const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
 const RATE_LIMIT_MAX = 10;
 const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
 
 function checkRateLimit(ip: string): boolean {
   const now = Date.now();
   const entry = rateLimitMap.get(ip);
   
   if (!entry || now > entry.resetTime) {
     rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
     return true;
   }
   
   if (entry.count >= RATE_LIMIT_MAX) {
     return false;
   }
   
   entry.count++;
   return true;
 }
 
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
     // Rate limiting by IP
     const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("cf-connecting-ip") || 
                      "unknown";
     
     if (!checkRateLimit(clientIp)) {
       console.warn(`Rate limit exceeded for IP: ${clientIp}`);
       return new Response(
         JSON.stringify({ error: "Too many download attempts. Please try again later." }),
         { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
    const { orderId, customerEmail }: DownloadRequest = await req.json();

    if (!orderId || !customerEmail) {
       console.warn(`Invalid request - missing orderId or customerEmail from IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Missing orderId or customerEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     // Create authenticated client to check if user is logged in
     const authHeader = req.headers.get("Authorization");
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 
     // Service role client for database operations
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // If auth header present, validate the user
     let authenticatedEmail: string | null = null;
     if (authHeader?.startsWith("Bearer ")) {
       const userClient = createClient(supabaseUrl, supabaseAnonKey, {
         global: { headers: { Authorization: authHeader } }
       });
       const token = authHeader.replace("Bearer ", "");
       const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
       
       if (!claimsError && claimsData?.claims?.email) {
         authenticatedEmail = claimsData.claims.email as string;
       }
     }
 
     // If user is authenticated, verify they're requesting their own order
     if (authenticatedEmail && authenticatedEmail.toLowerCase() !== customerEmail.toLowerCase()) {
       console.warn(`Email mismatch: authenticated as ${authenticatedEmail} but requesting ${customerEmail}`);
       return new Response(
         JSON.stringify({ error: "Unauthorized: email mismatch" }),
         { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
    // Verify order exists and is completed
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          item_type,
          beat_id,
          license_tier_id,
          beat_title,
          license_name,
          sound_kit_id,
          item_title,
          download_count
        )
      `)
      .eq("id", orderId)
      .eq("customer_email", customerEmail)
      .eq("status", "completed")
      .single();

    if (orderError || !order) {
       console.warn(`Order not found for orderId: ${orderId}, email: ${customerEmail}, IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Order not found or not completed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     console.log(`Download request authorized for order: ${orderId}, email: ${customerEmail}`);
 
    // Check if download has expired
    if (order.download_expires_at && new Date(order.download_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Download link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get beats and license tiers for file paths
    const beatIds = order.order_items
      .filter((item: any) => item.item_type === 'beat')
      .map((item: any) => item.beat_id)
      .filter(Boolean);
    
    const licenseTierIds = order.order_items
      .filter((item: any) => item.item_type === 'beat')
      .map((item: any) => item.license_tier_id)
      .filter(Boolean);

    const soundKitIds = order.order_items
      .filter((item: any) => item.item_type === 'sound_kit')
      .map((item: any) => item.sound_kit_id)
      .filter(Boolean);

    // Fetch beats if needed
    let beats: any[] = [];
    if (beatIds.length > 0) {
      const { data } = await supabase
        .from("beats")
        .select("id, mp3_file_path, wav_file_path, stems_file_path")
        .in("id", beatIds);
      beats = data || [];
    }

    // Fetch license tiers if needed
    let licenseTiers: any[] = [];
    if (licenseTierIds.length > 0) {
      const { data } = await supabase
        .from("license_tiers")
        .select("id, type, license_pdf_path")
        .in("id", licenseTierIds);
      licenseTiers = data || [];
    }

    // Fetch sound kits if needed
    let soundKits: any[] = [];
    if (soundKitIds.length > 0) {
      const { data } = await supabase
        .from("sound_kits")
        .select("id, title, file_path")
        .in("id", soundKitIds);
      soundKits = data || [];
    }

    // Generate signed URLs for each purchased item
    const downloads = [];

    for (const item of order.order_items) {
      // Handle beat items
      if (item.item_type === 'beat' || (!item.item_type && item.beat_id)) {
        const beat = beats?.find((b: any) => b.id === item.beat_id);
        const licenseTier = licenseTiers?.find((lt: any) => lt.id === item.license_tier_id);

        if (!beat || !licenseTier) continue;

        const itemDownloads: any = {
          itemType: 'beat',
          title: item.beat_title || item.item_title,
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

        // Check for generated license PDF first
        const { data: genLicenseFiles } = await supabase.storage
          .from("licenses")
          .list(`generated/${orderId}`, { search: item.id });

        let foundGeneratedLicense = false;
        if (genLicenseFiles && genLicenseFiles.length > 0) {
          for (const lf of genLicenseFiles) {
            if (lf.name.includes(item.id)) {
              const licensePath = `generated/${orderId}/${lf.name}`;
              const { data: genPdfUrl, error: genPdfErr } = await supabase.storage
                .from("licenses")
                .createSignedUrl(licensePath, 3600);

              if (!genPdfErr && genPdfUrl) {
                itemDownloads.files.push({
                  name: `License_${item.beat_title || item.item_title}_${licenseTier.type}.pdf`,
                  url: genPdfUrl.signedUrl,
                  type: "license",
                });
                foundGeneratedLicense = true;
              }
            }
          }
        }

        // Fall back to static license PDF from tier
        if (!foundGeneratedLicense && licenseTier.license_pdf_path) {
          const { data: pdfUrl, error: pdfError } = await supabase.storage
            .from("licenses")
            .createSignedUrl(licenseTier.license_pdf_path, 3600);

          if (!pdfError && pdfUrl) {
            itemDownloads.files.push({
              name: `License_${item.beat_title || item.item_title}_${licenseTier.type}.pdf`,
              url: pdfUrl.signedUrl,
              type: "license",
            });
          }
        }

        downloads.push(itemDownloads);
      }
      // Handle sound kit items
      else if (item.item_type === 'sound_kit') {
        const soundKit = soundKits?.find((sk: any) => sk.id === item.sound_kit_id);

        if (!soundKit || !soundKit.file_path) continue;

        const itemDownloads: any = {
          itemType: 'sound_kit',
          title: soundKit.title || item.item_title,
          licenseName: 'Sound Kit',
          files: [],
        };

        // Generate signed URL for sound kit file
        const { data: signedUrl, error: signError } = await supabase.storage
          .from("soundkits")
          .createSignedUrl(soundKit.file_path, 3600);

        if (!signError && signedUrl) {
          const fileName = soundKit.file_path.split("/").pop() || `${soundKit.title}.zip`;
          itemDownloads.files.push({
            name: fileName,
            url: signedUrl.signedUrl,
            type: "soundkit",
          });
        }

        // Check for generated license PDF for this sound kit order item
        const { data: licenseFiles } = await supabase.storage
          .from("licenses")
          .list(`generated/${orderId}`, { search: item.id });

        if (licenseFiles && licenseFiles.length > 0) {
          for (const lf of licenseFiles) {
            if (lf.name.includes(item.id)) {
              const licensePath = `generated/${orderId}/${lf.name}`;
              const { data: licensePdfUrl, error: lpErr } = await supabase.storage
                .from("licenses")
                .createSignedUrl(licensePath, 3600);

              if (!lpErr && licensePdfUrl) {
                itemDownloads.files.push({
                  name: `License_${soundKit.title || 'SoundKit'}.pdf`,
                  url: licensePdfUrl.signedUrl,
                  type: "license",
                });
              }
            }
          }
        }

        downloads.push(itemDownloads);
      }

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
