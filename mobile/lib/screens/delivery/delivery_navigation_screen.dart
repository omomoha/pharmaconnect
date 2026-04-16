import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class DeliveryNavigationScreen extends StatefulWidget {
  final String orderId;

  const DeliveryNavigationScreen({
    Key? key,
    required this.orderId,
  }) : super(key: key);

  @override
  State<DeliveryNavigationScreen> createState() =>
      _DeliveryNavigationScreenState();
}

enum NavigationPhase { toPharmacy, toCustomer }

class _DeliveryNavigationScreenState extends State<DeliveryNavigationScreen> {
  late NavigationPhase _currentPhase;
  bool _isLoading = false;
  bool _isItemsExpanded = false;

  // Mock order data
  late Map<String, dynamic> _orderData;

  @override
  void initState() {
    super.initState();
    _currentPhase = NavigationPhase.toPharmacy;
    _initializeMockData();
  }

  void _initializeMockData() {
    _orderData = {
      'id': widget.orderId,
      'pharmacyName': 'MediCare Pharmacy',
      'pharmacyAddress': '123 Main Street, Lekki, Lagos, Nigeria',
      'pharmacyDistance': '2.5 km',
      'pharmacyTime': '8 mins',
      'customerName': 'John Doe',
      'customerAddress': '456 Sunset Avenue, Ikoyi, Lagos, Nigeria',
      'customerDistance': '5.2 km',
      'customerTime': '15 mins',
      'items': [
        {
          'name': 'Paracetamol 500mg',
          'quantity': 2,
          'price': 500.0,
        },
        {
          'name': 'Vitamin C Tablets',
          'quantity': 1,
          'price': 800.0,
        },
        {
          'name': 'Cough Syrup',
          'quantity': 1,
          'price': 1200.0,
        },
      ],
      'subtotal': 3300.0,
      'deliveryFee': 500.0,
      'serviceFee': 200.0,
      'total': 4000.0,
    };
  }

  void _handleArrivedAtPharmacy() async {
    setState(() => _isLoading = true);

    try {
      // Simulate API call
      await Future.delayed(const Duration(milliseconds: 800));

      setState(() {
        _currentPhase = NavigationPhase.toCustomer;
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Pickup confirmed. Heading to customer.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _handleArrivedAtCustomer() async {
    setState(() => _isLoading = true);

    try {
      // Simulate API call
      await Future.delayed(const Duration(milliseconds: 800));

      if (mounted) {
        setState(() => _isLoading = false);
        context.push('/delivery/verify-code/${widget.orderId}');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _handleCall() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _currentPhase == NavigationPhase.toPharmacy
              ? 'Calling ${_orderData['pharmacyName']}...'
              : 'Calling ${_orderData['customerName']}...',
        ),
      ),
    );
  }

  void _handleMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _currentPhase == NavigationPhase.toPharmacy
              ? 'Opening chat with ${_orderData['pharmacyName']}...'
              : 'Opening chat with ${_orderData['customerName']}...',
        ),
      ),
    );
  }

  String _getPhaseLabel() {
    switch (_currentPhase) {
      case NavigationPhase.toPharmacy:
        return 'Heading to Pharmacy';
      case NavigationPhase.toCustomer:
        return 'Heading to Customer';
    }
  }

  String _getTargetName() {
    switch (_currentPhase) {
      case NavigationPhase.toPharmacy:
        return _orderData['pharmacyName'];
      case NavigationPhase.toCustomer:
        return _orderData['customerName'];
    }
  }

  String _getTargetAddress() {
    switch (_currentPhase) {
      case NavigationPhase.toPharmacy:
        return _orderData['pharmacyAddress'];
      case NavigationPhase.toCustomer:
        return _orderData['customerAddress'];
    }
  }

  String _getEstimatedDistance() {
    switch (_currentPhase) {
      case NavigationPhase.toPharmacy:
        return _orderData['pharmacyDistance'];
      case NavigationPhase.toCustomer:
        return _orderData['customerDistance'];
    }
  }

  String _getEstimatedTime() {
    switch (_currentPhase) {
      case NavigationPhase.toPharmacy:
        return _orderData['pharmacyTime'];
      case NavigationPhase.toCustomer:
        return _orderData['customerTime'];
    }
  }

  String _getMainActionLabel() {
    switch (_currentPhase) {
      case NavigationPhase.toPharmacy:
        return 'Arrived at Pharmacy';
      case NavigationPhase.toCustomer:
        return 'Arrived at Customer';
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        context.go('/dashboard/delivery');
        return false;
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Delivery Navigation'),
          elevation: 0,
          backgroundColor: AppColors.neutralWhite,
          foregroundColor: AppColors.neutral900,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go('/dashboard/delivery'),
          ),
        ),
        body: Stack(
          children: [
            SingleChildScrollView(
              child: Column(
                children: [
                  // Map Placeholder
                  _buildMapPlaceholder(),
                  const SizedBox(height: UIConstants.paddingMedium),

                  // Info Card
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                    ),
                    child: _buildInfoCard(),
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),

                  // Step Progress Indicator
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                    ),
                    child: _buildStepProgress(),
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),

                  // Order Details Expandable
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                    ),
                    child: _buildOrderDetailsSection(),
                  ),
                  const SizedBox(height: 120),
                ],
              ),
            ),

            // Bottom Action Sheet
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _buildBottomActionSheet(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMapPlaceholder() {
    return Container(
      height: 300,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary600.withOpacity(0.8),
            AppColors.secondary600.withOpacity(0.8),
          ],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.location_on,
            size: 64,
            color: AppColors.neutralWhite,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          Text(
            'Map View',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.neutralWhite,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          Text(
            'Google Maps integration coming soon',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutralWhite.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return PharmaCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Phase Label & Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _getPhaseLabel(),
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.secondary600,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              StatusBadge.active(
                label: _currentPhase == NavigationPhase.toPharmacy
                    ? 'Pickup'
                    : 'Delivery',
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Target Name
          Text(
            _getTargetName(),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.neutral900,
                ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),

          // Address
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.location_on_outlined,
                size: UIConstants.iconSizeMedium,
                color: AppColors.primary600,
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Expanded(
                child: Text(
                  _getTargetAddress(),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.neutral600,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Distance & Time Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Distance',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingXSmall),
                    Text(
                      _getEstimatedDistance(),
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.neutral900,
                              ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Est. Time',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingXSmall),
                    Text(
                      _getEstimatedTime(),
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.neutral900,
                              ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepProgress() {
    return PharmaCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Delivery Progress',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.neutral900,
                ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildProgressStep(
                  'Heading to\nPharmacy',
                  _currentPhase == NavigationPhase.toPharmacy,
                  true,
                ),
                _buildProgressConnector(),
                _buildProgressStep(
                  'At\nPharmacy',
                  false,
                  true,
                ),
                _buildProgressConnector(),
                _buildProgressStep(
                  'Picked\nUp',
                  false,
                  false,
                ),
                _buildProgressConnector(),
                _buildProgressStep(
                  'Heading to\nCustomer',
                  _currentPhase == NavigationPhase.toCustomer,
                  true,
                ),
                _buildProgressConnector(),
                _buildProgressStep(
                  'At\nCustomer',
                  false,
                  false,
                ),
                _buildProgressConnector(),
                _buildProgressStep(
                  'Delivered',
                  false,
                  false,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressStep(String label, bool isActive, bool isCompleted) {
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive
                ? AppColors.primary600
                : isCompleted
                    ? AppColors.success
                    : AppColors.neutral200,
          ),
          child: Center(
            child: isCompleted
                ? Icon(
                    Icons.check,
                    color: AppColors.neutralWhite,
                    size: UIConstants.iconSizeMedium,
                  )
                : Text(
                    '',
                    style: TextStyle(
                      color: isActive
                          ? AppColors.neutralWhite
                          : AppColors.neutral600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: UIConstants.paddingSmall),
        SizedBox(
          width: 48,
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: isActive
                      ? AppColors.primary600
                      : AppColors.neutral600,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                ),
          ),
        ),
      ],
    );
  }

  Widget _buildProgressConnector() {
    return Container(
      width: 24,
      height: 2,
      color: AppColors.neutral300,
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.paddingXSmall),
    );
  }

  Widget _buildOrderDetailsSection() {
    final items = _orderData['items'] as List<dynamic>;
    final subtotal = _orderData['subtotal'] as double;
    final deliveryFee = _orderData['deliveryFee'] as double;
    final serviceFee = _orderData['serviceFee'] as double;
    final total = _orderData['total'] as double;

    return PharmaCard(
      onTap: () {
        setState(() {
          _isItemsExpanded = !_isItemsExpanded;
        });
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order Details',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.neutral900,
                        ),
                  ),
                  const SizedBox(height: UIConstants.paddingXSmall),
                  Text(
                    '${items.length} items',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                ],
              ),
              Icon(
                _isItemsExpanded
                    ? Icons.keyboard_arrow_up
                    : Icons.keyboard_arrow_down,
                color: AppColors.neutral600,
              ),
            ],
          ),
          if (_isItemsExpanded) ...[
            const SizedBox(height: UIConstants.paddingMedium),
            Divider(
              color: AppColors.neutral200,
              height: 1,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            // Items List
            ...List.generate(items.length, (index) {
              final item = items[index];
              return Padding(
                padding: const EdgeInsets.only(
                  bottom: UIConstants.paddingMedium,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['name'],
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w500,
                                  color: AppColors.neutral900,
                                ),
                          ),
                          const SizedBox(height: UIConstants.paddingXSmall),
                          Text(
                            'Qty: ${item['quantity']}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: AppColors.neutral600,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '₦${(item['price'] as num).toStringAsFixed(2)}',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary600,
                          ),
                    ),
                  ],
                ),
              );
            }),
            Divider(
              color: AppColors.neutral200,
              height: 1,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            // Price Breakdown
            _buildPricingRow('Subtotal', subtotal),
            const SizedBox(height: UIConstants.paddingSmall),
            _buildPricingRow('Delivery Fee', deliveryFee),
            const SizedBox(height: UIConstants.paddingSmall),
            _buildPricingRow('Service Fee', serviceFee),
            const SizedBox(height: UIConstants.paddingMedium),
            Divider(
              color: AppColors.neutral200,
              height: 1,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.neutral900,
                      ),
                ),
                Text(
                  '₦${total.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary600,
                      ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPricingRow(String label, double amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.neutral600,
              ),
        ),
        Text(
          '₦${amount.toStringAsFixed(2)}',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.neutral900,
              ),
        ),
      ],
    );
  }

  Widget _buildBottomActionSheet() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.neutralWhite,
        border: Border(
          top: BorderSide(
            color: AppColors.neutral200,
            width: 1,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.neutral900.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Call & Message Buttons
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.neutral300),
                        borderRadius:
                            BorderRadius.circular(UIConstants.borderRadiusMedium),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.phone),
                        color: AppColors.primary600,
                        onPressed: _handleCall,
                      ),
                    ),
                  ),
                  const SizedBox(width: UIConstants.paddingSmall),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.neutral300),
                        borderRadius:
                            BorderRadius.circular(UIConstants.borderRadiusMedium),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.message),
                        color: AppColors.secondary600,
                        onPressed: _handleMessage,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              // Main Action Button
              SizedBox(
                width: double.infinity,
                child: PharmaButton(
                  label: _getMainActionLabel(),
                  onPressed: _currentPhase == NavigationPhase.toPharmacy
                      ? _handleArrivedAtPharmacy
                      : _handleArrivedAtCustomer,
                  isLoading: _isLoading,
                  variant: ButtonVariant.primary,
                  size: ButtonSize.large,
                  fullWidth: true,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
