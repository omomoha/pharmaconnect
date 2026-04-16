import 'package:flutter/foundation.dart';
import 'package:pharmaconnect/config/environment.dart';

/// Service for reporting crashes and errors
/// Currently logs to console in development; ready for Crashlytics integration in production
class CrashReportingService {
  static bool _initialized = false;

  /// Initialize crash reporting
  /// Sets up FlutterError handler to catch UI framework errors
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Set up Flutter error handler for UI framework errors
      FlutterError.onError = (FlutterErrorDetails details) {
        recordError(
          details.exception,
          details.stack,
          reason: details.context?.toString(),
        );
      };

      _initialized = true;

      if (EnvironmentConfig.enableLogging) {
        debugPrint('CrashReportingService initialized in ${EnvironmentConfig.environmentName} mode');
      }

      // TODO: Add Crashlytics initialization for production
      // In production, uncomment and configure:
      // import 'package:firebase_crashlytics/firebase_crashlytics.dart';
      // await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
    } catch (e) {
      debugPrint('Failed to initialize CrashReportingService: $e');
    }
  }

  /// Record an error with optional stack trace and context
  static void recordError(
    dynamic error,
    StackTrace? stack, {
    String? reason,
  }) {
    if (!_initialized) {
      _logLocal(
        error: error,
        stackTrace: stack,
        reason: reason,
      );
      return;
    }

    // In development, always log to console
    if (EnvironmentConfig.enableLogging) {
      _logLocal(
        error: error,
        stackTrace: stack,
        reason: reason,
      );
    }

    // TODO: Send to Crashlytics in production
    // In production, uncomment:
    // import 'package:firebase_crashlytics/firebase_crashlytics.dart';
    // if (!kDebugMode) {
    //   FirebaseCrashlytics.instance.recordError(
    //     error,
    //     stack,
    //     reason: reason,
    //     information: [
    //       DiagnosticsProperty('environment', EnvironmentConfig.environmentName),
    //     ],
    //   );
    // }
  }

  /// Log a message
  static void log(String message) {
    if (EnvironmentConfig.enableLogging) {
      debugPrint('[CrashReporting] $message');
    }

    // TODO: Send structured logs to Crashlytics in production
  }

  /// Internal helper to log locally
  static void _logLocal({
    required dynamic error,
    required StackTrace? stackTrace,
    String? reason,
  }) {
    debugPrint('--- CrashReportingService ---');
    debugPrint('Error: $error');
    if (reason != null) {
      debugPrint('Reason: $reason');
    }
    if (stackTrace != null) {
      debugPrint('Stack Trace:\n$stackTrace');
    }
    debugPrint('----------------------------');
  }

  /// Check if crash reporting is initialized
  static bool get isInitialized => _initialized;
}
