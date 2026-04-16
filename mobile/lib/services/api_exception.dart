class ApiException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;
  final dynamic originalError;
  final StackTrace? stackTrace;

  ApiException({
    required this.message,
    this.code,
    this.statusCode,
    this.originalError,
    this.stackTrace,
  });

  factory ApiException.fromStatusCode(int statusCode, String message) {
    return ApiException(
      message: message,
      statusCode: statusCode,
      code: 'HTTP_$statusCode',
    );
  }

  factory ApiException.network(dynamic error) {
    return ApiException(
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      originalError: error,
    );
  }

  factory ApiException.timeout() {
    return ApiException(
      message: 'Request timed out. Please try again.',
      code: 'TIMEOUT',
    );
  }

  factory ApiException.parsing(dynamic error) {
    return ApiException(
      message: 'Failed to parse response.',
      code: 'PARSE_ERROR',
      originalError: error,
    );
  }

  factory ApiException.unknown(dynamic error) {
    return ApiException(
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      originalError: error,
    );
  }

  bool get isNetworkError => code == 'NETWORK_ERROR';
  bool get isTimeout => code == 'TIMEOUT';
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isServerError => statusCode != null && statusCode! >= 500;

  @override
  String toString() => 'ApiException: $message (code: $code, status: $statusCode)';
}
