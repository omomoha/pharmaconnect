import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:pharmaconnect/config/constants.dart';
import 'api_exception.dart';

class ApiService {
  final http.Client httpClient;
  final FirebaseAuth firebaseAuth;

  static const int _maxRetries = 3;
  static const int _initialBackoffMs = 2000;

  ApiService({
    http.Client? httpClient,
    FirebaseAuth? firebaseAuth,
  })  : httpClient = httpClient ?? http.Client(),
        firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  Future<String?> _getAuthToken() async {
    try {
      final user = firebaseAuth.currentUser;
      if (user != null) {
        return await user.getIdToken();
      }
    } catch (e) {
      rethrow;
    }
    return null;
  }

  Future<Map<String, String>> _getHeaders({
    bool includeAuth = true,
    String? contentType,
  }) async {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': contentType ?? 'application/json',
    };

    if (includeAuth) {
      final token = await _getAuthToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  /// Retry a request with exponential backoff
  /// Only retries on network errors and specific status codes (5xx, 401 on first attempt)
  Future<dynamic> _retryRequest<T>(
    Future<T> Function() requestFn, {
    bool is401Retryable = true,
  }) async {
    int attempt = 0;

    while (attempt < _maxRetries) {
      try {
        return await requestFn();
      } on ApiException catch (e) {
        attempt++;

        // Retry on 401 once to refresh token
        if (e.statusCode == 401 && is401Retryable && attempt == 1) {
          try {
            final user = firebaseAuth.currentUser;
            if (user != null) {
              await user.getIdToken(true);
              continue; // Retry the request
            }
          } catch (refreshError) {
            if (kDebugMode) {
              print('Token refresh failed: $refreshError');
            }
          }
        }

        // Retry on 5xx errors and timeouts
        if ((e.statusCode ?? 0) >= 500 || e.code == 'TIMEOUT') {
          if (attempt < _maxRetries) {
            // Exponential backoff with jitter
            final backoffMs =
                _initialBackoffMs * (1 << (attempt - 1)) +
                DateTime.now().millisecond % 1000;
            await Future.delayed(Duration(milliseconds: backoffMs));
            continue;
          }
        }

        // Don't retry on 4xx (except 401 which we handled above)
        rethrow;
      } on SocketException catch (_) {
        // Network error - retry with backoff
        attempt++;
        if (attempt < _maxRetries) {
          final backoffMs =
              _initialBackoffMs * (1 << (attempt - 1)) +
              DateTime.now().millisecond % 1000;
          await Future.delayed(Duration(milliseconds: backoffMs));
          continue;
        }
        rethrow;
      } catch (e) {
        // Unexpected error - don't retry
        rethrow;
      }
    }

    // Should not reach here
    throw ApiException.network('Max retries exceeded');
  }

  Future<dynamic> get(
    String endpoint, {
    Map<String, String>? queryParams,
  }) async {
    return _retryRequest(
      () async {
        final url = Uri.parse('${AppConstants.baseApiUrl}$endpoint')
            .replace(queryParameters: queryParams);
        final headers = await _getHeaders();

        final response = await httpClient.get(url, headers: headers).timeout(
              AppConstants.apiTimeout,
              onTimeout: () => throw ApiException.timeout(),
            );

        return _handleResponse(response);
      },
      is401Retryable: true,
    );
  }

  Future<dynamic> post(
    String endpoint, {
    required Map<String, dynamic> body,
    Map<String, String>? queryParams,
  }) async {
    return _retryRequest(
      () async {
        final url = Uri.parse('${AppConstants.baseApiUrl}$endpoint')
            .replace(queryParameters: queryParams);
        final headers = await _getHeaders();

        final response = await httpClient
            .post(
              url,
              headers: headers,
              body: jsonEncode(body),
            )
            .timeout(
              AppConstants.apiTimeout,
              onTimeout: () => throw ApiException.timeout(),
            );

        return _handleResponse(response);
      },
      is401Retryable: true,
    );
  }

  Future<dynamic> put(
    String endpoint, {
    required Map<String, dynamic> body,
    Map<String, String>? queryParams,
  }) async {
    return _retryRequest(
      () async {
        final url = Uri.parse('${AppConstants.baseApiUrl}$endpoint')
            .replace(queryParameters: queryParams);
        final headers = await _getHeaders();

        final response = await httpClient
            .put(
              url,
              headers: headers,
              body: jsonEncode(body),
            )
            .timeout(
              AppConstants.apiTimeout,
              onTimeout: () => throw ApiException.timeout(),
            );

        return _handleResponse(response);
      },
      is401Retryable: true,
    );
  }

  Future<dynamic> patch(
    String endpoint, {
    required Map<String, dynamic> body,
    Map<String, String>? queryParams,
  }) async {
    return _retryRequest(
      () async {
        final url = Uri.parse('${AppConstants.baseApiUrl}$endpoint')
            .replace(queryParameters: queryParams);
        final headers = await _getHeaders();

        final response = await httpClient
            .patch(
              url,
              headers: headers,
              body: jsonEncode(body),
            )
            .timeout(
              AppConstants.apiTimeout,
              onTimeout: () => throw ApiException.timeout(),
            );

        return _handleResponse(response);
      },
      is401Retryable: true,
    );
  }

  Future<dynamic> delete(
    String endpoint, {
    Map<String, String>? queryParams,
  }) async {
    return _retryRequest(
      () async {
        final url = Uri.parse('${AppConstants.baseApiUrl}$endpoint')
            .replace(queryParameters: queryParams);
        final headers = await _getHeaders();

        final response = await httpClient.delete(url, headers: headers).timeout(
              AppConstants.apiTimeout,
              onTimeout: () => throw ApiException.timeout(),
            );

        return _handleResponse(response);
      },
      is401Retryable: true,
    );
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        if (response.body.isEmpty) {
          return null;
        }
        return jsonDecode(response.body);
      } catch (e) {
        throw ApiException.parsing(e);
      }
    }

    String errorMessage = 'An error occurred';
    try {
      final errorData = jsonDecode(response.body);
      errorMessage = errorData['message'] ?? errorMessage;
    } catch (_) {
      errorMessage = response.reasonPhrase ?? errorMessage;
    }

    switch (response.statusCode) {
      case 400:
        throw ApiException(
          message: errorMessage,
          code: 'BAD_REQUEST',
          statusCode: 400,
        );
      case 401:
        throw ApiException(
          message: 'Unauthorized. Please login again.',
          code: 'UNAUTHORIZED',
          statusCode: 401,
        );
      case 403:
        throw ApiException(
          message: 'Forbidden. You do not have permission.',
          code: 'FORBIDDEN',
          statusCode: 403,
        );
      case 404:
        throw ApiException(
          message: 'Resource not found.',
          code: 'NOT_FOUND',
          statusCode: 404,
        );
      case 409:
        throw ApiException(
          message: errorMessage,
          code: 'CONFLICT',
          statusCode: 409,
        );
      case 422:
        throw ApiException(
          message: errorMessage,
          code: 'VALIDATION_ERROR',
          statusCode: 422,
        );
      default:
        if (response.statusCode >= 500) {
          throw ApiException(
            message: 'Server error. Please try again later.',
            code: 'SERVER_ERROR',
            statusCode: response.statusCode,
          );
        }
        throw ApiException(
          message: errorMessage,
          code: 'HTTP_ERROR',
          statusCode: response.statusCode,
        );
    }
  }
}
