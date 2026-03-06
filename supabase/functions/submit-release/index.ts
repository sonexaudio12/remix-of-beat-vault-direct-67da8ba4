import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateUPC(): string {
  let upc = '';
  for (let i = 0; i < 12; i++) upc += Math.floor(Math.random() * 10).toString();
  return upc;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error('Unauthorized');

    const body = await req.json();
    const {
      tenant_id, title, artist_name, featuring_artists, genre,
      release_date, is_explicit, isrc, audio_file_url, cover_art_url,
      selected_stores
    } = body;

    if (!title || !artist_name || !genre || !release_date || !audio_file_url || !cover_art_url) {
      throw new Error('Missing required fields');
    }

    if (!selected_stores || selected_stores.length === 0) {
      throw new Error('At least one store must be selected');
    }

    const upc = isrc || generateUPC();

    // Create release
    const { data: release, error: relErr } = await supabase
      .from('releases')
      .insert({
        tenant_id: tenant_id || null,
        user_id: user.id,
        title,
        artist_name,
        featuring_artists: featuring_artists || null,
        genre,
        release_date,
        is_explicit: is_explicit || false,
        upc,
        cover_art_url,
        status: 'submitted',
      })
      .select()
      .single();

    if (relErr) throw relErr;

    // Create track
    const { error: trackErr } = await supabase
      .from('release_tracks')
      .insert({
        release_id: release.id,
        title,
        audio_file_url,
        isrc: isrc || null,
        track_number: 1,
      });

    if (trackErr) throw trackErr;

    // Create store entries
    const storeRows = selected_stores.map((store: string) => ({
      release_id: release.id,
      store_name: store,
      status: 'pending',
    }));

    const { error: storeErr } = await supabase
      .from('release_stores')
      .insert(storeRows);

    if (storeErr) throw storeErr;

    // Placeholder: In production, call the distribution API here (FUGA, Symphonic, etc.)

    return new Response(JSON.stringify({ success: true, release_id: release.id, upc }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
