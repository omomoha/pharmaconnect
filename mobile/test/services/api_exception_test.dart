import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/services/api_exception.dart';

void main() {
  group('ApiException', () {
    test('creates ApiException with all fields', () {
      final exception = ApiException(
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400,
        originalError: Exception('Original'),
        stackTrace: StackTrace.current,
      );

      expect(exception.message, 'Test error');
      expect(exception.code, 'TEST_ERROR');
      expect(exception.statusCode, 400);
      expect(exception.originalError, isNotNull);
      expect(exception.stackTrace, isNotNull);
    });

    test('creates ApiException with minimal fields', () {
      final exception = ApiException(message: 'Error message');

      expect(exception.message, 'Error message');
      expect(exception.code, null);
      expect(exception.statusCode, null);
      expect(exception.originalError, null);
      expect(exception.stackTrace, null);
    });
  });

  group('ApiException Factory Constructors', () {
    test('fromStatusCode creates exception with correct code', () {
      final exception = ApiException.fromStatusCode(404, 'Not found');

      expect(exception.message, 'Not found');
      expect(exception.code, 'HTTP_404');
      expect(exception.statusCode, 404);
      expect(exception.isNotFound, true);
    });

    test('fromStatusCode with different status codes', () {
      final testCases = [
        (400, 'HTTP_400'),
        (401, 'HTTP_401'),
        (403, 'HTTP_403'),
        (500, 'HTTP_500'),
        (503, 'HTTP_503'),
      ];

      for (final (status, expectedCode) in testCases) {
        final exception = ApiException.fromStatusCode(status, 'Error');
        expect(exception.code, expectedCode);
      }
    });

    test('network factory creates network error', () {
      final originalError = Exception('Connection failed');
      final exception = ApiException.network(originalError);

      expect(exception.message, 'Network error. Please check your connection.');
      expect(exception.code, 'NETWORK_ERROR');
      expect(exception.originalError, originalError);
      expect(exception.isNetworkError, true);
    });

    test('timeout factory creates timeout error', () {
      final exception = ApiException.timeout();

      expect(exception.message, 'Request timed out. Please try again.');
      expect(exception.code, 'TIMEOUT');
      expect(exception.isTimeout, true);
    });

    test('parsing factory creates parse error', () {
      final originalError = FormatException('Invalid JSON');
      final exception = ApiException.parsing(originalError);

      expect(exception.message, 'Failed to parse response.');
      expect(exception.code, 'PARSE_ERROR');
      expect(exception.originalError, originalError);
    });

    test('unknown factory creates unknown error', () {
      final originalError = Exception('Something went wrong');
      final exception = ApiException.unknown(originalError);

      expect(exception.message, 'An unexpected error occurred. Please try again.');
      expect(exception.code, 'UNKNOWN_ERROR');
      expect(exception.originalError, originalError);
    });
  });

  group('ApiException Error Type Checks', () {
    test('isNetworkError identifies network errors', () {
      final networkError = ApiException.network(Exception('Network failed'));
      final otherError = ApiException.parsing(Exception('Parse failed'));

      expect(networkError.isNetworkError, true);
      expect(otherError.isNetworkError, false);
    });

    test('isTimeout identifies timeout errors', () {
      final timeoutError = ApiException.timeout();
      final otherError = ApiException.network(Exception('Network failed'));

      expect(timeoutError.isTimeout, true);
      expect(otherError.isTimeout, false);
    });

    test('isUnauthorized checks status code 401', () {
      final unauthorized = ApiException(
        message: 'Unauthorized',
        statusCode: 401,
      );
      final authorized = ApiException(
        message: 'OK',
        statusCode: 200,
      );

      expect(unauthorized.isUnauthorized, true);
      expect(authorized.isUnauthorized, false);
    });

    test('isForbidden checks status code 403', () {
      final forbidden = ApiException(
        message: 'Forbidden',
        statusCode: 403,
      );
      final allowed = ApiException(
        message: 'OK',
        statusCode: 200,
      );

      expect(forbidden.isForbidden, true);
      expect(allowed.isForbidden, false);
    });

    test('isNotFound checks status code 404', () {
      final notFound = ApiException.fromStatusCode(404, 'Not found');
      final found = ApiException.fromStatusCode(200, 'OK');

      expect(notFound.isNotFound, true);
      expect(found.isNotFound, false);
    });

    test('isServerError checks status code >= 500', () {
      final serverError500 = ApiException.fromStatusCode(500, 'Server error');
      final serverError503 = ApiException.fromStatusCode(503, 'Service unavailable');
      final clientError400 = ApiException.fromStatusCode(400, 'Bad request');

      expect(serverError500.isServerError, true);
      expect(serverError503.isServerError, true);
      expect(clientError400.isServerError, false);
    });

    test('isServerError with null statusCode', () {
      final exception = ApiException(message: 'Error');

      expect(exception.isServerError, false);
    });
  });

  group('ApiException toString', () {
    test('toString returns formatted string', () {
      final exception = ApiException(
        message: 'Network error',
        code: 'NETWORK_ERROR',
        statusCode: 500,
      );

      final result = exception.toString();

      expect(result.contains('ApiException'), true);
      expect(result.contains('Network error'), true);
      expect(result.contains('NETWORK_ERROR'), true);
      expect(result.contains('500'), true);
    });

    test('toString works with minimal exception', () {
      final exception = ApiException(message: 'Simple error');
      final result = exception.toString();

      expect(result.contains('ApiException'), true);
      expect(result.contains('Simple error'), true);
    });

    test('toString with null values', () {
      final exception = ApiException(
        message: 'Error',
        code: null,
        statusCode: null,
      );

      final result = exception.toString();

      expect(result.contains('ApiException'), true);
      expect(result.contains('Error'), true);
    });

    test('toString is readable for different error types', () {
      final errors = [
        ApiException.network(Exception('Network failed')),
        ApiException.timeout(),
        ApiException.parsing(Exception('Parse error')),
        ApiException.unknown(Exception('Unknown')),
        ApiException.fromStatusCode(404, 'Not found'),
      ];

      for (final error in errors) {
        final result = error.toString();
        expect(result.startsWith('ApiException'), true);
        expect(result.contains('message'), true);
      }
    });
  });

  group('ApiException Status Code Handling', () {
    test('multiple status codes are checked correctly', () {
      final testCases = [
        (401, 'isUnauthorized', true),
        (403, 'isForbidden', true),
        (404, 'isNotFound', true),
        (500, 'isServerError', true),
        (503, 'isServerError', true),
        (200, 'isServerError', false),
        (404, 'isServerError', false),
      ];

      for (final (status, method, expected) in testCases) {
        final exception = ApiException.fromStatusCode(status, 'Test');

        if (method == 'isUnauthorized') {
          expect(exception.isUnauthorized, expected);
        } else if (method == 'isForbidden') {
          expect(exception.isForbidden, expected);
        } else if (method == 'isNotFound') {
          expect(exception.isNotFound, expected);
        } else if (method == 'isServerError') {
          expect(exception.isServerError, expected);
        }
      }
    });
  });

  group('ApiException Error Chaining', () {
    test('originalError can be chained', () {
      final originalException = Exception('Root cause');
      final apiException = ApiException.network(originalException);

      expect(apiException.originalError, originalException);
    });

    test('multiple error types can be captured', () {
      final formatError = FormatException('Invalid format');
      final apiException = ApiException.parsing(formatError);

      expect(apiException.originalError is FormatException, true);
    });

    test('stackTrace can be preserved', () {
      try {
        throw Exception('Test');
      } catch (e, s) {
        final exception = ApiException(
          message: 'Caught exception',
          originalError: e,
          stackTrace: s,
        );

        expect(exception.stackTrace, isNotNull);
      }
    });
  });

  group('ApiException Comparison Scenarios', () {
    test('different error types are distinguishable', () {
      final networkError = ApiException.network(Exception());
      final timeoutError = ApiException.timeout();
      final parseError = ApiException.parsing(Exception());

      expect(networkError.isNetworkError, true);
      expect(networkError.isTimeout, false);
      expect(timeoutError.isNetworkError, false);
      expect(timeoutError.isTimeout, true);
      expect(parseError.code, 'PARSE_ERROR');
    });

    test('client vs server errors are distinguishable', () {
      final clientError = ApiException.fromStatusCode(400, 'Bad request');
      final serverError = ApiException.fromStatusCode(500, 'Internal error');

      expect(clientError.isServerError, false);
      expect(serverError.isServerError, true);
    });
  });
}
