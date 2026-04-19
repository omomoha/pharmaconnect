import 'package:pharmaconnect/config/constants.dart';
import 'api_service.dart';
import 'api_exception.dart';

class DeliveryService {
  final ApiService apiService;

  DeliveryService({required this.apiService});

  /// Register a new delivery provider
  ///
  /// [businessDetails] - Provider business information
  /// [vehicleInfo] - Vehicle details
  ///
  /// Returns the registered provider data
  Future<Map<String, dynamic>> registerDeliveryProvider({
    required Map<String, dynamic> businessDetails,
    required Map<String, dynamic> vehicleInfo,
  }) async {
    try {
      final body = {
        'businessDetails': businessDetails,
        'vehicleInfo': vehicleInfo,
      };

      final response = await apiService.post(
        '${ApiEndpoints.delivery}/providers/register',
        body: body,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Update delivery provider information
  ///
  /// [providerId] - ID of the provider to update
  /// [updateData] - Data to update
  ///
  /// Returns the updated provider data
  Future<Map<String, dynamic>> updateDeliveryProvider({
    required String providerId,
    required Map<String, dynamic> updateData,
  }) async {
    try {
      final response = await apiService.patch(
        '${ApiEndpoints.delivery}/providers/$providerId',
        body: updateData,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get available delivery providers for an order
  ///
  /// [pharmacyLocation] - Pharmacy location/coordinates
  /// [deliveryAddress] - Customer delivery address
  ///
  /// Returns a list of available providers
  Future<List<Map<String, dynamic>>> getAvailableDeliveryProviders({
    String? pharmacyLocation,
    String? deliveryAddress,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (pharmacyLocation != null) {
        queryParams['pharmacyLocation'] = pharmacyLocation;
      }
      if (deliveryAddress != null) {
        queryParams['deliveryAddress'] = deliveryAddress;
      }

      final response = await apiService.get(
        '${ApiEndpoints.delivery}/available',
        queryParams: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return List<Map<String, dynamic>>.from(
        response['data'] as List<dynamic>? ?? [],
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get rider's deliveries
  ///
  /// [status] - Optional status filter
  /// [page] - Page number for pagination
  /// [pageSize] - Number of items per page
  ///
  /// Returns a list of deliveries
  Future<Map<String, dynamic>> getMyDeliveries({
    String? status,
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      final response = await apiService.get(
        '${ApiEndpoints.delivery}/assignments/user/my-deliveries',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final deliveries = (response['data'] as List<dynamic>?)
              ?.map((d) => d as Map<String, dynamic>)
              .toList() ??
          [];

      return {
        'deliveries': deliveries,
        'total': response['total'] as int? ?? 0,
        'page': response['page'] as int? ?? page,
        'pageSize': response['pageSize'] as int? ?? pageSize,
      };
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get available orders for riders
  ///
  /// [page] - Page number for pagination
  /// [pageSize] - Number of items per page
  ///
  /// Returns a list of available orders
  Future<Map<String, dynamic>> getAvailableOrders({
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      final response = await apiService.get(
        '${ApiEndpoints.delivery}/available-orders',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final orders = (response['data'] as List<dynamic>?)
              ?.map((o) => o as Map<String, dynamic>)
              .toList() ??
          [];

      return {
        'orders': orders,
        'total': response['total'] as int? ?? 0,
        'page': response['page'] as int? ?? page,
        'pageSize': response['pageSize'] as int? ?? pageSize,
      };
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Create a delivery assignment (accept an order)
  ///
  /// [orderId] - ID of the order to accept
  /// [riderId] - ID of the rider accepting
  ///
  /// Returns the created assignment
  Future<Map<String, dynamic>> createDeliveryAssignment({
    required String orderId,
    required String riderId,
  }) async {
    try {
      final body = {
        'orderId': orderId,
        'riderId': riderId,
      };

      final response = await apiService.post(
        '${ApiEndpoints.delivery}/assignments',
        body: body,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get assignment details
  ///
  /// [assignmentId] - ID of the assignment
  ///
  /// Returns the assignment details
  Future<Map<String, dynamic>> getAssignmentDetails(String assignmentId) async {
    try {
      final response = await apiService.get(
        '${ApiEndpoints.delivery}/assignments/$assignmentId',
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Update delivery assignment status
  ///
  /// [assignmentId] - ID of the assignment
  /// [status] - New status (accepted, picked_up, in_transit, delivered, cancelled)
  /// [notes] - Optional notes
  ///
  /// Returns the updated assignment
  Future<Map<String, dynamic>> updateDeliveryStatus({
    required String assignmentId,
    required String status,
    String? notes,
  }) async {
    try {
      final body = {
        'status': status,
        if (notes != null) 'notes': notes,
      };

      final response = await apiService.patch(
        '${ApiEndpoints.delivery}/assignments/$assignmentId/status',
        body: body,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Verify delivery code
  ///
  /// [assignmentId] - ID of the assignment
  /// [code] - Verification code (customer or rider code)
  /// [codeType] - Type of code: 'customer' or 'rider'
  ///
  /// Returns verification result
  Future<Map<String, dynamic>> verifyDeliveryCode({
    required String assignmentId,
    required String code,
    required String codeType,
  }) async {
    try {
      final body = {
        'code': code,
        'codeType': codeType,
      };

      final response = await apiService.post(
        '${ApiEndpoints.delivery}/assignments/$assignmentId/verify-code',
        body: body,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get delivery earnings for rider
  ///
  /// [startDate] - Optional start date for earnings period
  /// [endDate] - Optional end date for earnings period
  ///
  /// Returns earnings data
  Future<Map<String, dynamic>> getDeliveryEarnings({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final response = await apiService.get(
        '${ApiEndpoints.delivery}/earnings',
        queryParams: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get delivery transactions/history
  ///
  /// [page] - Page number
  /// [pageSize] - Items per page
  ///
  /// Returns delivery transactions
  Future<Map<String, dynamic>> getDeliveryTransactions({
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      final response = await apiService.get(
        '${ApiEndpoints.delivery}/transactions',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final transactions = (response['data'] as List<dynamic>?)
              ?.map((t) => t as Map<String, dynamic>)
              .toList() ??
          [];

      return {
        'transactions': transactions,
        'total': response['total'] as int? ?? 0,
        'page': response['page'] as int? ?? page,
        'pageSize': response['pageSize'] as int? ?? pageSize,
      };
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }
}
