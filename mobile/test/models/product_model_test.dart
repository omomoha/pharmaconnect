import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/models/product_model.dart';

void main() {
  group('ProductModel', () {
    final now = DateTime.now();

    final sampleProductJson = {
      'id': 'prod_123',
      'name': 'Paracetamol 500mg',
      'description': 'Pain reliever and fever reducer',
      'price': 500.0,
      'compareAtPrice': 650.0,
      'category': 'Pain Relief',
      'subcategory': 'Analgesics',
      'pharmacyId': 'pharm_456',
      'pharmacyName': 'Trust Pharmacy',
      'images': ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      'inStock': true,
      'stockQuantity': 100,
      'requiresPrescription': false,
      'dosageForm': 'Tablet',
      'strength': '500mg',
      'manufacturer': 'GlaxoSmithKline',
      'tags': ['pain', 'fever', 'OTC'],
      'rating': 4.5,
      'reviewCount': 42,
      'createdAt': now.toIso8601String(),
    };

    test('fromJson creates ProductModel correctly', () {
      final product = ProductModel.fromJson(sampleProductJson);

      expect(product.id, 'prod_123');
      expect(product.name, 'Paracetamol 500mg');
      expect(product.price, 500.0);
      expect(product.compareAtPrice, 650.0);
      expect(product.pharmacyId, 'pharm_456');
      expect(product.inStock, true);
      expect(product.requiresPrescription, false);
      expect(product.tags, ['pain', 'fever', 'OTC']);
      expect(product.rating, 4.5);
      expect(product.reviewCount, 42);
    });

    test('toJson serializes ProductModel correctly', () {
      final product = ProductModel.fromJson(sampleProductJson);
      final json = product.toJson();

      expect(json['id'], 'prod_123');
      expect(json['name'], 'Paracetamol 500mg');
      expect(json['price'], 500.0);
      expect(json['pharmacyId'], 'pharm_456');
      expect(json['inStock'], true);
      expect(json['tags'], ['pain', 'fever', 'OTC']);
    });

    test('fromJson -> toJson -> fromJson round-trip', () {
      final original = ProductModel.fromJson(sampleProductJson);
      final json = original.toJson();
      final restored = ProductModel.fromJson(json);

      expect(restored, original);
      expect(restored.name, original.name);
      expect(restored.price, original.price);
      expect(restored.pharmacyId, original.pharmacyId);
    });

    test('handles null optional fields', () {
      final minimalJson = {
        'id': 'prod_789',
        'name': 'Simple Product',
        'description': 'A simple product',
        'price': 100.0,
        'category': 'General',
        'pharmacyId': 'pharm_999',
        'pharmacyName': 'Local Pharmacy',
        'images': [],
        'inStock': true,
        'stockQuantity': 50,
        'requiresPrescription': false,
        'createdAt': now.toIso8601String(),
      };

      final product = ProductModel.fromJson(minimalJson);

      expect(product.id, 'prod_789');
      expect(product.compareAtPrice, null);
      expect(product.subcategory, null);
      expect(product.dosageForm, null);
      expect(product.strength, null);
      expect(product.manufacturer, null);
      expect(product.tags, null);
      expect(product.rating, 0.0);
      expect(product.reviewCount, 0);
    });

    test('handles default values correctly', () {
      final jsonWithDefaults = {
        'id': 'prod_default',
        'name': 'Test Product',
        'description': 'Description',
        'price': 200.0,
        'category': 'Test',
        'pharmacyId': 'pharm_1',
        'pharmacyName': 'Test Pharmacy',
        'images': [],
        'createdAt': now.toIso8601String(),
      };

      final product = ProductModel.fromJson(jsonWithDefaults);

      expect(product.inStock, true);
      expect(product.stockQuantity, 0);
      expect(product.requiresPrescription, false);
      expect(product.rating, 0.0);
      expect(product.reviewCount, 0);
    });

    test('copyWith creates new instance with updated fields', () {
      final product = ProductModel.fromJson(sampleProductJson);
      final updated = product.copyWith(
        price: 450.0,
        inStock: false,
        rating: 4.8,
      );

      expect(updated.id, product.id);
      expect(updated.name, product.name);
      expect(updated.price, 450.0);
      expect(updated.inStock, false);
      expect(updated.rating, 4.8);
      expect(product.price, 500.0); // Original unchanged
    });

    test('equality based on id and pharmacyId', () {
      final product1 = ProductModel.fromJson(sampleProductJson);
      final product2 = ProductModel.fromJson(sampleProductJson);
      final product3 = ProductModel.fromJson({
        ...sampleProductJson,
        'price': 600.0, // Different price
      });

      expect(product1, product2);
      expect(product1, product3); // Same id and pharmacyId
    });

    test('images list handles empty and multiple values', () {
      final withImages = {
        ...sampleProductJson,
        'images': ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      };
      final withoutImages = {
        ...sampleProductJson,
        'images': [],
      };

      final productWithImages = ProductModel.fromJson(withImages);
      final productWithoutImages = ProductModel.fromJson(withoutImages);

      expect(productWithImages.images.length, 3);
      expect(productWithoutImages.images.length, 0);
    });

    test('handles price as int or double', () {
      final jsonWithIntPrice = {
        ...sampleProductJson,
        'price': 500, // int instead of double
        'compareAtPrice': 650,
      };

      final product = ProductModel.fromJson(jsonWithIntPrice);

      expect(product.price, 500.0);
      expect(product.compareAtPrice, 650.0);
      expect(product.price is double, true);
    });

    test('toString provides readable output', () {
      final product = ProductModel.fromJson(sampleProductJson);
      final result = product.toString();

      expect(result.contains('prod_123'), true);
      expect(result.contains('Paracetamol 500mg'), true);
      expect(result.contains('pharm_456'), true);
    });

    test('handles stock quantity changes', () {
      final outOfStockJson = {
        ...sampleProductJson,
        'inStock': false,
        'stockQuantity': 0,
      };

      final product = ProductModel.fromJson(outOfStockJson);

      expect(product.inStock, false);
      expect(product.stockQuantity, 0);
    });
  });
}
