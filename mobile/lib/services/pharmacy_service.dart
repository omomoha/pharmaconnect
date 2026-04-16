import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/pharmacy_model.dart';
import 'api_service.dart';
import 'api_exception.dart';

class PharmacyService {
  final ApiService apiService;

  PharmacyService({required this.apiService});

  /// Fetch pharmacies with optional search and pagination
  ///
  /// [search] - Search query for pharmacy name, city, state
  /// [page] - Page number for pagination (0-indexed, defaults to 0)
  /// [pageSize] - Number of items per page (defaults to 20)
  /// [verifiedOnly] - If true, only return verified pharmacies
  /// [openOnly] - If true, only return currently open pharmacies
  ///
  /// Returns a map with 'pharmacies' (List<PharmacyModel>) and 'total' (int) count
  Future<Map<String, dynamic>> getPharmacies({
    String? search,
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
    bool verifiedOnly = false,
    bool openOnly = false,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      if (verifiedOnly) {
        queryParams['verified'] = 'true';
      }

      if (openOnly) {
        queryParams['open'] = 'true';
      }

      final response = await apiService.get(
        ApiEndpoints.pharmacies,
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final pharmacies = (response['data'] as List<dynamic>?)
              ?.map((p) => PharmacyModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];

      return {
        'pharmacies': pharmacies,
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

  /// Fetch nearby pharmacies based on geographical coordinates
  ///
  /// [latitude] - User's latitude coordinate
  /// [longitude] - User's longitude coordinate
  /// [radiusKm] - Search radius in kilometers (defaults to 10 km)
  /// [page] - Page number for pagination
  ///
  /// Returns a list of PharmacyModel sorted by distance (closest first)
  Future<List<PharmacyModel>> getNearbyPharmacies({
    required double latitude,
    required double longitude,
    double radiusKm = 10.0,
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'radius': radiusKm.toString(),
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      final response = await apiService.get(
        '${ApiEndpoints.pharmacies}/nearby',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return (response['data'] as List<dynamic>?)
              ?.map((p) => PharmacyModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Fetch a single pharmacy by ID
  ///
  /// [id] - Pharmacy ID
  ///
  /// Returns the PharmacyModel or throws an exception
  Future<PharmacyModel> getPharmacyById(String id) async {
    try {
      final response = await apiService.get('${ApiEndpoints.pharmacies}/$id');

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return PharmacyModel.fromJson(response['data'] as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Search pharmacies by multiple criteria
  ///
  /// [query] - Search query (searches name, city, state, address)
  /// [city] - Filter by city
  /// [state] - Filter by state
  /// [category] - Filter by product category available
  /// [minRating] - Minimum rating filter (0-5)
  /// [verifiedOnly] - If true, only return verified pharmacies
  /// [deliveryAvailable] - If true, only return pharmacies that offer delivery
  /// [page] - Page number for pagination
  ///
  /// Returns a map with 'pharmacies' and 'total' count
  Future<Map<String, dynamic>> searchPharmacies({
    required String query,
    String? city,
    String? state,
    String? category,
    double? minRating,
    bool verifiedOnly = false,
    bool deliveryAvailable = false,
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'search': query,
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      if (city != null && city.isNotEmpty) {
        queryParams['city'] = city;
      }

      if (state != null && state.isNotEmpty) {
        queryParams['state'] = state;
      }

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      if (minRating != null && minRating > 0) {
        queryParams['minRating'] = minRating.toString();
      }

      if (verifiedOnly) {
        queryParams['verified'] = 'true';
      }

      if (deliveryAvailable) {
        queryParams['delivery'] = 'true';
      }

      final response = await apiService.get(
        '${ApiEndpoints.pharmacies}/search',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final pharmacies = (response['data'] as List<dynamic>?)
              ?.map((p) => PharmacyModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];

      return {
        'pharmacies': pharmacies,
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

  /// Get featured/top-rated pharmacies
  ///
  /// [limit] - Maximum number of pharmacies to return
  ///
  /// Returns a list of PharmacyModel
  Future<List<PharmacyModel>> getFeaturedPharmacies({int limit = 10}) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
      };

      final response = await apiService.get(
        '${ApiEndpoints.pharmacies}/featured',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return (response['data'] as List<dynamic>?)
              ?.map((p) => PharmacyModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get pharmacy reviews
  ///
  /// [pharmacyId] - ID of the pharmacy
  /// [page] - Page number for pagination
  ///
  /// Returns a list of review objects
  Future<Map<String, dynamic>> getPharmacyReviews({
    required String pharmacyId,
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      final response = await apiService.get(
        '${ApiEndpoints.pharmacies}/$pharmacyId/reviews',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return {
        'reviews': response['data'] as List<dynamic>? ?? [],
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

  /// Submit a review for a pharmacy
  ///
  /// [pharmacyId] - ID of the pharmacy to review
  /// [rating] - Rating out of 5 (1-5)
  /// [comment] - Optional comment text
  ///
  /// Returns the created review data
  Future<Map<String, dynamic>> submitPharmacyReview({
    required String pharmacyId,
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
        '${ApiEndpoints.pharmacies}/$pharmacyId/reviews',
        body: {
          'rating': rating,
          'comment': comment,
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

  /// Get available cities with pharmacies
  ///
  /// Returns a list of city names
  Future<List<String>> getAvailableCities() async {
    try {
      final response = await apiService.get(
        '${ApiEndpoints.pharmacies}/cities',
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return List<String>.from(response['data'] as List<dynamic>? ?? []);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get available states with pharmacies
  ///
  /// Returns a list of state names
  Future<List<String>> getAvailableStates() async {
    try {
      final response = await apiService.get(
        '${ApiEndpoints.pharmacies}/states',
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return List<String>.from(response['data'] as List<dynamic>? ?? []);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }
}
