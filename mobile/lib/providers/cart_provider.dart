import 'package:flutter/foundation.dart';
import 'package:pharmaconnect/models/cart_model.dart';
import 'package:pharmaconnect/models/product_model.dart';

class CartProvider extends ChangeNotifier {
  Cart _cart = Cart(items: [], pharmacyId: '');
  String _checkoutError = '';
  bool _differentPharmacyWarning = false;

  // Getters
  Cart get cart => _cart;
  List<CartItem> get items => _cart.items;
  int get itemCount => _cart.items.length;
  String get pharmacyId => _cart.pharmacyId;
  bool get isEmpty => _cart.items.isEmpty;
  bool get isNotEmpty => _cart.items.isNotEmpty;
  String get checkoutError => _checkoutError;
  bool get differentPharmacyWarning => _differentPharmacyWarning;

  /// Calculate subtotal (sum of all items' price × quantity)
  double get subtotal {
    return _cart.items.fold<double>(0.0, (sum, item) {
      return sum + (item.product.price * item.quantity);
    });
  }

  /// Calculate total (for now, same as subtotal; can add delivery/tax later)
  double get total => subtotal;

  /// Check if cart can proceed to checkout (not empty and no errors)
  bool get canCheckout => isNotEmpty && _checkoutError.isEmpty;

  /// Add a product to cart
  /// If product is from a different pharmacy, set warning flag
  void addToCart(
    ProductModel product, {
    int quantity = 1,
  }) {
    _clearCheckoutError();

    // Check if cart already has items from a different pharmacy
    if (_cart.pharmacyId.isNotEmpty &&
        _cart.pharmacyId != product.pharmacyId) {
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
      _cart.items[existingIndex] = updatedItem;
    } else {
      // Add new item
      final cartItem = CartItem(
        product: product,
        quantity: quantity,
      );
      _cart.items.add(cartItem);
      _cart.pharmacyId = product.pharmacyId;
    }

    notifyListeners();
  }

  /// Remove a product from cart by productId
  void removeFromCart(String productId) {
    _cart.items.removeWhere((item) => item.product.id == productId);

    // If cart is empty, clear pharmacy ID
    if (_cart.items.isEmpty) {
      _cart.pharmacyId = '';
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

    final itemIndex =
        _cart.items.indexWhere((item) => item.product.id == productId);

    if (itemIndex >= 0) {
      _cart.items[itemIndex] = _cart.items[itemIndex].copyWith(
        quantity: quantity,
      );
      notifyListeners();
    }
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
    _cart = Cart(items: [], pharmacyId: '');
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
    _cart = Cart(items: [], pharmacyId: product.pharmacyId);
    _differentPharmacyWarning = false;
    _clearCheckoutError();

    final cartItem = CartItem(
      product: product,
      quantity: quantity,
    );
    _cart.items.add(cartItem);

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
