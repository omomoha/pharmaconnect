import 'dart:async';
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:pharmaconnect/config/constants.dart';
import 'api_exception.dart';

class ApiService {
  final http.Client httpClient;
  final FirebaseAuth firebaseAuth;

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

  Future<dynamic> get(
    String endpoint, {
    Map<String, String>? queryParams,
  }) async {
    try {
      final url = Uri.parse('${AppConstants.baseApiUrl}$endpoint')
          .replace(queryParameters: queryParams);
      final headers = await _getHeaders();

      final response = await httpClient.get(url, headers: headers).timeout(
            AppConstants.apiTimeout,
            onTimeout: () => throw ApiException.timeout(),
          );

      return _handleResponse(response);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  Future<dynamic> post(
    String endpoint, {
    required Map<String, dynamic> body,
    Map<String, String>? queryParams,
  }) async {
    try {
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
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  Future<dynamic> put(
    String endpoint, {
    required Map<String, dynamic> body,
    Map<String, String>? queryParams,
  }) async {
    try {
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
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  Future<dynamic> patch(
    String endpoint, {
    required Map<String, dynamic> body,
    Map<String, String>? queryParams,
  }) async {
    try {
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
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  Future<dynamic> delete(
    String endpoint, {
    Map<String, String>? queryParams,
  }) async {
    try {
      final url = Uri.parse('${AppConstants.baseApiUrl}$endpoint')
          .replace(queryParameters: queryParams);
      final headers = await _getHeaders();

      final response = await httpClient.delete(url, headers: headers).timeout(
            AppConstants.apiTimeout,
            onTimeout: () => throw ApiException.timeout(),
          );

      return _handleResponse(response);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
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
