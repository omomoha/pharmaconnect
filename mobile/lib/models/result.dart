/// Result utility class for consistent error handling pattern
/// This provides a clean way to represent success/failure states
/// Usage:
///   Result<User>.success(user)
///   Result<User>.failure('Failed to load user', errorCode: 'NOT_FOUND')
class Result<T> {
  final T? data;
  final String? error;
  final String? errorCode;

  /// Constructor for successful results
  Result.success(this.data) : error = null, errorCode = null;

  /// Constructor for failed results
  Result.failure(this.error, {this.errorCode}) : data = null;

  /// Returns true if this result represents a success
  bool get isSuccess => data != null;

  /// Returns true if this result represents a failure
  bool get isFailure => error != null;

  /// Helper to convert between result types
  Result<R> cast<R>() {
    if (isSuccess) {
      return Result<R>.failure('Cannot cast successful result of different type');
    }
    return Result<R>.failure(error!, errorCode: errorCode);
  }
}
