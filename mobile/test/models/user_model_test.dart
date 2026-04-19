import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/models/user_model.dart';

void main() {
  group('UserModel', () {
    final now = DateTime.now();

    final sampleUserJson = {
      'id': 'user_123',
      'email': 'john.doe@example.com',
      'displayName': 'John Doe',
      'phoneNumber': '+2348012345678',
      'role': 'customer',
      'photoUrl': 'https://example.com/photo.jpg',
      'createdAt': now.toIso8601String(),
      'updatedAt': now.toIso8601String(),
      'isEmailVerified': true,
      'isPhoneVerified': false,
      'metadata': {'address': '123 Main St', 'city': 'Lagos'},
    };

    test('fromJson creates UserModel correctly', () {
      final user = UserModel.fromJson(sampleUserJson);

      expect(user.id, 'user_123');
      expect(user.email, 'john.doe@example.com');
      expect(user.displayName, 'John Doe');
      expect(user.phoneNumber, '+2348012345678');
      expect(user.role, UserRole.customer);
      expect(user.isEmailVerified, true);
      expect(user.isPhoneVerified, false);
      expect(user.metadata?['city'], 'Lagos');
    });

    test('toJson serializes UserModel correctly', () {
      final user = UserModel.fromJson(sampleUserJson);
      final json = user.toJson();

      expect(json['id'], 'user_123');
      expect(json['email'], 'john.doe@example.com');
      expect(json['displayName'], 'John Doe');
      expect(json['role'], 'customer');
      expect(json['isEmailVerified'], true);
    });

    test('fromJson -> toJson -> fromJson round-trip', () {
      final original = UserModel.fromJson(sampleUserJson);
      final json = original.toJson();
      final restored = UserModel.fromJson(json);

      expect(restored, original);
      expect(restored.email, original.email);
      expect(restored.role, original.role);
    });

    test('handles null optional fields', () {
      final minimalJson = {
        'id': 'user_456',
        'email': 'minimal@example.com',
        'createdAt': now.toIso8601String(),
        'updatedAt': now.toIso8601String(),
      };

      final user = UserModel.fromJson(minimalJson);

      expect(user.id, 'user_456');
      expect(user.email, 'minimal@example.com');
      expect(user.displayName, null);
      expect(user.phoneNumber, null);
      expect(user.photoUrl, null);
      expect(user.metadata, null);
      expect(user.isEmailVerified, false);
      expect(user.isPhoneVerified, false);
    });

    test('handles default role as customer', () {
      final noRoleJson = {
        'id': 'user_789',
        'email': 'norole@example.com',
        'createdAt': now.toIso8601String(),
        'updatedAt': now.toIso8601String(),
      };

      final user = UserModel.fromJson(noRoleJson);

      expect(user.role, UserRole.customer);
    });

    test('handles different user roles', () {
      final roles = ['customer', 'pharmacyAdmin', 'deliveryAdmin', 'platformAdmin', 'supportAdmin'];

      for (final roleStr in roles) {
        final json = {
          ...sampleUserJson,
          'role': roleStr,
        };
        final user = UserModel.fromJson(json);

        expect(user.role.value, roleStr);
      }
    });

    test('copyWith creates new instance with updated fields', () {
      final user = UserModel.fromJson(sampleUserJson);
      final updated = user.copyWith(
        displayName: 'Jane Doe',
        isEmailVerified: false,
        role: UserRole.pharmacyAdmin,
      );

      expect(updated.id, user.id);
      expect(updated.email, user.email);
      expect(updated.displayName, 'Jane Doe');
      expect(updated.isEmailVerified, false);
      expect(updated.role, UserRole.pharmacyAdmin);
      expect(user.displayName, 'John Doe'); // Original unchanged
    });

    test('equality based on id, email, and role', () {
      final user1 = UserModel.fromJson(sampleUserJson);
      final user2 = UserModel.fromJson(sampleUserJson);
      final user3 = UserModel.fromJson({
        ...sampleUserJson,
        'displayName': 'Different Name', // Different displayName
      });

      expect(user1, user2);
      expect(user1, user3); // Same id, email, role
    });

    test('equality returns false for different email', () {
      final user1 = UserModel.fromJson(sampleUserJson);
      final user2 = UserModel.fromJson({
        ...sampleUserJson,
        'email': 'different@example.com',
      });

      expect(user1, isNot(user2));
    });

    test('toString provides readable output', () {
      final user = UserModel.fromJson(sampleUserJson);
      final result = user.toString();

      expect(result.contains('user_123'), true);
      expect(result.contains('john.doe@example.com'), true);
      expect(result.contains('customer'), true);
    });

    test('toFirestore excludes id field', () {
      final user = UserModel.fromJson(sampleUserJson);
      final firestore = user.toFirestore();

      expect(firestore.containsKey('id'), false);
      expect(firestore['email'], 'john.doe@example.com');
      expect(firestore['role'], 'customer');
    });

    test('handles metadata as nested object', () {
      final userWithMetadata = UserModel.fromJson(sampleUserJson);

      expect(userWithMetadata.metadata, isNotNull);
      expect(userWithMetadata.metadata?['address'], '123 Main St');
      expect(userWithMetadata.metadata?['city'], 'Lagos');
    });

    test('handles verification flags correctly', () {
      final verifiedJson = {
        ...sampleUserJson,
        'isEmailVerified': true,
        'isPhoneVerified': true,
      };
      final unverifiedJson = {
        ...sampleUserJson,
        'isEmailVerified': false,
        'isPhoneVerified': false,
      };

      final verified = UserModel.fromJson(verifiedJson);
      final unverified = UserModel.fromJson(unverifiedJson);

      expect(verified.isEmailVerified && verified.isPhoneVerified, true);
      expect(unverified.isEmailVerified || unverified.isPhoneVerified, false);
    });
  });

  group('UserRole', () {
    test('fromString returns correct enum', () {
      expect(UserRole.fromString('customer'), UserRole.customer);
      expect(UserRole.fromString('pharmacyAdmin'), UserRole.pharmacyAdmin);
      expect(UserRole.fromString('deliveryAdmin'), UserRole.deliveryAdmin);
      expect(UserRole.fromString('platformAdmin'), UserRole.platformAdmin);
      expect(UserRole.fromString('supportAdmin'), UserRole.supportAdmin);
    });

    test('fromString returns customer for unknown role', () {
      expect(UserRole.fromString('unknown'), UserRole.customer);
      expect(UserRole.fromString(''), UserRole.customer);
      expect(UserRole.fromString('invalid_role'), UserRole.customer);
    });

    test('value property returns correct string', () {
      expect(UserRole.customer.value, 'customer');
      expect(UserRole.pharmacyAdmin.value, 'pharmacyAdmin');
      expect(UserRole.deliveryAdmin.value, 'deliveryAdmin');
    });
  });
}
