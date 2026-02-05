-- Fix 1: Create rate limiting function for analytics tables
-- This prevents abuse of beat_plays and site_views tables

-- Create a function to check recent insert count per session
CREATE OR REPLACE FUNCTION public.check_analytics_rate_limit(
  p_session_id TEXT,
  p_table_name TEXT,
  p_max_count INT,
  p_window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  IF p_session_id IS NULL OR p_session_id = '' THEN
    RETURN TRUE; -- Allow if no session (but limit other ways)
  END IF;
  
  IF p_table_name = 'beat_plays' THEN
    SELECT COUNT(*) INTO recent_count
    FROM public.beat_plays
    WHERE session_id = p_session_id
      AND played_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  ELSIF p_table_name = 'site_views' THEN
    SELECT COUNT(*) INTO recent_count
    FROM public.site_views
    WHERE session_id = p_session_id
      AND viewed_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  ELSE
    RETURN TRUE;
  END IF;
  
  RETURN recent_count < p_max_count;
END;
$$;

-- Create trigger function to enforce rate limits on beat_plays
CREATE OR REPLACE FUNCTION public.enforce_beat_plays_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow max 100 plays per session per hour
  IF NOT public.check_analytics_rate_limit(NEW.session_id, 'beat_plays', 100, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded for beat plays';
  END IF;
  
  -- Ensure played_at is recent (within 1 minute of now)
  IF NEW.played_at < NOW() - INTERVAL '1 minute' OR NEW.played_at > NOW() + INTERVAL '1 minute' THEN
    NEW.played_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger function to enforce rate limits on site_views
CREATE OR REPLACE FUNCTION public.enforce_site_views_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow max 500 views per session per hour
  IF NOT public.check_analytics_rate_limit(NEW.session_id, 'site_views', 500, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded for site views';
  END IF;
  
  -- Ensure viewed_at is recent (within 1 minute of now)
  IF NEW.viewed_at < NOW() - INTERVAL '1 minute' OR NEW.viewed_at > NOW() + INTERVAL '1 minute' THEN
    NEW.viewed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS beat_plays_rate_limit ON public.beat_plays;
CREATE TRIGGER beat_plays_rate_limit
  BEFORE INSERT ON public.beat_plays
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_beat_plays_rate_limit();

DROP TRIGGER IF EXISTS site_views_rate_limit ON public.site_views;
CREATE TRIGGER site_views_rate_limit
  BEFORE INSERT ON public.site_views
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_site_views_rate_limit();

-- Fix 2: Remove overly permissive storage policy for soundkits
-- Sound kit files should only be accessible via signed URLs from edge functions
DROP POLICY IF EXISTS "Authenticated users can read purchased soundkits" ON storage.objects;

-- Ensure previews bucket remains public for preview audio
-- No changes needed for previews/covers buckets as they're already public