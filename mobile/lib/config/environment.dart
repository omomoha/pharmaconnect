/// Environment enumeration for build configurations
enum Environment { development, staging, production }

/// Environment configuration class that provides runtime configuration
/// based on the build environment
class EnvironmentConfig {
  /// Get the current environment from compile-time constant
  static Environment get environment {
    const env = String.fromEnvironment('ENVIRONMENT', defaultValue: 'production');
    switch (env.toLowerCase()) {
      case 'development':
        return Environment.development;
      case 'staging':
        return Environment.staging;
      case 'production':
      default:
        return Environment.production;
    }
  }

  /// Get the API base URL for the current environment
  static String get apiUrl {
    switch (environment) {
      case Environment.development:
        return 'http://localhost:4000/api/v1';
      case Environment.staging:
        // Staging uses production API for now
        return 'https://us-central1-marketplace-50f56.cloudfunctions.net/api/api/v1';
      case Environment.production:
        return 'https://us-central1-marketplace-50f56.cloudfunctions.net/api/api/v1';
    }
  }

  /// Enable detailed logging in development and staging
  static bool get enableLogging {
    return environment != Environment.production;
  }

  /// Get human-readable environment name
  static String get environmentName {
    return environment.toString().split('.').last.toUpperCase();
  }
}
