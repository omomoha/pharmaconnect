import 'package:pharmaconnect/config/constants.dart';

class ValidationService {
  /// Validate email format
  /// Returns error message if invalid, null if valid
  static String? validateEmail(String email) {
    if (email.isEmpty) {
      return 'Email is required';
    }

    final emailRegex = RegExp(AppConstants.emailPattern);
    if (!emailRegex.hasMatch(email)) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  /// Validate Nigerian phone number format
  /// Accepts: +234..., 0..., or formats like +2348012345678
  /// Returns error message if invalid, null if valid
  static String? validatePhone(String phone) {
    if (phone.isEmpty) {
      return 'Phone number is required';
    }

    // Remove common formatting characters
    final cleaned = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');

    // Nigerian phone numbers:
    // +234 format (with country code)
    // 0 format (domestic)
    // Must be 10 digits (domestic) or 13 digits (with +234)
    final nigerianPhoneRegex = RegExp(r'^(\+234|0)[0-9]{10}$');

    if (!nigerianPhoneRegex.hasMatch(cleaned)) {
      return 'Please enter a valid Nigerian phone number (e.g., +2348012345678)';
    }

    return null;
  }

  /// Validate password strength
  /// Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  /// Returns error message if invalid, null if valid
  static String? validatePassword(String password) {
    if (password.isEmpty) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!RegExp(r'[a-z]').hasMatch(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!RegExp(r'\d').hasMatch(password)) {
      return 'Password must contain at least one number';
    }

    if (!RegExp(r'[@$!%*?&]').hasMatch(password)) {
      return 'Password must contain at least one special character (@, \$, !, %, *, ?, or &)';
    }

    return null;
  }

  /// Validate monetary amount
  /// Ensures positive value not exceeding 10,000,000
  /// Returns error message if invalid, null if valid
  static String? validateAmount(double amount) {
    if (amount <= 0) {
      return 'Amount must be greater than 0';
    }

    if (amount > 10000000) {
      return 'Amount cannot exceed 10,000,000';
    }

    return null;
  }

  /// Validate chat message
  /// Requirements: not empty, max 1000 chars, no dangerous HTML
  /// Returns error message if invalid, null if valid
  static String? validateChatMessage(String message) {
    if (message.isEmpty) {
      return 'Message cannot be empty';
    }

    if (message.length > 1000) {
      return 'Message cannot exceed 1000 characters';
    }

    // Check for dangerous HTML tags
    if (_containsDangerousHtml(message)) {
      return 'Message contains invalid content';
    }

    return null;
  }

  /// Validate address field
  /// Requirements: not empty, min 10 characters
  /// Returns error message if invalid, null if valid
  static String? validateAddress(String address) {
    if (address.isEmpty) {
      return 'Address is required';
    }

    final cleaned = address.trim();
    if (cleaned.length < 10) {
      return 'Address must be at least 10 characters long';
    }

    return null;
  }

  /// Sanitize user input
  /// Trims whitespace and removes potentially dangerous characters
  static String sanitizeInput(String input) {
    // Trim whitespace
    var sanitized = input.trim();

    // Remove HTML tags
    sanitized = sanitized.replaceAll(RegExp(r'<[^>]*>'), '');

    // Remove potentially dangerous special sequences
    sanitized = sanitized.replaceAll(RegExp(r"""[<>&"'`]"""), '');

    return sanitized;
  }

  /// Check if string contains dangerous HTML
  static bool _containsDangerousHtml(String text) {
    // Check for script tags and event handlers
    final dangerousPatterns = [
      RegExp(r'<script', caseSensitive: false),
      RegExp(r'javascript:', caseSensitive: false),
      RegExp(r'on\w+\s*=', caseSensitive: false), // onclick, onload, etc.
      RegExp(r'<iframe', caseSensitive: false),
      RegExp(r'<object', caseSensitive: false),
      RegExp(r'<embed', caseSensitive: false),
    ];

    for (final pattern in dangerousPatterns) {
      if (pattern.hasMatch(text)) {
        return true;
      }
    }

    return false;
  }
}
