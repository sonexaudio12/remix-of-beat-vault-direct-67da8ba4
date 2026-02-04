import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Simple hash function for IP anonymization
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

export function usePageTracking() {
  const location = useLocation();
  const trackedPaths = useRef(new Set<string>());

  useEffect(() => {
    const trackPageView = async () => {
      const path = location.pathname;
      
      // Don't track admin pages or if already tracked this session
      if (path.startsWith('/admin') || trackedPaths.current.has(path)) {
        return;
      }

      trackedPaths.current.add(path);

      try {
        await supabase.from('site_views').insert({
          page_path: path,
          session_id: getSessionId(),
          referrer: document.referrer || null,
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname]);
}

export function useBeatPlayTracking() {
  const trackedPlays = useRef(new Set<string>());

  const trackPlay = async (beatId: string) => {
    // Only track once per beat per session
    const key = `${beatId}-${getSessionId()}`;
    if (trackedPlays.current.has(key)) {
      return;
    }

    trackedPlays.current.add(key);

    try {
      await supabase.from('beat_plays').insert({
        beat_id: beatId,
        session_id: getSessionId(),
      });
    } catch (error) {
      console.error('Error tracking beat play:', error);
    }
  };

  return { trackPlay };
}
