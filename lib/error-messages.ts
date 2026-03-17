/**
 * Maps API error codes to user-friendly messages with suggested actions.
 */
export const ERROR_MESSAGES: Record<string, { message: string; action?: string }> = {
  SUBSCRIPTION_EXPIRED: {
    message: "Your trial has expired.",
    action: "Upgrade your plan in Settings to continue.",
  },
  RATE_LIMITED: {
    message: "You're making requests too quickly.",
    action: "Please wait a moment and try again.",
  },
  QUOTA_EXHAUSTED: {
    message: "AI generation quota exhausted.",
    action: "Check your Google AI Studio billing or try again later.",
  },
  TIER_RESTRICTED: {
    message: "This feature requires a higher plan.",
    action: "Upgrade to Pro or Business to unlock this.",
  },
  INVALID_FILE_TYPE: {
    message: "Invalid file format.",
    action: "Please upload a supported file type.",
  },
  FILE_TOO_LARGE: {
    message: "File is too large.",
    action: "Please upload a smaller file.",
  },
  SERVICE_UNAVAILABLE: {
    message: "This service is temporarily unavailable.",
    action: "Please try again later.",
  },
};

export function sanitizeErrorForClient(error: unknown, code?: string): string {
  if (code) return getErrorMessage(code);
  return getErrorMessage(undefined);
}

export function getErrorMessage(code?: string, fallback?: string): string {
  if (code && ERROR_MESSAGES[code]) {
    const { message, action } = ERROR_MESSAGES[code];
    return action ? `${message} ${action}` : message;
  }
  return fallback || "Something went wrong. Please try again.";
}
