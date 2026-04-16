import 'package:flutter/foundation.dart';
import 'package:pharmaconnect/config/environment.dart';

/// Centralized logging service that respects environment configuration
/// In production, only errors are logged. In development/staging, all levels are logged.
class LoggingService {
  static const String _defaultTag = 'PharmaConnect';

  /// Log informational message
  /// Only logged in development/staging environments
  static void info(String message, {String tag = _defaultTag}) {
    if (!EnvironmentConfig.enableLogging) return;
    _log('INFO', message, tag);
  }

  /// Log warning message
  /// Logged in all environments
  static void warning(String message, {String tag = _defaultTag}) {
    _log('WARN', message, tag);
  }

  /// Log error message
  /// Logged in all environments, also forwards to crash reporting
  static void error(
    String message, {
    String tag = _defaultTag,
    dynamic error,
    StackTrace? stackTrace,
  }) {
    _log('ERROR', message, tag, error: error, stackTrace: stackTrace);

    // TODO: Forward to crash reporting service (e.g., Firebase Crashlytics)
    // CrashReportingService.instance.recordError(error, stackTrace);
  }

  /// Log debug message
  /// Only logged in development/staging environments
  static void debug(String message, {String tag = _defaultTag}) {
    if (!EnvironmentConfig.enableLogging) return;
    _log('DEBUG', message, tag);
  }

  /// Internal method to format and print logs
  static void _log(
    String level,
    String message,
    String tag, {
    dynamic error,
    StackTrace? stackTrace,
  }) {
    final timestamp = DateTime.now().toIso8601String();
    final logMessage = '[$level] [$timestamp] [$tag] $message';

    // Use debugPrint for better formatting in Flutter
    debugPrint(logMessage);

    // Log error details if provided
    if (error != null) {
      debugPrint('  Error: $error');
    }

    if (stackTrace != null) {
      debugPrint('  Stack Trace:\n$stackTrace');
    }
  }

  /// Log HTTP request (development/staging only)
  static void logHttpRequest(
    String method,
    String url, {
    dynamic body,
    String tag = _defaultTag,
  }) {
    if (!EnvironmentConfig.enableLogging) return;
    info('$method $url${body != null ? '\nBody: $body' : ''}', tag: tag);
  }

  /// Log HTTP response (development/staging only)
  static void logHttpResponse(
    String method,
    String url,
    int statusCode, {
    dynamic response,
    String tag = _defaultTag,
  }) {
    if (!EnvironmentConfig.enableLogging) return;
    info('$method $url -> $statusCode${response != null ? '\nResponse: $response' : ''}', tag: tag);
  }

  /// Log Socket.IO event (development/staging only)
  static void logSocketEvent(
    String event, {
    dynamic data,
    String tag = _defaultTag,
  }) {
    if (!EnvironmentConfig.enableLogging) return;
    info('Socket Event: $event${data != null ? ' - $data' : ''}', tag: tag);
  }

  /// Log Firebase operation (development/staging only)
  static void logFirebaseOperation(
    String operation, {
    String? documentPath,
    dynamic data,
    String tag = _defaultTag,
  }) {
    if (!EnvironmentConfig.enableLogging) return;
    final details =
        '${documentPath != null ? '[$documentPath] ' : ''}${data != null ? '- $data' : ''}';
    info('Firebase: $operation $details', tag: tag);
  }

  /// Log app lifecycle event
  static void logAppEvent(String event, {String tag = _defaultTag}) {
    info('App Event: $event', tag: tag);
  }

  /// Log navigation event
  static void logNavigation(String route, {String tag = _defaultTag}) {
    if (!EnvironmentConfig.enableLogging) return;
    info('Navigation: → $route', tag: tag);
  }
}
