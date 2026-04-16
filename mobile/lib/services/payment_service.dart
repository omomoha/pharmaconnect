import 'package:pharmaconnect/config/constants.dart';
import 'api_service.dart';
import 'api_exception.dart';

class PaymentService {
  final ApiService apiService;

  PaymentService({required this.apiService});

  /// Initialize payment for an order
  ///
  /// [orderId] - ID of the order to pay for
  /// [amount] - Payment amount in the smallest currency unit (e.g., kobo for NGN)
  /// [paymentMethod] - Payment method (e.g., 'card', 'bank_transfer', 'ussd')
  /// [email] - Customer's email address
  /// [phoneNumber] - Optional customer phone number
  /// [metadata] - Optional metadata to attach to the payment
  ///
  /// Returns payment initialization response with authorization URL or reference
  Future<Map<String, dynamic>> initializePayment({
    required String orderId,
    required int amount,
    required String paymentMethod,
    required String email,
    String? phoneNumber,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      if (amount <= 0) {
        throw ApiException(
          message: 'Amount must be greater than 0',
          code: 'INVALID_AMOUNT',
        );
      }

      final body = {
        'orderId': orderId,
        'amount': amount,
        'paymentMethod': paymentMethod,
        'email': email,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
        if (metadata != null) 'metadata': metadata,
      };

      final response = await apiService.post(
        '${ApiEndpoints.orders}/$orderId/initialize-payment',
        body: body,
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

  /// Verify a payment transaction
  ///
  /// [reference] - Payment reference or transaction ID from payment gateway
  /// [orderId] - ID of the associated order
  ///
  /// Returns payment verification response with status and transaction details
  Future<Map<String, dynamic>> verifyPayment({
    required String reference,
    required String orderId,
  }) async {
    try {
      final response = await apiService.get(
        '${ApiEndpoints.orders}/$orderId/verify-payment',
        queryParams: {
          'reference': reference,
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

  /// Get payment methods available
  ///
  /// Returns a list of supported payment methods with descriptions
  Future<List<Map<String, dynamic>>> getPaymentMethods() async {
    try {
      final response = await apiService.get('/payments/methods');

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

  /// Get payment history
  ///
  /// [page] - Page number for pagination
  /// [status] - Optional status filter (successful, pending, failed)
  ///
  /// Returns a map with payment transactions and total count
  Future<Map<String, dynamic>> getPaymentHistory({
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
        '/payments/history',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return {
        'transactions': response['data'] as List<dynamic>? ?? [],
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

  /// Get a specific transaction details
  ///
  /// [transactionId] - ID of the transaction
  ///
  /// Returns the transaction details
  Future<Map<String, dynamic>> getTransactionDetails(String transactionId) async {
    try {
      final response = await apiService.get('/payments/$transactionId');

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

  /// Save a payment method for future use
  ///
  /// [paymentMethodToken] - Token from payment gateway
  /// [methodName] - Display name for the saved method
  /// [isDefault] - Whether to set as default payment method
  ///
  /// Returns the saved payment method details
  Future<Map<String, dynamic>> savePaymentMethod({
    required String paymentMethodToken,
    required String methodName,
    bool isDefault = false,
  }) async {
    try {
      final response = await apiService.post(
        '/payments/methods/save',
        body: {
          'paymentMethodToken': paymentMethodToken,
          'methodName': methodName,
          'isDefault': isDefault,
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

  /// Get saved payment methods
  ///
  /// Returns a list of saved payment methods for the user
  Future<List<Map<String, dynamic>>> getSavedPaymentMethods() async {
    try {
      final response = await apiService.get('/payments/methods/saved');

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

  /// Delete a saved payment method
  ///
  /// [methodId] - ID of the saved payment method
  ///
  /// Returns success confirmation
  Future<bool> deletePaymentMethod(String methodId) async {
    try {
      final response = await apiService.delete(
        '/payments/methods/$methodId',
      );

      if (response is! Map<String, dynamic>) {
        return false;
      }

      return response['success'] as bool? ?? false;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Set a saved payment method as default
  ///
  /// [methodId] - ID of the saved payment method
  ///
  /// Returns the updated payment method
  Future<Map<String, dynamic>> setDefaultPaymentMethod(String methodId) async {
    try {
      final response = await apiService.patch(
        '/payments/methods/$methodId/set-default',
        body: {},
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

  /// Retry a failed payment
  ///
  /// [orderId] - ID of the order with failed payment
  /// [paymentMethod] - New payment method to try
  /// [email] - Customer email
  ///
  /// Returns payment initialization response
  Future<Map<String, dynamic>> retryPayment({
    required String orderId,
    required String paymentMethod,
    required String email,
  }) async {
    try {
      final response = await apiService.post(
        '${ApiEndpoints.orders}/$orderId/retry-payment',
        body: {
          'paymentMethod': paymentMethod,
          'email': email,
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

  /// Calculate total order cost with fees and taxes
  ///
  /// [subtotal] - Subtotal before fees
  /// [deliveryFee] - Delivery fee (optional)
  /// [promoCode] - Promo code for discounts (optional)
  ///
  /// Returns breakdown with serviceFee, tax, discount, and total
  Future<Map<String, dynamic>> calculateOrderCost({
    required double subtotal,
    double? deliveryFee,
    String? promoCode,
  }) async {
    try {
      final body = {
        'subtotal': subtotal,
        if (deliveryFee != null) 'deliveryFee': deliveryFee,
        if (promoCode != null) 'promoCode': promoCode,
      };

      final response = await apiService.post(
        '/payments/calculate-cost',
        body: body,
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

  /// Validate a promo code
  ///
  /// [code] - Promo code to validate
  /// [subtotal] - Order subtotal for discount calculation
  ///
  /// Returns discount details if valid, throws exception if invalid
  Future<Map<String, dynamic>> validatePromoCode({
    required String code,
    required double subtotal,
  }) async {
    try {
      final response = await apiService.get(
        '/payments/validate-promo',
        queryParams: {
          'code': code,
          'subtotal': subtotal.toString(),
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
}
