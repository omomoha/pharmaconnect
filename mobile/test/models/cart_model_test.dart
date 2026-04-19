import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/models/cart_model.dart';
import 'package:pharmaconnect/models/product_model.dart';

void main() {
  group('CartItem', () {
    final sampleProduct = ProductModel(
      id: 'prod_123',
      name: 'Paracetamol 500mg',
      description: 'Pain reliever',
      price: 500.0,
      category: 'Pain Relief',
      pharmacyId: 'pharm_1',
      pharmacyName: 'Trust Pharmacy',
      images: [],
      inStock: true,
      stockQuantity: 100,
      requiresPrescription: false,
      createdAt: DateTime.now(),
    );

    test('creates CartItem with correct properties', () {
      final item = CartItem(product: sampleProduct, quantity: 2);

      expect(item.product.id, 'prod_123');
      expect(item.quantity, 2);
    });

    test('itemSubtotal calculates correctly', () {
      final item = CartItem(product: sampleProduct, quantity: 3);

      expect(item.itemSubtotal, 1500.0); // 500 * 3
    });

    test('copyWith creates new instance with updated fields', () {
      final item = CartItem(product: sampleProduct, quantity: 2);
      final updated = item.copyWith(quantity: 5);

      expect(updated.product.id, item.product.id);
      expect(updated.quantity, 5);
      expect(item.quantity, 2); // Original unchanged
    });

    test('equality based on product id', () {
      final item1 = CartItem(product: sampleProduct, quantity: 2);
      final item2 = CartItem(product: sampleProduct, quantity: 5);

      expect(item1, item2); // Same product id, different quantity
    });

    test('toString provides readable output', () {
      final item = CartItem(product: sampleProduct, quantity: 3);
      final result = item.toString();

      expect(result.contains('prod_123'), true);
      expect(result.contains('3'), true);
    });
  });

  group('Cart', () {
    final product1 = ProductModel(
      id: 'prod_1',
      name: 'Product 1',
      description: 'Description 1',
      price: 100.0,
      category: 'Category 1',
      pharmacyId: 'pharm_1',
      pharmacyName: 'Pharmacy 1',
      images: [],
      inStock: true,
      stockQuantity: 50,
      requiresPrescription: false,
      createdAt: DateTime.now(),
    );

    final product2 = ProductModel(
      id: 'prod_2',
      name: 'Product 2',
      description: 'Description 2',
      price: 200.0,
      category: 'Category 2',
      pharmacyId: 'pharm_1',
      pharmacyName: 'Pharmacy 1',
      images: [],
      inStock: true,
      stockQuantity: 30,
      requiresPrescription: false,
      createdAt: DateTime.now(),
    );

    final product3 = ProductModel(
      id: 'prod_3',
      name: 'Product 3',
      description: 'Description 3',
      price: 300.0,
      category: 'Category 3',
      pharmacyId: 'pharm_2', // Different pharmacy
      pharmacyName: 'Pharmacy 2',
      images: [],
      inStock: true,
      stockQuantity: 20,
      requiresPrescription: false,
      createdAt: DateTime.now(),
    );

    test('creates empty cart', () {
      final cart = Cart(items: []);

      expect(cart.isEmpty, true);
      expect(cart.itemCount, 0);
      expect(cart.subtotal, 0.0);
    });

    test('subtotal calculates correctly', () {
      final items = [
        CartItem(product: product1, quantity: 2), // 100 * 2 = 200
        CartItem(product: product2, quantity: 3), // 200 * 3 = 600
      ];
      final cart = Cart(items: items);

      expect(cart.subtotal, 800.0); // 200 + 600
    });

    test('total includes delivery and service fees', () {
      final items = [CartItem(product: product1, quantity: 2)];
      final cart = Cart(
        items: items,
        deliveryFee: 500.0,
        serviceFee: 50.0,
      );

      expect(cart.subtotal, 200.0);
      expect(cart.total, 750.0); // 200 + 500 + 50
    });

    test('total without fees equals subtotal', () {
      final items = [CartItem(product: product1, quantity: 1)];
      final cart = Cart(items: items);

      expect(cart.subtotal, 100.0);
      expect(cart.total, 100.0);
    });

    test('itemCount sums quantity of all items', () {
      final items = [
        CartItem(product: product1, quantity: 2),
        CartItem(product: product2, quantity: 3),
      ];
      final cart = Cart(items: items);

      expect(cart.itemCount, 5); // 2 + 3
    });

    test('pharmacyId returns first item pharmacy when all from same pharmacy', () {
      final items = [
        CartItem(product: product1, quantity: 1),
        CartItem(product: product2, quantity: 1),
      ];
      final cart = Cart(items: items);

      expect(cart.pharmacyId, 'pharm_1');
    });

    test('pharmacyId returns null when items from different pharmacies', () {
      final items = [
        CartItem(product: product1, quantity: 1),
        CartItem(product: product3, quantity: 1),
      ];
      final cart = Cart(items: items);

      expect(cart.pharmacyId, null);
    });

    test('canCheckout returns true for valid cart', () {
      final items = [CartItem(product: product1, quantity: 1)];
      final cart = Cart(items: items);

      expect(cart.canCheckout(), true);
    });

    test('canCheckout returns false for empty cart', () {
      final cart = Cart(items: []);

      expect(cart.canCheckout(), false);
    });

    test('canCheckout returns false for mixed pharmacy items', () {
      final items = [
        CartItem(product: product1, quantity: 1),
        CartItem(product: product3, quantity: 1),
      ];
      final cart = Cart(items: items);

      expect(cart.canCheckout(), false);
    });

    test('canCheckout returns false for out of stock items', () {
      final outOfStock = product1.copyWith(inStock: false);
      final items = [CartItem(product: outOfStock, quantity: 1)];
      final cart = Cart(items: items);

      expect(cart.canCheckout(), false);
    });

    test('getCheckoutError returns appropriate messages', () {
      final emptyCart = Cart(items: []);
      expect(emptyCart.getCheckoutError(), 'Cart is empty');

      final mixedCart = Cart(items: [
        CartItem(product: product1, quantity: 1),
        CartItem(product: product3, quantity: 1),
      ]);
      expect(mixedCart.getCheckoutError(), 'Items must be from the same pharmacy');

      final outOfStock = product1.copyWith(inStock: false, name: 'Paracetamol');
      final outOfStockCart = Cart(items: [
        CartItem(product: outOfStock, quantity: 1),
      ]);
      expect(outOfStockCart.getCheckoutError(), 'Paracetamol is out of stock');
    });

    test('addItem adds new item to cart', () {
      final cart = Cart(items: []);
      final newItem = CartItem(product: product1, quantity: 2);
      final updated = cart.addItem(newItem);

      expect(updated.items.length, 1);
      expect(updated.items[0].quantity, 2);
    });

    test('addItem increases quantity if product already in cart', () {
      final item = CartItem(product: product1, quantity: 2);
      final cart = Cart(items: [item]);
      final newItem = CartItem(product: product1, quantity: 3);
      final updated = cart.addItem(newItem);

      expect(updated.items.length, 1);
      expect(updated.items[0].quantity, 5); // 2 + 3
    });

    test('removeItem removes item from cart', () {
      final items = [
        CartItem(product: product1, quantity: 2),
        CartItem(product: product2, quantity: 1),
      ];
      final cart = Cart(items: items);
      final updated = cart.removeItem('prod_1');

      expect(updated.items.length, 1);
      expect(updated.items[0].product.id, 'prod_2');
    });

    test('updateItemQuantity updates quantity correctly', () {
      final items = [CartItem(product: product1, quantity: 2)];
      final cart = Cart(items: items);
      final updated = cart.updateItemQuantity('prod_1', 5);

      expect(updated.items[0].quantity, 5);
    });

    test('updateItemQuantity removes item if quantity is 0', () {
      final items = [CartItem(product: product1, quantity: 2)];
      final cart = Cart(items: items);
      final updated = cart.updateItemQuantity('prod_1', 0);

      expect(updated.items.length, 0);
    });

    test('clear empties the cart', () {
      final items = [
        CartItem(product: product1, quantity: 2),
        CartItem(product: product2, quantity: 1),
      ];
      final cart = Cart(items: items);
      final cleared = cart.clear();

      expect(cleared.items.length, 0);
      expect(cleared.isEmpty, true);
    });

    test('clear preserves fees', () {
      final items = [CartItem(product: product1, quantity: 1)];
      final cart = Cart(
        items: items,
        deliveryFee: 500.0,
        serviceFee: 50.0,
      );
      final cleared = cart.clear();

      expect(cleared.deliveryFee, 500.0);
      expect(cleared.serviceFee, 50.0);
    });

    test('copyWith creates new instance', () {
      final items = [CartItem(product: product1, quantity: 1)];
      final cart = Cart(items: items, deliveryFee: 500.0);
      final updated = cart.copyWith(deliveryFee: 600.0);

      expect(updated.deliveryFee, 600.0);
      expect(cart.deliveryFee, 500.0); // Original unchanged
    });

    test('equality based on items, fees', () {
      final items = [CartItem(product: product1, quantity: 1)];
      final cart1 = Cart(items: items, deliveryFee: 500.0);
      final cart2 = Cart(items: items, deliveryFee: 500.0);

      expect(cart1, cart2);
    });

    test('toString provides readable output', () {
      final items = [
        CartItem(product: product1, quantity: 2),
        CartItem(product: product2, quantity: 1),
      ];
      final cart = Cart(items: items);
      final result = cart.toString();

      expect(result.contains('itemCount: 3'), true);
      expect(result.contains('subtotal: 400'), true);
    });

    test('handles multiple items calculations', () {
      final items = [
        CartItem(product: product1, quantity: 2), // 100 * 2 = 200
        CartItem(product: product2, quantity: 1), // 200 * 1 = 200
        CartItem(product: product1, quantity: 0), // This shouldn't happen, but test handling
      ].where((item) => item.quantity > 0).toList();

      final cart = Cart(items: items);

      expect(cart.itemCount, 3);
      expect(cart.subtotal, 400.0);
    });
  });
}
