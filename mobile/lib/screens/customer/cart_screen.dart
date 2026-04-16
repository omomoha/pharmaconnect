import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/providers/cart_provider.dart';
import 'package:pharmaconnect/models/cart_model.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({Key? key}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    // Listen for different pharmacy warnings
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cartProvider = context.read<CartProvider>();
      if (cartProvider.differentPharmacyWarning) {
        _showPharmacySwitchDialog();
      }
    });
  }

  void _showPharmacySwitchDialog() {
    final cartProvider = context.read<CartProvider>();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Switch Pharmacy?'),
        content: const Text(
          'Your cart contains items from a different pharmacy. '
          'Would you like to clear your cart and add this item instead?',
        ),
        actions: [
          TextButton(
            onPressed: () {
              cartProvider.resetDifferentPharmacyWarning();
              Navigator.pop(context);
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              cartProvider.resetDifferentPharmacyWarning();
              Navigator.pop(context);
            },
            child: const Text('Switch'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (cartProvider.isEmpty) {
            return _buildEmptyState(context);
          }
          return _buildCartContent(context, cartProvider);
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Cart'),
              if (cartProvider.isNotEmpty)
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.primary600,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  child: Text(
                    '${cartProvider.itemCount}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.neutralWhite,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
            ],
          );
        },
      ),
      actions: [
        Consumer<CartProvider>(
          builder: (context, cartProvider, _) {
            if (cartProvider.isEmpty) {
              return const SizedBox.shrink();
            }
            return IconButton(
              icon: const Icon(Icons.delete_outline),
              color: AppColors.error,
              onPressed: () {
                _showClearCartDialog(context);
              },
              tooltip: 'Clear cart',
            );
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            decoration: BoxDecoration(
              color: AppColors.primary50,
              borderRadius: BorderRadius.circular(16),
            ),
            padding: const EdgeInsets.all(20),
            child: Icon(
              Icons.shopping_bag_outlined,
              size: 48,
              color: AppColors.primary600,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Your cart is empty',
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontSize: 20,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Browse pharmacies and add items to get started',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutral600,
                ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => context.go('/customer/browse-pharmacies'),
            child: const Text('Browse Pharmacies'),
          ),
        ],
      ),
    );
  }

  Widget _buildCartContent(
    BuildContext context,
    CartProvider cartProvider,
  ) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pharmacy header
                  if (cartProvider.items.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'From Pharmacy',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                              color: AppColors.neutral600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            cartProvider.items.first.product.pharmacyName,
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                        ],
                      ),
                    ),
                  // Cart items list
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: cartProvider.items.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final cartItem = cartProvider.items[index];
                      return _buildCartItemCard(
                        context,
                        cartItem,
                        cartProvider,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
        // Sticky bottom section
        _buildCheckoutSection(context, cartProvider),
      ],
    );
  }

  Widget _buildCartItemCard(
    BuildContext context,
    CartItem cartItem,
    CartProvider cartProvider,
  ) {
    final product = cartItem.product;
    final subtotal = cartItem.itemSubtotal;

    return Dismissible(
      key: Key(product.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(
          Icons.delete_outline,
          color: AppColors.neutralWhite,
        ),
      ),
      onDismissed: (direction) {
        cartProvider.removeFromCart(product.id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${product.name} removed from cart'),
            duration: const Duration(seconds: 2),
            backgroundColor: AppColors.neutral900,
          ),
        );
      },
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product image placeholder
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Icon(
                        Icons.local_pharmacy_outlined,
                        size: 32,
                        color: AppColors.primary600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Product details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: Theme.of(context).textTheme.titleLarge,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          product.pharmacyName,
                          style: Theme.of(context).textTheme.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '₦${product.price.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                            color: AppColors.neutral600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Subtotal
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Text(
                        '₦${subtotal.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Quantity controls
              Align(
                alignment: Alignment.bottomRight,
                child: _buildQuantityControls(
                  context,
                  product.id,
                  cartItem.quantity,
                  cartProvider,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuantityControls(
    BuildContext context,
    String productId,
    int quantity,
    CartProvider cartProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.neutral100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.neutral300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            iconSize: 16,
            padding: const EdgeInsets.all(4),
            icon: const Icon(Icons.remove),
            onPressed: () {
              cartProvider.decrementQuantity(productId);
            },
            color: AppColors.neutral700,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              '$quantity',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          IconButton(
            iconSize: 16,
            padding: const EdgeInsets.all(4),
            icon: const Icon(Icons.add),
            onPressed: () {
              cartProvider.incrementQuantity(productId);
            },
            color: AppColors.primary600,
          ),
        ],
      ),
    );
  }

  Widget _buildCheckoutSection(
    BuildContext context,
    CartProvider cartProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.neutralWhite,
        border: Border(
          top: BorderSide(color: AppColors.neutral200),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        16 + MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Subtotal row
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Subtotal',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                Text(
                  '₦${cartProvider.subtotal.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ],
            ),
          ),
          // Delivery fee row
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Delivery Fee',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                Text(
                  cartProvider.cart.deliveryFee != null
                      ? '₦${cartProvider.cart.deliveryFee!.toStringAsFixed(2)}'
                      : 'Calculated at checkout',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: cartProvider.cart.deliveryFee != null
                            ? AppColors.neutral900
                            : AppColors.neutral600,
                        fontWeight: cartProvider.cart.deliveryFee != null
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                ),
              ],
            ),
          ),
          // Service fee row
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Service Fee',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                Text(
                  cartProvider.cart.serviceFee != null
                      ? '₦${cartProvider.cart.serviceFee!.toStringAsFixed(2)}'
                      : 'Calculated at checkout',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: cartProvider.cart.serviceFee != null
                            ? AppColors.neutral900
                            : AppColors.neutral600,
                        fontWeight: cartProvider.cart.serviceFee != null
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                ),
              ],
            ),
          ),
          const Divider(
            color: AppColors.neutral300,
            height: 16,
            thickness: 1,
          ),
          // Total row
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                Text(
                  '₦${cartProvider.cart.total.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary600,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Error message (if any)
          if (cartProvider.checkoutError.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.errorLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.error),
                ),
                child: Text(
                  cartProvider.checkoutError,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.error,
                      ),
                ),
              ),
            ),
          // Checkout button
          ElevatedButton(
            onPressed: cartProvider.canCheckout
                ? () {
                    context.go('/customer/checkout');
                  }
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: cartProvider.canCheckout
                  ? AppColors.primary600
                  : AppColors.neutral300,
              foregroundColor: cartProvider.canCheckout
                  ? AppColors.neutralWhite
                  : AppColors.neutral600,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Proceed to Checkout',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: cartProvider.canCheckout
                        ? AppColors.neutralWhite
                        : AppColors.neutral600,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  void _showClearCartDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cart?'),
        content: const Text(
          'Are you sure you want to remove all items from your cart? '
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<CartProvider>().clearCart();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Cart cleared'),
                  duration: Duration(seconds: 2),
                  backgroundColor: AppColors.neutral900,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}
