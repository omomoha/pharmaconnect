import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/product_model.dart';
import 'api_service.dart';
import 'api_exception.dart';

class ProductService {
  final ApiService apiService;

  ProductService({required this.apiService});

  /// Fetch products with optional search, category filter, and pagination
  ///
  /// [search] - Search query for product name or description
  /// [category] - Filter by category (e.g., 'Pain Relief', 'Cold & Flu')
  /// [page] - Page number for pagination (0-indexed, defaults to 0)
  /// [pageSize] - Number of items per page (defaults to 20)
  ///
  /// Returns a map with 'products' (List<ProductModel>) and 'total' (int) count
  Future<Map<String, dynamic>> getProducts({
    String? search,
    String? category,
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      final response = await apiService.get(
        ApiEndpoints.products,
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final products = (response['data'] as List<dynamic>?)
              ?.map((p) => ProductModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];

      return {
        'products': products,
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

  /// Fetch a single product by ID
  ///
  /// [id] - Product ID
  ///
  /// Returns the ProductModel or throws an exception
  Future<ProductModel> getProductById(String id) async {
    try {
      final response = await apiService.get('${ApiEndpoints.products}/$id');

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return ProductModel.fromJson(response['data'] as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Fetch all products from a specific pharmacy
  ///
  /// [pharmacyId] - ID of the pharmacy
  /// [page] - Page number for pagination (0-indexed, defaults to 0)
  /// [pageSize] - Number of items per page (defaults to 20)
  ///
  /// Returns a map with 'products' (List<ProductModel>) and 'total' (int) count
  Future<Map<String, dynamic>> getPharmacyProducts({
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
        '${ApiEndpoints.pharmacies}/$pharmacyId/products',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final products = (response['data'] as List<dynamic>?)
              ?.map((p) => ProductModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];

      return {
        'products': products,
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

  /// Search products by multiple criteria
  ///
  /// [query] - Search query (searches name, description, manufacturer, dosageForm)
  /// [category] - Filter by category
  /// [minPrice] - Minimum price filter
  /// [maxPrice] - Maximum price filter
  /// [pharmacyId] - Filter by pharmacy
  /// [inStockOnly] - If true, only return products in stock
  /// [requiresPrescription] - Filter by prescription requirement
  /// [page] - Page number for pagination
  ///
  /// Returns a map with 'products' and 'total' count
  Future<Map<String, dynamic>> searchProducts({
    required String query,
    String? category,
    double? minPrice,
    double? maxPrice,
    String? pharmacyId,
    bool inStockOnly = false,
    bool? requiresPrescription,
    int page = 0,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = <String, String>{
        'search': query,
        'page': page.toString(),
        'limit': pageSize.toString(),
      };

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      if (minPrice != null) {
        queryParams['minPrice'] = minPrice.toString();
      }

      if (maxPrice != null) {
        queryParams['maxPrice'] = maxPrice.toString();
      }

      if (pharmacyId != null && pharmacyId.isNotEmpty) {
        queryParams['pharmacyId'] = pharmacyId;
      }

      if (inStockOnly) {
        queryParams['inStock'] = 'true';
      }

      if (requiresPrescription != null) {
        queryParams['requiresPrescription'] = requiresPrescription.toString();
      }

      final response = await apiService.get(
        '${ApiEndpoints.products}/search',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      final products = (response['data'] as List<dynamic>?)
              ?.map((p) => ProductModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];

      return {
        'products': products,
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

  /// Fetch featured/bestselling products
  ///
  /// [limit] - Maximum number of products to return
  ///
  /// Returns a list of ProductModel
  Future<List<ProductModel>> getFeaturedProducts({int limit = 10}) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
      };

      final response = await apiService.get(
        '${ApiEndpoints.products}/featured',
        queryParams: queryParams,
      );

      if (response is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Invalid response format',
          code: 'INVALID_RESPONSE',
        );
      }

      return (response['data'] as List<dynamic>?)
              ?.map((p) => ProductModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [];
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException.network(e);
    }
  }

  /// Get product categories
  ///
  /// Returns a list of available categories
  Future<List<String>> getCategories() async {
    try {
      final response = await apiService.get('${ApiEndpoints.products}/categories');

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

  /// Get subcategories for a specific category
  ///
  /// [category] - Parent category name
  ///
  /// Returns a list of subcategories
  Future<List<String>> getSubcategories(String category) async {
    try {
      final queryParams = <String, String>{
        'category': category,
      };

      final response = await apiService.get(
        '${ApiEndpoints.products}/subcategories',
        queryParams: queryParams,
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
