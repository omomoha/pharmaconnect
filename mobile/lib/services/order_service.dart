import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/order_model.dart';
import 'api_service.dart';
import 'api_exception.dart';

class OrderService {
  final ApiService apiService;

  OrderService({required this.apiService});

  /// Create a new order
  ///
  /// [items] - List of order items with productId and quantity
  /// [pharmacyId] - ID of the pharmacy
  /// [deliveryAddress] - Full delivery address string
  /// [paymentMethod] - Payment method (e.g., 'card', 'transfer', 'wallet')
  /// [deliveryProviderId] - Optional ID of selected delivery provider
  /// [specialInstructions] - Optional special delivery instructions
  ///
  /// Returns the created OrderModel
  Future<OrderModel> createOrder({
    required List<Map<String, dynamic>> items,
    required String pharmacyId,
    required String deliveryAddress,
    required String paymentMethod,
    String? deliveryProviderId,
    String? specialInstructions,
  }) async {
    try {
      if (items.isEmpty) {
        throw ApiException(
          message: 'Order must contain at least one item',
          code: 'EMPTY_CART',
        );
      }

      final body = {
        'items': items,
        'pharmacyId': pharmacyId,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod,
        if (deliveryProviderId != null) 'deliveryProviderId': deliveryProviderId,
        if (specialInstructions != null)
          'specialInstructions': specialInstructions,
      };

      final response = await apiService.post(
        ApiEndpoints.orders,
        body: body,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return OrderModel.fromJson(response['data'] as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get all orders for the current user
  ///
  /// [page] - Page number for pagination (0-indexed)
  /// [status] - Optional status filter (pending, confirmed, delivered, etc.)
  /// [pageSize] - Number of items per page
  ///
  /// Returns a map with 'orders' (List<OrderModel>) and 'total' (int) count
  Future<Map<String, dynamic>> getMyOrders({
    int page = 0,
    String? status,
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
        ApiEndpoints.orders,
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final orders = (response['data'] as List<dynamic>?)
              ?.map((o) => OrderModel.fromJson(o as Map<String, dynamic>))
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

  /// Get a single order by ID
  ///
  /// [id] - Order ID
  ///
  /// Returns the OrderModel or throws an exception
  Future<OrderModel> getOrderById(String id) async {
    try {
      final response = await apiService.get('${ApiEndpoints.orders}/$id');

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return OrderModel.fromJson(response['data'] as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Cancel an order
  ///
  /// [id] - Order ID to cancel
  /// [reason] - Optional cancellation reason
  ///
  /// Returns the updated OrderModel
  Future<OrderModel> cancelOrder(String id, {String? reason}) async {
    try {
      final response = await apiService.patch(
        '${ApiEndpoints.orders}/$id/cancel',
        body: {
          if (reason != null) 'reason': reason,
        },
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return OrderModel.fromJson(response['data'] as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get available delivery providers for an order
  ///
  /// [pharmacyId] - ID of the pharmacy
  /// [deliveryAddress] - Delivery address
  ///
  /// Returns a list of available delivery provider objects
  Future<List<Map<String, dynamic>>> getAvailableDeliveryProviders({
    required String pharmacyId,
    required String deliveryAddress,
  }) async {
    try {
      final queryParams = <String, String>{
        'pharmacyId': pharmacyId,
        'address': deliveryAddress,
      };

      final response = await apiService.get(
        '${ApiEndpoints.deliveryProviders}/available',
        queryParams: queryParams,
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

  /// Get order tracking information
  ///
  /// [orderId] - ID of the order
  ///
  /// Returns tracking information with rider details and live location
  Future<Map<String, dynamic>> getOrderTracking(String orderId) async {
    try {
      final response = await apiService.get(
        '${ApiEndpoints.orders}/$orderId/tracking',
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? {};
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Confirm order receipt
  ///
  /// [orderId] - ID of the order
  /// [code] - Customer's confirmation code
  ///
  /// Returns the updated OrderModel
  Future<OrderModel> confirmOrderReceipt(
    String orderId, {
    required String code,
  }) async {
    try {
      final response = await apiService.patch(
        '${ApiEndpoints.orders}/$orderId/confirm-receipt',
        body: {
          'code': code,
        },
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return OrderModel.fromJson(response['data'] as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Rate an order
  ///
  /// [orderId] - ID of the order
  /// [rating] - Rating out of 5 (1-5)
  /// [comment] - Optional review comment
  ///
  /// Returns the rating submission response
  Future<Map<String, dynamic>> rateOrder({
    required String orderId,
    required int rating,
    String? comment,
  }) async {
    try {
      if (rating < 1 || rating > 5) {
        throw ApiException(
          message: 'Rating must be between 1 and 5',
          code: 'INVALID_RATING',
        );
      }

      final response = await apiService.post(
        '${ApiEndpoints.orders}/$orderId/rate',
        body: {
          'rating': rating,
          if (comment != null) 'comment': comment,
        },
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? {};
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get order history grouped by pharmacy
  ///
  /// [page] - Page number for pagination
  ///
  /// Returns a list of pharmacy-grouped orders
  Future<Map<String, dynamic>> getOrderHistory({
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      final response = await apiService.get(
        '${ApiEndpoints.orders}/history',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return {
        'orders': (response['data'] as List<dynamic>?)
                ?.map((o) => OrderModel.fromJson(o as Map<String, dynamic>))
                .toList() ??
            [],
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

  /// Get order statistics for the user
  ///
  /// Returns stats like total orders, total spent, last order date, etc.
  Future<Map<String, dynamic>> getOrderStatistics() async {
    try {
      final response = await apiService.get(
        '${ApiEndpoints.orders}/stats',
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response['data'] as Map<String, dynamic>? ?? {};
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Validate order before submission
  ///
  /// [items] - List of order items
  /// [pharmacyId] - ID of the pharmacy
  /// [deliveryAddress] - Delivery address
  ///
  /// Returns validation result with any errors or warnings
  Future<Map<String, dynamic>> validateOrder({
    required List<Map<String, dynamic>> items,
    required String pharmacyId,
    required String deliveryAddress,
  }) async {
    try {
      final response = await apiService.post(
        '${ApiEndpoints.orders}/validate',
        body: {
          'items': items,
          'pharmacyId': pharmacyId,
          'deliveryAddress': deliveryAddress,
        },
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return response;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }
}
