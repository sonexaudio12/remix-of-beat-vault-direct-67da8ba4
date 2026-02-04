import { usePageTracking } from '@/hooks/useAnalyticsTracking';

export function PageTracker() {
  usePageTracking();
  return null;
}
