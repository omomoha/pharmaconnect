class AppConstants {
  // App Info
  static const String appName = 'PharmaConnect';
  static const String appVersion = '1.0.0';

  // API Configuration
  static const String baseApiUrl =
      'https://us-central1-marketplace-50f56.cloudfunctions.net/api/api/v1';

  // Firebase Configuration
  static const String firebaseProjectId = 'marketplace-50f56';
  static const String firebaseApiKey = 'AIzaSyA1mJbJs3YPqJsKPzE5RtJ5OzH9pZ5vHJg';
  static const String firebaseAppId = '1:598024098653:android:8dcd7e8f5a4c3b2e1f0g9h';
  static const String firebaseMessagingSenderId = '598024098653';
  static const String firebaseAuthDomain = 'marketplace-50f56.firebaseapp.com';
  static const String firebaseStorageBucket =
      'marketplace-50f56.appspot.com';
  static const String firebaseDatabasseUrl =
      'https://marketplace-50f56-default-rtdb.firebaseio.com';

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration shortDuration = Duration(milliseconds: 300);
  static const Duration mediumDuration = Duration(milliseconds: 500);
  static const Duration longDuration = Duration(milliseconds: 800);

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxRetries = 3;

  // Auth
  static const Duration phoneOtpTimeout = Duration(minutes: 5);
  static const int otpLength = 6;

  // Local Storage Keys
  static const String userPrefsKey = 'user_prefs';
  static const String authTokenKey = 'auth_token';
  static const String userRoleKey = 'user_role';
  static const String userIdKey = 'user_id';
  static const String themeKey = 'app_theme';
  static const String languageKey = 'app_language';
  static const String firstLaunchKey = 'first_launch';

  // Assets Paths
  static const String imagesPath = 'assets/images/';
  static const String iconsPath = 'assets/icons/';

  // Error Messages
  static const String networkErrorMessage =
      'Network error. Please check your connection.';
  static const String serverErrorMessage =
      'Server error. Please try again later.';
  static const String unknownErrorMessage =
      'An unexpected error occurred. Please try again.';
  static const String invalidEmailMessage = 'Please enter a valid email.';
  static const String passwordTooShortMessage =
      'Password must be at least 8 characters.';
  static const String passwordMismatchMessage = 'Passwords do not match.';
  static const String otpExpiredMessage = 'OTP has expired. Please request a new one.';

  // Regex Patterns
  static const String emailPattern =
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  static const String phonePattern = r'^\+?[1-9]\d{1,14}$';
  static const String passwordPattern =
      r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';
}

class ApiEndpoints {
  static const String auth = '/auth';
  static const String login = '$auth/login';
  static const String register = '$auth/register';
  static const String verifyOtp = '$auth/verify-otp';
  static const String refreshToken = '$auth/refresh';
  static const String logout = '$auth/logout';
  static const String userProfile = '/users/profile';
  static const String updateProfile = '/users/profile';
  static const String products = '/products';
  static const String orders = '/orders';
  static const String pharmacies = '/pharmacies';
  static const String deliveryProviders = '/delivery-providers';
  static const String chat = '/chat';
  static const String notifications = '/notifications';
}

class UIConstants {
  static const double borderRadiusSmall = 8.0;
  static const double borderRadiusMedium = 12.0;
  static const double borderRadiusLarge = 16.0;

  static const double paddingXSmall = 4.0;
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingXLarge = 32.0;

  static const double iconSizeSmall = 16.0;
  static const double iconSizeMedium = 24.0;
  static const double iconSizeLarge = 32.0;
  static const double iconSizeXLarge = 48.0;

  static const double buttonHeightSmall = 36.0;
  static const double buttonHeightMedium = 44.0;
  static const double buttonHeightLarge = 52.0;

  static const double shadowBlurRadius = 8.0;
  static const double shadowSpreadRadius = 0.0;

  static const int animationDuration = 300;
}
