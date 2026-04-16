import 'package:flutter/foundation.dart';
import 'package:pharmaconnect/models/cart_model.dart';
import 'package:pharmaconnect/models/product_model.dart';

class CartProvider extends ChangeNotifier {
  Cart _cart = Cart(items: []);
  String _pharmacyId = '';
  String _checkoutError = '';
  bool _differentPharmacyWarning = false;

  // Getters
  Cart get cart => _cart;
  List<CartItem> get items => _cart.items;
  int get itemCount => _cart.itemCount;
  String get pharmacyId => _pharmacyId;
  bool get isEmpty => _cart.isEmpty;
  bool get isNotEmpty => _cart.isNotEmpty;
  String get checkoutError => _checkoutError;
  bool get differentPharmacyWarning => _differentPharmacyWarning;

  /// Calculate subtotal (delegated to Cart model)
  double get subtotal => _cart.subtotal;

  /// Calculate total (delegated to Cart model)
  double get total => _cart.total;

  /// Check if cart can proceed to checkout (delegated to Cart model)
  bool get canCheckout => _cart.canCheckout() && _checkoutError.isEmpty;

  /// Add a product to cart
  /// If product is from a different pharmacy, set warning flag
  void addToCart(
    ProductModel product, {
    int quantity = 1,
  }) {
    _clearCheckoutError();

    // Check if cart already has items from a different pharmacy
    if (_pharmacyId.isNotEmpty && _pharmacyId != product.pharmacyId) {
      _differentPharmacyWarning = true;
      notifyListeners();
      return;
    }

    // Check if product already in cart
    final existingIndex =
        _cart.items.indexWhere((item) => item.product.id == product.id);

    if (existingIndex >= 0) {
      // Update existing item quantity
      final updatedItem = _cart.items[existingIndex].copyWith(
        quantity: _cart.items[existingIndex].quantity + quantity,
      );
      // Remove old item and add updated one
      _cart = _cart.removeItem(product.id);
      _cart = _cart.addItem(updatedItem);
    } else {
      // Add new item
      final cartItem = CartItem(
        product: product,
        quantity: quantity,
      );
      _cart = _cart.addItem(cartItem);
      // Track the pharmacy ID
      _pharmacyId = product.pharmacyId;
    }

    notifyListeners();
  }

  /// Remove a product from cart by productId
  void removeFromCart(String productId) {
    _cart = _cart.removeItem(productId);

    // If cart is empty, clear pharmacy ID
    if (_cart.isEmpty) {
      _pharmacyId = '';
    }

    notifyListeners();
  }

  /// Update quantity of a product
  /// If quantity is 0 or less, remove the item
  void updateQuantity(String productId, int quantity) {
    _clearCheckoutError();

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    _cart = _cart.updateItemQuantity(productId, quantity);
    notifyListeners();
  }

  /// Increment quantity by 1
  void incrementQuantity(String productId) {
    final itemIndex =
        _cart.items.indexWhere((item) => item.product.id == productId);

    if (itemIndex >= 0) {
      updateQuantity(productId, _cart.items[itemIndex].quantity + 1);
    }
  }

  /// Decrement quantity by 1
  /// If quantity reaches 0, remove item
  void decrementQuantity(String productId) {
    final itemIndex =
        _cart.items.indexWhere((item) => item.product.id == productId);

    if (itemIndex >= 0) {
      updateQuantity(productId, _cart.items[itemIndex].quantity - 1);
    }
  }

  /// Clear the entire cart
  void clearCart() {
    _cart = Cart(items: []);
    _pharmacyId = '';
    _clearCheckoutError();
    _differentPharmacyWarning = false;
    notifyListeners();
  }

  /// Confirm switching to a different pharmacy
  /// Clears the current cart and adds the new product
  void confirmPharmacySwitch(
    ProductModel product, {
    int quantity = 1,
  }) {
    _cart = Cart(items: []);
    _pharmacyId = product.pharmacyId;
    _differentPharmacyWarning = false;
    _clearCheckoutError();

    final cartItem = CartItem(
      product: product,
      quantity: quantity,
    );
    _cart = _cart.addItem(cartItem);

    notifyListeners();
  }

  /// Set checkout error
  void setCheckoutError(String error) {
    _checkoutError = error;
    notifyListeners();
  }

  /// Clear checkout error
  void _clearCheckoutError() {
    _checkoutError = '';
  }

  /// Reset different pharmacy warning flag
  void resetDifferentPharmacyWarning() {
    _differentPharmacyWarning = false;
    notifyListeners();
  }
}
