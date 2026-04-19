import * as Sentry from "@sentry/node";
import { Express } from "express";
import logger from "../utils/logger.js";

/**
 * Initialize application monitoring (Sentry).
 *
 * Call once during startup, before routes are registered.
 * If SENTRY_DSN is not set, monitoring is silently skipped.
 */
export function initializeMonitoring(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    if (process.env.NODE_ENV === "production") {
      logger.error("CRITICAL: SENTRY_DSN not configured in production — error monitoring is disabled. Set SENTRY_DSN to enable.");
    } else {
      logger.info("Sentry DSN not configured — monitoring disabled. Set SENTRY_DSN to enable.");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: process.env.npm_package_version || "1.0.0",

    // Performance monitoring: capture 20% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Include Express integration
    integrations: [Sentry.expressIntegration()],

    // Filter out non-actionable noise
    beforeSend(event) {
      // Don't report 4xx client errors (validation, not-found, etc.)
      const statusCode = event.extra?.statusCode as number | undefined;
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        return null;
      }
      return event;
    },

    // Scrub PII from error reports
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "http" && breadcrumb.data?.url) {
        try {
          const url = new URL(breadcrumb.data.url, "http://placeholder");
          url.search = "";
          breadcrumb.data.url = url.pathname;
        } catch {
          // Keep original if URL parsing fails
        }
      }
      return breadcrumb;
    },
  });

  logger.info(`Sentry initialized (env: ${process.env.NODE_ENV})`);
}

/**
 * Set up Sentry error handler on an Express app.
 * Must be called AFTER all routes are registered but BEFORE the app's own error handler.
 */
export function setupSentryErrorHandler(app: Express): void {
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
    logger.info("Sentry Express error handler registered");
  }
}

/**
 * Capture an exception with Sentry.
 * Also logs the error via Winston for local visibility.
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  logger.error(error.message, { stack: error.stack, ...context });

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

// Legacy exports for backward compat — noop when not using old Handlers API
export const sentryRequestHandler = undefined;
export const sentryErrorHandler = undefined;
