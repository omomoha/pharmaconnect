import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/models/order_model.dart';

void main() {
  group('OrderItem', () {
    test('fromJson creates OrderItem correctly', () {
      final itemJson = {
        'productId': 'prod_123',
        'productName': 'Paracetamol 500mg',
        'quantity': 2,
        'price': 500.0,
        'imageUrl': 'https://example.com/image.jpg',
      };

      final item = OrderItem.fromJson(itemJson);

      expect(item.productId, 'prod_123');
      expect(item.productName, 'Paracetamol 500mg');
      expect(item.quantity, 2);
      expect(item.price, 500.0);
      expect(item.imageUrl, 'https://example.com/image.jpg');
    });

    test('toJson serializes OrderItem correctly', () {
      final itemJson = {
        'productId': 'prod_456',
        'productName': 'Aspirin 100mg',
        'quantity': 1,
        'price': 250.0,
        'imageUrl': null,
      };

      final item = OrderItem.fromJson(itemJson);
      final json = item.toJson();

      expect(json['productId'], 'prod_456');
      expect(json['productName'], 'Aspirin 100mg');
      expect(json['quantity'], 1);
      expect(json['price'], 250.0);
    });

    test('subtotal calculates correctly', () {
      final itemJson = {
        'productId': 'prod_789',
        'productName': 'Medicine',
        'quantity': 5,
        'price': 100.0,
      };

      final item = OrderItem.fromJson(itemJson);

      expect(item.subtotal, 500.0); // 5 * 100
    });

    test('copyWith creates new instance', () {
      final item = OrderItem.fromJson({
        'productId': 'prod_123',
        'productName': 'Paracetamol',
        'quantity': 2,
        'price': 500.0,
      });

      final updated = item.copyWith(quantity: 5);

      expect(updated.productId, item.productId);
      expect(updated.quantity, 5);
      expect(item.quantity, 2); // Original unchanged
    });

    test('equality based on productId', () {
      final item1 = OrderItem.fromJson({
        'productId': 'prod_123',
        'productName': 'Product A',
        'quantity': 1,
        'price': 100.0,
      });

      final item2 = OrderItem.fromJson({
        'productId': 'prod_123',
        'productName': 'Product A',
        'quantity': 5, // Different quantity
        'price': 100.0,
      });

      expect(item1, item2);
    });
  });

  group('TrackingEvent', () {
    final now = DateTime.now();

    test('fromJson creates TrackingEvent correctly', () {
      final eventJson = {
        'status': 'out_for_delivery',
        'description': 'Rider is on the way',
        'timestamp': now.toIso8601String(),
        'latitude': 6.5244,
        'longitude': 3.3792,
      };

      final event = TrackingEvent.fromJson(eventJson);

      expect(event.status, 'out_for_delivery');
      expect(event.description, 'Rider is on the way');
      expect(event.latitude, 6.5244);
      expect(event.longitude, 3.3792);
    });

    test('toJson serializes TrackingEvent correctly', () {
      final eventJson = {
        'status': 'picked_up',
        'description': null,
        'timestamp': now.toIso8601String(),
        'latitude': null,
        'longitude': null,
      };

      final event = TrackingEvent.fromJson(eventJson);
      final json = event.toJson();

      expect(json['status'], 'picked_up');
      expect(json['timestamp'], isNotNull);
    });
  });

  group('TrackingInfo', () {
    final now = DateTime.now();

    final trackingJson = {
      'deliveryRiderId': 'rider_123',
      'deliveryRiderName': 'Ahmed',
      'deliveryRiderPhone': '+2348012345678',
      'vehicleInfo': 'Motorcycle - XYZ 123',
      'currentLatitude': 6.5244,
      'currentLongitude': 3.3792,
      'estimatedDeliveryTime': now.add(Duration(hours: 1)).toIso8601String(),
      'events': [],
    };

    test('fromJson creates TrackingInfo correctly', () {
      final info = TrackingInfo.fromJson(trackingJson);

      expect(info.deliveryRiderId, 'rider_123');
      expect(info.deliveryRiderName, 'Ahmed');
      expect(info.currentLatitude, 6.5244);
      expect(info.currentLongitude, 3.3792);
    });

    test('toJson serializes TrackingInfo correctly', () {
      final info = TrackingInfo.fromJson(trackingJson);
      final json = info.toJson();

      expect(json['deliveryRiderId'], 'rider_123');
      expect(json['deliveryRiderName'], 'Ahmed');
    });

    test('copyWith creates new instance', () {
      final info = TrackingInfo.fromJson(trackingJson);
      final updated = info.copyWith(
        currentLatitude: 6.6000,
        currentLongitude: 3.4000,
      );

      expect(updated.deliveryRiderId, info.deliveryRiderId);
      expect(updated.currentLatitude, 6.6000);
      expect(info.currentLatitude, 6.5244); // Original unchanged
    });
  });

  group('OrderModel', () {
    final now = DateTime.now();

    final orderJson = {
      'id': 'order_123',
      'userId': 'user_456',
      'pharmacyId': 'pharm_789',
      'pharmacyName': 'Trust Pharmacy',
      'items': [
        {
          'productId': 'prod_1',
          'productName': 'Paracetamol 500mg',
          'quantity': 2,
          'price': 500.0,
        },
      ],
      'subtotal': 1000.0,
      'deliveryFee': 500.0,
      'serviceFee': 100.0,
      'total': 1600.0,
      'status': 'pending',
      'paymentMethod': 'card',
      'paymentReference': 'ref_12345',
      'deliveryAddress': '123 Main St, Lagos',
      'deliveryProviderId': 'provider_999',
      'trackingInfo': null,
      'createdAt': now.toIso8601String(),
      'updatedAt': now.toIso8601String(),
    };

    test('fromJson creates OrderModel correctly', () {
      final order = OrderModel.fromJson(orderJson);

      expect(order.id, 'order_123');
      expect(order.userId, 'user_456');
      expect(order.pharmacyId, 'pharm_789');
      expect(order.total, 1600.0);
      expect(order.status, OrderStatus.pending);
      expect(order.items.length, 1);
    });

    test('toJson serializes OrderModel correctly', () {
      final order = OrderModel.fromJson(orderJson);
      final json = order.toJson();

      expect(json['id'], 'order_123');
      expect(json['userId'], 'user_456');
      expect(json['total'], 1600.0);
      expect(json['status'], 'pending');
    });

    test('fromJson -> toJson -> fromJson round-trip', () {
      final original = OrderModel.fromJson(orderJson);
      final json = original.toJson();
      final restored = OrderModel.fromJson(json);

      expect(restored, original);
      expect(restored.total, original.total);
      expect(restored.status, original.status);
    });

    test('handles different order statuses', () {
      final statuses = ['pending', 'confirmed', 'preparing', 'ready', 'outForDelivery', 'delivered', 'cancelled'];

      for (final statusStr in statuses) {
        final json = {
          ...orderJson,
          'status': statusStr,
        };
        final order = OrderModel.fromJson(json);

        expect(order.status.value, statusStr);
      }
    });

    test('itemCount calculates correctly', () {
      final order = OrderModel.fromJson(orderJson);

      expect(order.itemCount, 2); // 2 units of one product
    });

    test('itemCount with multiple items', () {
      final multiItemJson = {
        ...orderJson,
        'items': [
          {
            'productId': 'prod_1',
            'productName': 'Product 1',
            'quantity': 2,
            'price': 500.0,
          },
          {
            'productId': 'prod_2',
            'productName': 'Product 2',
            'quantity': 3,
            'price': 200.0,
          },
        ],
      };

      final order = OrderModel.fromJson(multiItemJson);

      expect(order.itemCount, 5); // 2 + 3
    });

    test('copyWith creates new instance with updated fields', () {
      final order = OrderModel.fromJson(orderJson);
      final updated = order.copyWith(
        status: OrderStatus.delivered,
        total: 1700.0,
      );

      expect(updated.id, order.id);
      expect(updated.status, OrderStatus.delivered);
      expect(updated.total, 1700.0);
      expect(order.status, OrderStatus.pending); // Original unchanged
    });

    test('equality based on id and userId', () {
      final order1 = OrderModel.fromJson(orderJson);
      final order2 = OrderModel.fromJson(orderJson);
      final order3 = OrderModel.fromJson({
        ...orderJson,
        'total': 2000.0, // Different total
      });

      expect(order1, order2);
      expect(order1, order3); // Same id and userId
    });

    test('toString provides readable output', () {
      final order = OrderModel.fromJson(orderJson);
      final result = order.toString();

      expect(result.contains('order_123'), true);
      expect(result.contains('pending'), true);
      expect(result.contains('1600'), true);
    });

    test('handles null tracking info', () {
      final order = OrderModel.fromJson(orderJson);

      expect(order.trackingInfo, null);
    });

    test('handles optional fields', () {
      final minimalJson = {
        'id': 'order_min',
        'userId': 'user_min',
        'pharmacyId': 'pharm_min',
        'pharmacyName': 'Minimal Pharmacy',
        'items': [],
        'subtotal': 0.0,
        'deliveryFee': 0.0,
        'serviceFee': 0.0,
        'total': 0.0,
        'deliveryAddress': 'Address',
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      };

      final order = OrderModel.fromJson(minimalJson);

      expect(order.paymentMethod, null);
      expect(order.paymentReference, null);
      expect(order.deliveryProviderId, null);
      expect(order.trackingInfo, null);
    });
  });

  group('OrderStatus', () {
    test('fromString returns correct enum', () {
      expect(OrderStatus.fromString('pending'), OrderStatus.pending);
      expect(OrderStatus.fromString('confirmed'), OrderStatus.confirmed);
      expect(OrderStatus.fromString('preparing'), OrderStatus.preparing);
      expect(OrderStatus.fromString('ready'), OrderStatus.ready);
      expect(OrderStatus.fromString('outForDelivery'), OrderStatus.outForDelivery);
      expect(OrderStatus.fromString('delivered'), OrderStatus.delivered);
      expect(OrderStatus.fromString('cancelled'), OrderStatus.cancelled);
    });

    test('fromString returns pending for unknown status', () {
      expect(OrderStatus.fromString('unknown'), OrderStatus.pending);
      expect(OrderStatus.fromString(''), OrderStatus.pending);
    });

    test('displayName returns human readable string', () {
      expect(OrderStatus.pending.displayName, 'Pending');
      expect(OrderStatus.delivered.displayName, 'Delivered');
      expect(OrderStatus.cancelled.displayName, 'Cancelled');
      expect(OrderStatus.ready.displayName, 'Ready for Delivery');
      expect(OrderStatus.outForDelivery.displayName, 'Out for Delivery');
    });
  });
}
