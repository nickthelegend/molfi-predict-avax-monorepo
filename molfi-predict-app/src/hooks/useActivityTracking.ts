import { supabase } from "@/integrations/supabase/db";

export type ActivityType = 
  | "alert_created"
  | "alert_deleted"
  | "alert_triggered"
  | "market_viewed"
  | "trade_executed"
  | "page_viewed"
  | "search_performed"
  | "filter_applied";

interface TrackActivityParams {
  activityType: ActivityType;
  details?: Record<string, any>;
}

/**
 * Sanitize details object to remove sensitive tokens and credentials
 */
function sanitizeDetails(details: Record<string, any> | undefined): Record<string, any> | null {
  if (!details) return null;

  const sanitized: Record<string, any> = {};
  
  // Sensitive patterns to strip from values
  const sensitivePatterns = [
    /__lovable_token=[^&\s]*/gi,
    /access_token=[^&\s]*/gi,
    /api_key=[^&\s]*/gi,
    /apikey=[^&\s]*/gi,
    /token=[^&\s]*/gi,
    /auth=[^&\s]*/gi,
    /password=[^&\s]*/gi,
    /secret=[^&\s]*/gi,
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g, // JWT pattern
  ];

  for (const [key, value] of Object.entries(details)) {
    // Skip sensitive keys entirely
    const sensitiveKeys = ['token', 'password', 'secret', 'apiKey', 'api_key', 'auth', 'authorization', 'credential'];
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      continue;
    }

    if (typeof value === 'string') {
      let sanitizedValue = value;
      
      // Strip sensitive patterns from string values
      for (const pattern of sensitivePatterns) {
        sanitizedValue = sanitizedValue.replace(pattern, '[REDACTED]');
      }
      
      // If the entire value was a token, skip it
      if (sanitizedValue === '[REDACTED]') {
        continue;
      }
      
      sanitized[key] = sanitizedValue;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      const nestedSanitized = sanitizeDetails(value);
      if (nestedSanitized && Object.keys(nestedSanitized).length > 0) {
        sanitized[key] = nestedSanitized;
      }
    } else {
      // Keep non-string, non-object values as-is
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

export function useActivityTracking() {
  const trackActivity = async ({ activityType, details }: TrackActivityParams) => {
    try {
      // Sanitize details to remove sensitive tokens
      const sanitizedDetails = sanitizeDetails(details);
      
      const activityData: any = {
        activity_type: activityType,
        details: sanitizedDetails,
      };

      // Get user agent from browser (safe to include)
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        activityData.user_agent = navigator.userAgent;
      }

      const { error } = await supabase
        .from("user_activity")
        .insert(activityData);

      if (error) {
        // Log error without sensitive details
        console.error("Failed to track activity:", error.message);
      }
    } catch (error) {
      // Log error without sensitive details
      console.error("Activity tracking error");
    }
  };

  return { trackActivity };
}
