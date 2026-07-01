import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useActivityTracking } from "./useActivityTracking";

export function usePageTracking() {
  const location = useLocation();
  const { trackActivity } = useActivityTracking();

  useEffect(() => {
    trackActivity({
      activityType: "page_viewed",
      details: {
        path: location.pathname,
        search: location.search,
      },
    });
  }, [location.pathname, location.search]);
}
