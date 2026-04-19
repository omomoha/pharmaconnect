import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/models/product_model.dart';
import 'package:pharmaconnect/providers/cart_provider.dart';

void main() {
  group('CartProvider', () {
    late CartProvider provider;

    setUp(() {
      provider = CartProvider();
    });

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

    test('initial state is empty cart', () {
      expect(provider.isEmpty, true);
      expect(provider.itemCount, 0);
      expect(provider.subtotal, 0.0);
      expect(provider.total, 0.0);
      expect(provider.pharmacyId, '');
    });

    test('addToCart adds product to empty cart', () {
      provider.addToCart(product1, quantity: 2);

      expect(provider.isEmpty, false);
      expect(provider.itemCount, 2);
      expect(provider.subtotal, 200.0); // 100 * 2
      expect(provider.pharmacyId, 'pharm_1');
    });

    test('addToCart with same pharmacy adds multiple items', () {
      provider.addToCart(product1, quantity: 1);
      provider.addToCart(product2, quantity: 2);

      expect(provider.itemCount, 3); // 1 + 2
      expect(provider.subtotal, 500.0); // 100 + (200 * 2)
      expect(provider.items.length, 2);
    });

    test('addToCart increases quantity if product already in cart', () {
      provider.addToCart(product1, quantity: 2);
      provider.addToCart(product1, quantity: 3);

      expect(provider.itemCount, 5); // 2 + 3
      expect(provider.items.length, 1);
      expect(provider.items[0].quantity, 5);
    });

    test('addToCart sets warning flag for different pharmacy', () {
      provider.addToCart(product1, quantity: 1);
      expect(provider.differentPharmacyWarning, false);

      provider.addToCart(product3, quantity: 1);
      expect(provider.differentPharmacyWarning, true);
    });

    test('addToCart does not add item from different pharmacy without confirmation', () {
      provider.addToCart(product1, quantity: 1);
      final initialCount = provider.itemCount;

      provider.addToCart(product3, quantity: 1);

      expect(provider.itemCount, initialCount); // Item not added
    });

    test('confirmPharmacySwitch clears cart and adds new product', () {
      provider.addToCart(product1, quantity: 2);
      expect(provider.itemCount, 2);

      provider.confirmPharmacySwitch(product3, quantity: 1);

      expect(provider.itemCount, 1);
      expect(provider.pharmacyId, 'pharm_2');
      expect(provider.items[0].product.id, 'prod_3');
      expect(provider.differentPharmacyWarning, false);
    });

    test('removeFromCart removes item', () {
      provider.addToCart(product1, quantity: 2);
      provider.addToCart(product2, quantity: 1);

      provider.removeFromCart('prod_1');

      expect(provider.itemCount, 1);
      expect(provider.items.length, 1);
      expect(provider.items[0].product.id, 'prod_2');
    });

    test('removeFromCart clears pharmacy ID when cart becomes empty', () {
      provider.addToCart(product1, quantity: 1);
      expect(provider.pharmacyId, 'pharm_1');

      provider.removeFromCart('prod_1');

      expect(provider.isEmpty, true);
      expect(provider.pharmacyId, '');
    });

    test('updateQuantity changes item quantity', () {
      provider.addToCart(product1, quantity: 2);

      provider.updateQuantity('prod_1', 5);

      expect(provider.items[0].quantity, 5);
      expect(provider.subtotal, 500.0); // 100 * 5
    });

    test('updateQuantity removes item if quantity is 0', () {
      provider.addToCart(product1, quantity: 2);

      provider.updateQuantity('prod_1', 0);

      expect(provider.isEmpty, true);
    });

    test('updateQuantity removes item if quantity is negative', () {
      provider.addToCart(product1, quantity: 2);

      provider.updateQuantity('prod_1', -1);

      expect(provider.isEmpty, true);
    });

    test('incrementQuantity increases by 1', () {
      provider.addToCart(product1, quantity: 2);

      provider.incrementQuantity('prod_1');

      expect(provider.items[0].quantity, 3);
    });

    test('decrementQuantity decreases by 1', () {
      provider.addToCart(product1, quantity: 3);

      provider.decrementQuantity('prod_1');

      expect(provider.items[0].quantity, 2);
    });

    test('decrementQuantity removes item if quantity reaches 0', () {
      provider.addToCart(product1, quantity: 1);

      provider.decrementQuantity('prod_1');

      expect(provider.isEmpty, true);
    });

    test('clearCart empties all items', () {
      provider.addToCart(product1, quantity: 2);
      provider.addToCart(product2, quantity: 1);

      provider.clearCart();

      expect(provider.isEmpty, true);
      expect(provider.itemCount, 0);
      expect(provider.pharmacyId, '');
    });

    test('clearCart clears warning flag', () {
      provider.addToCart(product1, quantity: 1);
      provider.addToCart(product3, quantity: 1); // Sets warning
      expect(provider.differentPharmacyWarning, true);

      provider.clearCart();

      expect(provider.differentPharmacyWarning, false);
    });

    test('cart total includes delivery and service fees', () {
      provider.addToCart(product1, quantity: 1);
      final cart = provider.cart.copyWith(
        deliveryFee: 500.0,
        serviceFee: 50.0,
      );

      expect(cart.total, 650.0); // 100 + 500 + 50
    });

    test('setCheckoutError sets error message', () {
      expect(provider.checkoutError, '');

      provider.setCheckoutError('Cart is empty');

      expect(provider.checkoutError, 'Cart is empty');
    });

    test('addToCart clears checkout error', () {
      provider.setCheckoutError('Some error');
      expect(provider.checkoutError, 'Some error');

      provider.addToCart(product1, quantity: 1);

      expect(provider.checkoutError, '');
    });

    test('updateQuantity clears checkout error', () {
      provider.addToCart(product1, quantity: 2);
      provider.setCheckoutError('Some error');

      provider.updateQuantity('prod_1', 3);

      expect(provider.checkoutError, '');
    });

    test('resetDifferentPharmacyWarning clears warning', () {
      provider.addToCart(product1, quantity: 1);
      provider.addToCart(product3, quantity: 1);
      expect(provider.differentPharmacyWarning, true);

      provider.resetDifferentPharmacyWarning();

      expect(provider.differentPharmacyWarning, false);
    });

    test('canCheckout is true for valid cart', () {
      provider.addToCart(product1, quantity: 1);

      expect(provider.canCheckout, true);
    });

    test('canCheckout is false for empty cart', () {
      expect(provider.canCheckout, false);
    });

    test('canCheckout is false when checkout error is set', () {
      provider.addToCart(product1, quantity: 1);
      provider.setCheckoutError('Payment failed');

      expect(provider.canCheckout, false);
    });

    test('subtotal calculates correctly', () {
      provider.addToCart(product1, quantity: 2); // 200
      provider.addToCart(product2, quantity: 3); // 600

      expect(provider.subtotal, 800.0);
    });

    test('total equals subtotal without fees', () {
      provider.addToCart(product1, quantity: 1);

      expect(provider.total, provider.subtotal);
    });

    test('items getter returns cart items list', () {
      provider.addToCart(product1, quantity: 1);
      provider.addToCart(product2, quantity: 1);

      expect(provider.items.length, 2);
      expect(provider.items[0].product.id, 'prod_1');
      expect(provider.items[1].product.id, 'prod_2');
    });

    test('isNotEmpty is opposite of isEmpty', () {
      expect(provider.isNotEmpty, false);

      provider.addToCart(product1, quantity: 1);

      expect(provider.isNotEmpty, true);
      expect(provider.isEmpty, false);
    });

    test('cart getter returns complete Cart object', () {
      provider.addToCart(product1, quantity: 2);

      final cart = provider.cart;

      expect(cart.items.length, 1);
      expect(cart.itemCount, 2);
      expect(cart.subtotal, 200.0);
    });

    test('multiple add operations with notifications', () {
      int notifyCount = 0;
      provider.addListener(() {
        notifyCount++;
      });

      provider.addToCart(product1, quantity: 1);
      expect(notifyCount, greaterThan(0));

      final beforeCount = notifyCount;
      provider.addToCart(product1, quantity: 1);
      expect(notifyCount, greaterThan(beforeCount));
    });

    test('complex scenario: add, increment, decrease, remove', () {
      provider.addToCart(product1, quantity: 1);
      expect(provider.itemCount, 1);

      provider.incrementQuantity('prod_1');
      expect(provider.itemCount, 2);

      provider.decrementQuantity('prod_1');
      expect(provider.itemCount, 1);

      provider.removeFromCart('prod_1');
      expect(provider.isEmpty, true);
    });
  });
}
