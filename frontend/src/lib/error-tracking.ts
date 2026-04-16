/**
 * Error Tracking Module
 * Handles application error monitoring and reporting.
 * Currently logs to console in development.
 * TODO: Integrate with Sentry DSN for production error tracking
 */

interface ErrorContext {
  [key: string]: unknown;
}

let currentUser: { userId: string; email: string } | null = null;

/**
 * Initialize error tracking
 * TODO: Add Sentry initialization here with proper DSN configuration
 */
export function initErrorTracking(): void {
  if (typeof window === "undefined") return;

  // Set up global error handler
  window.addEventListener("error", (event: ErrorEvent) => {
    captureError(event.error, {
      type: "uncaught_error",
      context: "window.onerror",
    });
  });

  // Set up unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    captureError(event.reason, {
      type: "unhandled_rejection",
      context: "window.onunhandledrejection",
    });
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[Error Tracking] Initialized in development mode");
  }
}

/**
 * Capture and report an error
 * @param error - The error to capture
 * @param context - Additional context information
 */
export function captureError(error: unknown, context?: ErrorContext): void {
  const errorId = generateErrorId();

  const errorData = {
    errorId,
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    user: currentUser,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };

  if (process.env.NODE_ENV === "development") {
    console.error("[Error Tracking]", errorData);
  } else {
    // TODO: Send to Sentry or other error tracking service
    // Sentry.captureException(error, { extra: errorData });
    console.error("[Error Tracking]", errorData);
  }
}

/**
 * Set the current user for error context
 * @param userId - The user ID
 * @param email - The user email
 */
export function setUser(userId: string | null, email?: string): void {
  if (userId && email) {
    currentUser = { userId, email };
    if (process.env.NODE_ENV === "development") {
      console.log(`[Error Tracking] User context set: ${userId}`);
    }
    // TODO: Set user context in Sentry
    // Sentry.setUser({ id: userId, email });
  } else {
    currentUser = null;
    if (process.env.NODE_ENV === "development") {
      console.log("[Error Tracking] User context cleared");
    }
    // TODO: Clear user context in Sentry
    // Sentry.setUser(null);
  }
}

/**
 * Generate a unique error ID for tracking and support reference
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR-${timestamp}-${random}`.toUpperCase();
}
