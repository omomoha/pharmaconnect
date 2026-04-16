import 'product_model.dart';

class CartItem {
  final ProductModel product;
  final int quantity;

  CartItem({
    required this.product,
    required this.quantity,
  });

  double get itemSubtotal => product.price * quantity;

  CartItem copyWith({
    ProductModel? product,
    int? quantity,
  }) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CartItem &&
          runtimeType == other.runtimeType &&
          product.id == other.product.id;

  @override
  int get hashCode => product.id.hashCode;

  @override
  String toString() => 'CartItem(productId: ${product.id}, quantity: $quantity)';
}

class Cart {
  final List<CartItem> items;
  final double? deliveryFee;
  final double? serviceFee;

  Cart({
    required this.items,
    this.deliveryFee,
    this.serviceFee,
  });

  double get subtotal {
    return items.fold(0.0, (sum, item) => sum + item.itemSubtotal);
  }

  double get total {
    double amount = subtotal;
    if (deliveryFee != null) amount += deliveryFee!;
    if (serviceFee != null) amount += serviceFee!;
    return amount;
  }

  int get itemCount {
    return items.fold(0, (sum, item) => sum + item.quantity);
  }

  bool get isEmpty => items.isEmpty;

  bool get isNotEmpty => items.isNotEmpty;

  String? get pharmacyId {
    if (items.isEmpty) return null;
    final firstPharmacyId = items.first.product.pharmacyId;
    final allSamePharmacy = items.every(
      (item) => item.product.pharmacyId == firstPharmacyId,
    );
    return allSamePharmacy ? firstPharmacyId : null;
  }

  bool canCheckout() {
    if (isEmpty) return false;
    // Ensure all items are from the same pharmacy
    if (pharmacyId == null) return false;
    // Ensure all items are in stock
    return items.every((item) => item.product.inStock);
  }

  String? getCheckoutError() {
    if (isEmpty) return 'Cart is empty';
    if (pharmacyId == null) return 'Items must be from the same pharmacy';
    for (final item in items) {
      if (!item.product.inStock) {
        return '${item.product.name} is out of stock';
      }
    }
    return null;
  }

  Cart addItem(CartItem item) {
    final existingIndex = items.indexWhere(
      (cartItem) => cartItem.product.id == item.product.id,
    );

    final newItems = List<CartItem>.from(items);
    if (existingIndex != -1) {
      newItems[existingIndex] = newItems[existingIndex].copyWith(
        quantity: newItems[existingIndex].quantity + item.quantity,
      );
    } else {
      newItems.add(item);
    }

    return Cart(
      items: newItems,
      deliveryFee: deliveryFee,
      serviceFee: serviceFee,
    );
  }

  Cart removeItem(String productId) {
    return Cart(
      items: items.where((item) => item.product.id != productId).toList(),
      deliveryFee: deliveryFee,
      serviceFee: serviceFee,
    );
  }

  Cart updateItemQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      return removeItem(productId);
    }

    final newItems = items.map((item) {
      if (item.product.id == productId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();

    return Cart(
      items: newItems,
      deliveryFee: deliveryFee,
      serviceFee: serviceFee,
    );
  }

  Cart clear() {
    return Cart(
      items: [],
      deliveryFee: deliveryFee,
      serviceFee: serviceFee,
    );
  }

  Cart copyWith({
    List<CartItem>? items,
    double? deliveryFee,
    double? serviceFee,
  }) {
    return Cart(
      items: items ?? this.items,
      deliveryFee: deliveryFee ?? this.deliveryFee,
      serviceFee: serviceFee ?? this.serviceFee,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Cart &&
          runtimeType == other.runtimeType &&
          items == other.items &&
          deliveryFee == other.deliveryFee &&
          serviceFee == other.serviceFee;

  @override
  int get hashCode =>
      items.hashCode ^ (deliveryFee?.hashCode ?? 0) ^ (serviceFee?.hashCode ?? 0);

  @override
  String toString() {
    return 'Cart(itemCount: $itemCount, subtotal: $subtotal, total: $total, '
        'pharmacyId: $pharmacyId)';
  }
}
