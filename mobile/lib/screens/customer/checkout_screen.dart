import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/providers/cart_provider.dart';
import 'package:pharmaconnect/models/cart_model.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/services/order_service.dart';
import 'package:pharmaconnect/services/api_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({Key? key}) : super(key: key);

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _streetAddressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _instructionsController;

  int _selectedDeliveryProvider = 0;
  String _selectedPaymentMethod = 'card';
  bool _isPlacing = false;

  final List<Map<String, dynamic>> _deliveryProviders = [
    {
      'name': 'Express Delivery',
      'time': '30-45 min',
      'price': 1500,
      'icon': Icons.flash_on,
    },
    {
      'name': 'Standard Delivery',
      'time': '1-2 hours',
      'price': 800,
      'icon': Icons.local_shipping,
    },
    {
      'name': 'Economy Delivery',
      'time': '2-4 hours',
      'price': 500,
      'icon': Icons.directions_car,
    },
  ];

  final List<Map<String, dynamic>> _paymentMethods = [
    {
      'id': 'card',
      'label': 'Pay with Card',
      'icon': Icons.credit_card,
    },
    {
      'id': 'bank',
      'label': 'Bank Transfer',
      'icon': Icons.account_balance,
    },
    {
      'id': 'delivery',
      'label': 'Pay on Delivery',
      'icon': Icons.local_shipping,
    },
  ];

  @override
  void initState() {
    super.initState();
    _streetAddressController = TextEditingController();
    _cityController = TextEditingController();
    _stateController = TextEditingController();
    _instructionsController = TextEditingController();

    // Check if cart is empty and navigate back if so
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cart = context.read<CartProvider>();
      if (cart.items.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Your cart is empty'),
            duration: Duration(seconds: 2),
          ),
        );
        context.pop();
      }
    });
  }

  @override
  void dispose() {
    _streetAddressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _instructionsController.dispose();
    super.dispose();
  }

  double _calculateSubtotal(List<CartItem> items) {
    return items.fold<double>(0, (sum, item) {
      return sum + (item.product.price * item.quantity);
    });
  }

  double _calculateDeliveryFee() {
    return _deliveryProviders[_selectedDeliveryProvider]['price'].toDouble();
  }

  double _calculateServiceFee() {
    return 200.0;
  }

  double _calculateTotal(double subtotal) {
    return subtotal + _calculateDeliveryFee() + _calculateServiceFee();
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isPlacing = true;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final cartProvider = context.read<CartProvider>();
      final apiService = context.read<ApiService>();
      final orderService = OrderService(apiService: apiService);

      final subtotal = _calculateSubtotal(cartProvider.items);
      final deliveryFee = _calculateDeliveryFee();
      final serviceFee = _calculateServiceFee();
      final total = _calculateTotal(subtotal);

      // Create order payload
      final orderData = {
        'customerId': authProvider.user?.id ?? '',
        'customerEmail': authProvider.user?.email ?? '',
        'items': cartProvider.items
            .map((item) => {
                  'productId': item.product.id,
                  'productName': item.product.name,
                  'quantity': item.quantity,
                  'price': item.product.price,
                  'subtotal': item.product.price * item.quantity,
                })
            .toList(),
        'deliveryAddress': {
          'street': _streetAddressController.text,
          'city': _cityController.text,
          'state': _stateController.text,
          'instructions': _instructionsController.text,
        },
        'deliveryProvider': {
          'name': _deliveryProviders[_selectedDeliveryProvider]['name'],
          'estimatedTime':
              _deliveryProviders[_selectedDeliveryProvider]['time'],
          'fee': deliveryFee,
        },
        'paymentMethod': _selectedPaymentMethod,
        'subtotal': subtotal,
        'deliveryFee': deliveryFee,
        'serviceFee': serviceFee,
        'total': total,
      };

      // Place order via API
      await orderService.createOrder(
        items: cartProvider.items.map((item) => {
          'productId': item.product.id,
          'quantity': item.quantity,
        }).toList(),
        pharmacyId: cartProvider.pharmacyId,
        deliveryAddress: '${_streetAddressController.text}, ${_cityController.text}, ${_stateController.text}',
        paymentMethod: _selectedPaymentMethod,
        specialInstructions: _instructionsController.text.isNotEmpty ? _instructionsController.text : null,
      );

      // Clear cart
      if (mounted) {
        context.read<CartProvider>().clearCart();
      }

      // Navigate to orders page and show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order placed successfully!'),
            duration: Duration(seconds: 3),
            backgroundColor: AppColors.success,
          ),
        );
        context.go('/customer/orders');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error placing order: $e'),
            duration: const Duration(seconds: 4),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPlacing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      appBar: AppBar(
        backgroundColor: AppColors.neutralWhite,
        elevation: 0,
        title: const Text(
          'Checkout',
          style: TextStyle(
            color: AppColors.neutral900,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (cartProvider.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_cart_outlined,
                      size: 64, color: AppColors.neutral200),
                  const SizedBox(height: 16),
                  const Text(
                    'Your cart is empty',
                    style: TextStyle(
                      color: AppColors.neutral600,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            );
          }

          final subtotal = _calculateSubtotal(cartProvider.items);
          final deliveryFee = _calculateDeliveryFee();
          final serviceFee = _calculateServiceFee();
          final total = _calculateTotal(subtotal);

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Delivery Address Section
                  _buildSectionHeader('1', 'Delivery Address'),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _streetAddressController,
                    decoration: _buildInputDecoration('Street Address'),
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'Street address is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _cityController,
                          decoration: _buildInputDecoration('City'),
                          validator: (value) {
                            if (value?.isEmpty ?? true) {
                              return 'City is required';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _stateController,
                          decoration: _buildInputDecoration('State'),
                          validator: (value) {
                            if (value?.isEmpty ?? true) {
                              return 'State is required';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _instructionsController,
                    decoration: _buildInputDecoration(
                      'Additional Instructions (Optional)',
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 32),

                  // 2. Delivery Provider Section
                  _buildSectionHeader('2', 'Delivery Provider'),
                  const SizedBox(height: 16),
                  ..._deliveryProviders.asMap().entries.map((entry) {
                    final index = entry.key;
                    final provider = entry.value;
                    final isSelected = _selectedDeliveryProvider == index;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedDeliveryProvider = index;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.primary600
                                  : AppColors.neutral200,
                              width: isSelected ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            color: isSelected
                                ? AppColors.primary600.withOpacity(0.05)
                                : AppColors.neutralWhite,
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.neutral100,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  provider['icon'],
                                  color: AppColors.primary600,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      provider['name'],
                                      style: const TextStyle(
                                        color: AppColors.neutral900,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      provider['time'],
                                      style: const TextStyle(
                                        color: AppColors.neutral600,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '₦${provider['price']}',
                                style: const TextStyle(
                                  color: AppColors.neutral900,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary600
                                        : AppColors.neutral300,
                                    width: 2,
                                  ),
                                ),
                                child: isSelected
                                    ? Center(
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: const BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: AppColors.primary600,
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                  const SizedBox(height: 32),

                  // 3. Payment Method Section
                  _buildSectionHeader('3', 'Payment Method'),
                  const SizedBox(height: 16),
                  ..._paymentMethods.map((method) {
                    final isSelected = _selectedPaymentMethod == method['id'];

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedPaymentMethod = method['id'];
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: isSelected
                                  ? AppColors.primary600
                                  : AppColors.neutral200,
                              width: isSelected ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            color: isSelected
                                ? AppColors.primary600.withOpacity(0.05)
                                : AppColors.neutralWhite,
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.neutral100,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  method['icon'],
                                  color: AppColors.primary600,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Text(
                                  method['label'],
                                  style: const TextStyle(
                                    color: AppColors.neutral900,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary600
                                        : AppColors.neutral300,
                                    width: 2,
                                  ),
                                ),
                                child: isSelected
                                    ? Center(
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: const BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: AppColors.primary600,
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                  const SizedBox(height: 32),

                  // 4. Order Summary Section
                  _buildSectionHeader('', 'Order Summary'),
                  const SizedBox(height: 16),
                  ...cartProvider.items.map((item) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${item.product.name} × ${item.quantity}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.neutral700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          Text(
                            '₦${(item.product.price * item.quantity).toStringAsFixed(0)}',
                            style: const TextStyle(
                              color: AppColors.neutral900,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  const SizedBox(height: 12),
                  Divider(
                    height: 24,
                    color: AppColors.neutral200,
                    thickness: 1,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Subtotal',
                        style: TextStyle(
                          color: AppColors.neutral600,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '₦${subtotal.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: AppColors.neutral900,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Delivery Fee',
                        style: TextStyle(
                          color: AppColors.neutral600,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '₦${deliveryFee.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: AppColors.neutral900,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Service Fee',
                        style: TextStyle(
                          color: AppColors.neutral600,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '₦${serviceFee.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: AppColors.neutral900,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Divider(
                    height: 24,
                    color: AppColors.neutral200,
                    thickness: 1,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total',
                        style: TextStyle(
                          color: AppColors.neutral900,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '₦${total.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: AppColors.neutral900,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Place Order Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isPlacing ? null : _placeOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary600,
                        disabledBackgroundColor:
                            AppColors.primary600.withOpacity(0.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: _isPlacing
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  AppColors.neutralWhite,
                                ),
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              'Place Order — ₦${total.toStringAsFixed(0)}',
                              style: const TextStyle(
                                color: AppColors.neutralWhite,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String number, String title) {
    return Row(
      children: [
        if (number.isNotEmpty)
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary600,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  color: AppColors.neutralWhite,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        if (number.isNotEmpty) const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            color: AppColors.neutral900,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  InputDecoration _buildInputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(
        color: AppColors.neutral600,
        fontSize: 14,
      ),
      hintStyle: const TextStyle(
        color: AppColors.neutral500,
        fontSize: 14,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.neutral200),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.neutral200),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: AppColors.primary600,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(
          color: AppColors.error,
          width: 2,
        ),
      ),
    );
  }
}
