import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/models/pharmacy_model.dart';

void main() {
  group('OperatingHours', () {
    test('fromJson creates OperatingHours correctly', () {
      final hoursJson = {
        'day': 'Monday',
        'openTime': '08:00',
        'closeTime': '20:00',
        'isOpen': true,
      };

      final hours = OperatingHours.fromJson(hoursJson);

      expect(hours.day, 'Monday');
      expect(hours.openTime, '08:00');
      expect(hours.closeTime, '20:00');
      expect(hours.isOpen, true);
    });

    test('toJson serializes OperatingHours correctly', () {
      final hoursJson = {
        'day': 'Sunday',
        'openTime': '10:00',
        'closeTime': '18:00',
        'isOpen': false,
      };

      final hours = OperatingHours.fromJson(hoursJson);
      final json = hours.toJson();

      expect(json['day'], 'Sunday');
      expect(json['openTime'], '10:00');
      expect(json['isOpen'], false);
    });
  });

  group('PharmacyModel', () {
    final now = DateTime.now();

    final samplePharmacyJson = {
      'id': 'pharm_123',
      'name': 'Trust Pharmacy',
      'description': 'A trusted community pharmacy',
      'address': '123 Main Street',
      'city': 'Lagos',
      'state': 'Lagos State',
      'phone': '+2348012345678',
      'email': 'trust@pharmacy.com',
      'logoUrl': 'https://example.com/logo.jpg',
      'coverImageUrl': 'https://example.com/cover.jpg',
      'rating': 4.7,
      'reviewCount': 156,
      'isVerified': true,
      'isOpen': true,
      'operatingHours': [
        {
          'day': 'Monday',
          'openTime': '08:00',
          'closeTime': '20:00',
          'isOpen': true,
        },
      ],
      'deliveryAvailable': true,
      'categories': ['Pain Relief', 'Cold & Cough', 'Vitamins'],
      'createdAt': now.toIso8601String(),
    };

    test('fromJson creates PharmacyModel correctly', () {
      final pharmacy = PharmacyModel.fromJson(samplePharmacyJson);

      expect(pharmacy.id, 'pharm_123');
      expect(pharmacy.name, 'Trust Pharmacy');
      expect(pharmacy.city, 'Lagos');
      expect(pharmacy.rating, 4.7);
      expect(pharmacy.isVerified, true);
      expect(pharmacy.deliveryAvailable, true);
      expect(pharmacy.categories?.length, 3);
    });

    test('toJson serializes PharmacyModel correctly', () {
      final pharmacy = PharmacyModel.fromJson(samplePharmacyJson);
      final json = pharmacy.toJson();

      expect(json['id'], 'pharm_123');
      expect(json['name'], 'Trust Pharmacy');
      expect(json['rating'], 4.7);
      expect(json['isVerified'], true);
    });

    test('fromJson -> toJson -> fromJson round-trip', () {
      final original = PharmacyModel.fromJson(samplePharmacyJson);
      final json = original.toJson();
      final restored = PharmacyModel.fromJson(json);

      expect(restored, original);
      expect(restored.name, original.name);
      expect(restored.rating, original.rating);
    });

    test('handles null optional fields', () {
      final minimalJson = {
        'id': 'pharm_456',
        'name': 'Simple Pharmacy',
        'description': 'A simple pharmacy',
        'address': '456 Oak Ave',
        'city': 'Abuja',
        'state': 'FCT',
        'phone': '+2349012345678',
        'email': 'simple@pharmacy.com',
        'createdAt': now.toIso8601String(),
      };

      final pharmacy = PharmacyModel.fromJson(minimalJson);

      expect(pharmacy.logoUrl, null);
      expect(pharmacy.coverImageUrl, null);
      expect(pharmacy.operatingHours, null);
      expect(pharmacy.categories, null);
      expect(pharmacy.rating, 0.0);
      expect(pharmacy.reviewCount, 0);
    });

    test('handles default values correctly', () {
      final jsonWithDefaults = {
        'id': 'pharm_default',
        'name': 'Default Pharmacy',
        'description': 'Description',
        'address': 'Address',
        'city': 'City',
        'state': 'State',
        'phone': 'Phone',
        'email': 'email@test.com',
        'createdAt': now.toIso8601String(),
      };

      final pharmacy = PharmacyModel.fromJson(jsonWithDefaults);

      expect(pharmacy.rating, 0.0);
      expect(pharmacy.reviewCount, 0);
      expect(pharmacy.isVerified, false);
      expect(pharmacy.isOpen, true);
      expect(pharmacy.deliveryAvailable, true);
    });

    test('copyWith creates new instance with updated fields', () {
      final pharmacy = PharmacyModel.fromJson(samplePharmacyJson);
      final updated = pharmacy.copyWith(
        rating: 4.9,
        isVerified: false,
        isOpen: false,
      );

      expect(updated.id, pharmacy.id);
      expect(updated.name, pharmacy.name);
      expect(updated.rating, 4.9);
      expect(updated.isVerified, false);
      expect(updated.isOpen, false);
      expect(pharmacy.rating, 4.7); // Original unchanged
    });

    test('equality based on id', () {
      final pharmacy1 = PharmacyModel.fromJson(samplePharmacyJson);
      final pharmacy2 = PharmacyModel.fromJson(samplePharmacyJson);
      final pharmacy3 = PharmacyModel.fromJson({
        ...samplePharmacyJson,
        'rating': 3.5, // Different rating
      });

      expect(pharmacy1, pharmacy2);
      expect(pharmacy1, pharmacy3); // Same id
    });

    test('toString provides readable output', () {
      final pharmacy = PharmacyModel.fromJson(samplePharmacyJson);
      final result = pharmacy.toString();

      expect(result.contains('pharm_123'), true);
      expect(result.contains('Trust Pharmacy'), true);
      expect(result.contains('Lagos'), true);
      expect(result.contains('4.7'), true);
    });

    test('toFirestore excludes id field', () {
      final pharmacy = PharmacyModel.fromJson(samplePharmacyJson);
      final firestore = pharmacy.toFirestore();

      expect(firestore.containsKey('id'), false);
      expect(firestore['name'], 'Trust Pharmacy');
      expect(firestore['rating'], 4.7);
    });

    test('handles operating hours list', () {
      final json = {
        ...samplePharmacyJson,
        'operatingHours': [
          {
            'day': 'Monday',
            'openTime': '08:00',
            'closeTime': '20:00',
            'isOpen': true,
          },
          {
            'day': 'Sunday',
            'openTime': '10:00',
            'closeTime': '18:00',
            'isOpen': false,
          },
        ],
      };

      final pharmacy = PharmacyModel.fromJson(json);

      expect(pharmacy.operatingHours?.length, 2);
      expect(pharmacy.operatingHours?[0].day, 'Monday');
      expect(pharmacy.operatingHours?[1].isOpen, false);
    });

    test('handles categories list', () {
      final json = {
        ...samplePharmacyJson,
        'categories': ['Antibiotic', 'Pain Relief', 'Vitamins', 'Cold Medicine'],
      };

      final pharmacy = PharmacyModel.fromJson(json);

      expect(pharmacy.categories?.length, 4);
      expect(pharmacy.categories?.contains('Antibiotic'), true);
    });

    test('handles empty categories list', () {
      final json = {
        ...samplePharmacyJson,
        'categories': [],
      };

      final pharmacy = PharmacyModel.fromJson(json);

      expect(pharmacy.categories?.length, 0);
    });

    test('verification and status flags work correctly', () {
      final verifiedOpenJson = {
        ...samplePharmacyJson,
        'isVerified': true,
        'isOpen': true,
      };
      final unverifiedClosedJson = {
        ...samplePharmacyJson,
        'isVerified': false,
        'isOpen': false,
      };

      final verified = PharmacyModel.fromJson(verifiedOpenJson);
      final unverified = PharmacyModel.fromJson(unverifiedClosedJson);

      expect(verified.isVerified && verified.isOpen, true);
      expect(unverified.isVerified || unverified.isOpen, false);
    });

    test('delivery availability flag', () {
      final withDeliveryJson = {
        ...samplePharmacyJson,
        'deliveryAvailable': true,
      };
      final noDeliveryJson = {
        ...samplePharmacyJson,
        'deliveryAvailable': false,
      };

      final withDelivery = PharmacyModel.fromJson(withDeliveryJson);
      final noDelivery = PharmacyModel.fromJson(noDeliveryJson);

      expect(withDelivery.deliveryAvailable, true);
      expect(noDelivery.deliveryAvailable, false);
    });

    test('rating and review count', () {
      final highRatedJson = {
        ...samplePharmacyJson,
        'rating': 4.9,
        'reviewCount': 500,
      };

      final lowRatedJson = {
        ...samplePharmacyJson,
        'rating': 2.5,
        'reviewCount': 10,
      };

      final highRated = PharmacyModel.fromJson(highRatedJson);
      final lowRated = PharmacyModel.fromJson(lowRatedJson);

      expect(highRated.rating > lowRated.rating, true);
      expect(highRated.reviewCount > lowRated.reviewCount, true);
    });
  });
}
