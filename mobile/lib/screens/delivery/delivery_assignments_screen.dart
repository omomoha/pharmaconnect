import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class DeliveryAssignmentsScreen extends StatefulWidget {
  const DeliveryAssignmentsScreen({Key? key}) : super(key: key);

  @override
  State<DeliveryAssignmentsScreen> createState() =>
      _DeliveryAssignmentsScreenState();
}

class _DeliveryAssignmentsScreenState extends State<DeliveryAssignmentsScreen> {
  late Future<List<Map<String, dynamic>>> _deliveriesFuture;
  String _selectedFilter = 'All';
  bool _isOnline = true;

  final List<String> _filterOptions = [
    'All',
    'Available',
    'Assigned',
    'Picked Up',
    'In Transit',
    'Delivered',
  ];

  @override
  void initState() {
    super.initState();
    _deliveriesFuture = _loadDeliveries();
  }

  Future<List<Map<String, dynamic>>> _loadDeliveries() async {
    // Mock data - in production, this would be replaced with API call
    // final apiService = ApiService();
    // final response = await apiService.get('/delivery-providers/assignments');

    return Future.delayed(const Duration(milliseconds: 800), () {
      return [
        {
          'orderId': 'ORD-2024-0001',
          'pharmacyName': 'City Pharmacy',
          'customerArea': 'Ikoyi, Lagos',
          'customerAddress': '23 Banana Island Road',
          'distance': 2.3,
          'estimatedPayout': 500.00,
          'itemsCount': 3,
          'status': 'Available',
          'timePosted': DateTime.now().subtract(const Duration(hours: 1)),
        },
        {
          'orderId': 'ORD-2024-0002',
          'pharmacyName': 'Health Plus Pharmacy',
          'customerArea': 'Victoria Island, Lagos',
          'customerAddress': '45 Bishop Aboyade Cole Street',
          'distance': 5.1,
          'estimatedPayout': 800.00,
          'itemsCount': 5,
          'status': 'Available',
          'timePosted': DateTime.now().subtract(const Duration(minutes: 45)),
        },
        {
          'orderId': 'ORD-2024-0003',
          'pharmacyName': 'MedCare Pharmacy',
          'customerArea': 'Lekki, Lagos',
          'customerAddress': '12 Admiralty Way',
          'distance': 1.8,
          'estimatedPayout': 450.00,
          'itemsCount': 2,
          'status': 'Assigned',
          'timePosted': DateTime.now().subtract(const Duration(hours: 2)),
        },
        {
          'orderId': 'ORD-2024-0004',
          'pharmacyName': 'Quick Meds Pharmacy',
          'customerArea': 'Surulere, Lagos',
          'customerAddress': '78 Bode Thomas Street',
          'distance': 3.5,
          'estimatedPayout': 600.00,
          'itemsCount': 4,
          'status': 'Picked Up',
          'timePosted': DateTime.now().subtract(const Duration(minutes: 30)),
        },
        {
          'orderId': 'ORD-2024-0005',
          'pharmacyName': 'SafePharm',
          'customerArea': 'Yaba, Lagos',
          'customerAddress': '56 Saka Tinubu Road',
          'distance': 4.2,
          'estimatedPayout': 700.00,
          'itemsCount': 6,
          'status': 'In Transit',
          'timePosted': DateTime.now().subtract(const Duration(minutes: 15)),
        },
        {
          'orderId': 'ORD-2024-0006',
          'pharmacyName': 'Pharma Hub',
          'customerArea': 'Ajah, Lagos',
          'customerAddress': '34 Lekki-Epe Expressway',
          'distance': 6.7,
          'estimatedPayout': 900.00,
          'itemsCount': 7,
          'status': 'Delivered',
          'timePosted': DateTime.now().subtract(const Duration(hours: 3)),
        },
      ];
    });
  }

  List<Map<String, dynamic>> _filterDeliveries(
      List<Map<String, dynamic>> deliveries) {
    if (_selectedFilter == 'All') {
      return deliveries;
    }
    return deliveries
        .where((delivery) => delivery['status'] == _selectedFilter)
        .toList();
  }

  void _handleFilterChange(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
  }

  void _toggleOnlineStatus() {
    setState(() {
      _isOnline = !_isOnline;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isOnline ? 'You are now online' : 'You are now offline'),
        duration: const Duration(seconds: 2),
        backgroundColor: _isOnline ? AppColors.success : AppColors.neutral600,
      ),
    );
  }

  void _showAcceptConfirmation(Map<String, dynamic> delivery) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Accept Delivery?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Order: ${delivery['orderId']}'),
            const SizedBox(height: UIConstants.paddingSmall),
            Text('From: ${delivery['pharmacyName']}'),
            const SizedBox(height: UIConstants.paddingSmall),
            Text('To: ${delivery['customerArea']}'),
            const SizedBox(height: UIConstants.paddingSmall),
            Text('Distance: ${delivery['distance']} km'),
            const SizedBox(height: UIConstants.paddingSmall),
            Text(
              'Payout: ₦${delivery['estimatedPayout'].toStringAsFixed(2)}',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: AppColors.success,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Delivery ${delivery['orderId']} accepted!'),
                  backgroundColor: AppColors.success,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary600,
            ),
            child: const Text('Accept'),
          ),
        ],
      ),
    );
  }

  void _navigateToPickup(String orderId) {
    context.push('/delivery/navigate/$orderId');
  }

  void _startDelivery(String orderId) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Starting delivery for $orderId...'),
        backgroundColor: AppColors.info,
      ),
    );
  }

  void _completeDelivery(String orderId) {
    context.push('/delivery/verify-code/$orderId');
  }

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Available':
        return AppColors.warning;
      case 'Assigned':
        return AppColors.info;
      case 'Picked Up':
        return AppColors.secondary600;
      case 'In Transit':
        return AppColors.secondary600;
      case 'Delivered':
        return AppColors.success;
      default:
        return AppColors.neutral600;
    }
  }

  Color _getStatusBackgroundColor(String status) {
    switch (status) {
      case 'Available':
        return AppColors.warningLight;
      case 'Assigned':
        return AppColors.infoLight;
      case 'Picked Up':
        return AppColors.secondary100;
      case 'In Transit':
        return AppColors.secondary100;
      case 'Delivered':
        return AppColors.successLight;
      default:
        return AppColors.neutral100;
    }
  }

  Widget _buildDeliveryCard(Map<String, dynamic> delivery) {
    final status = delivery['status'] as String;
    final timePosted = delivery['timePosted'] as DateTime;

    return PharmaCard(
      margin: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingMedium,
        vertical: UIConstants.paddingSmall,
      ),
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Order ID, Status Badge, Time
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      delivery['orderId'],
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.neutral900,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingXSmall),
                    Text(
                      _getTimeAgo(timePosted),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingSmall + 4,
                  vertical: UIConstants.paddingXSmall,
                ),
                decoration: BoxDecoration(
                  color: _getStatusBackgroundColor(status),
                  borderRadius:
                      BorderRadius.circular(UIConstants.borderRadiusSmall),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: _getStatusColor(status),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Pharmacy Name
          Row(
            children: [
              Icon(
                Icons.local_pharmacy_outlined,
                size: UIConstants.iconSizeMedium,
                color: AppColors.primary600,
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'From',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                    Text(
                      delivery['pharmacyName'],
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral900,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Customer Location
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                size: UIConstants.iconSizeMedium,
                color: AppColors.error,
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'To',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                    Text(
                      delivery['customerArea'],
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral900,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      delivery['customerAddress'],
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Distance, Items, Payout row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Distance
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Distance',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                  Text(
                    '${delivery['distance']} km',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.neutral900,
                        ),
                  ),
                ],
              ),
              // Items
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Items',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                  Text(
                    '${delivery['itemsCount']} items',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.neutral900,
                        ),
                  ),
                ],
              ),
              // Payout
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Payout',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                  Text(
                    '₦${delivery['estimatedPayout'].toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.success,
                        ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Action Button based on status
          _buildActionButton(status, delivery),
        ],
      ),
    );
  }

  Widget _buildActionButton(String status, Map<String, dynamic> delivery) {
    switch (status) {
      case 'Available':
        return PharmaButton(
          label: 'Accept Delivery',
          icon: Icons.check_circle_outline,
          onPressed: () => _showAcceptConfirmation(delivery),
          fullWidth: true,
          variant: ButtonVariant.primary,
          size: ButtonSize.medium,
        );
      case 'Assigned':
        return PharmaButton(
          label: 'Navigate to Pickup',
          icon: Icons.navigation_outlined,
          onPressed: () => _navigateToPickup(delivery['orderId']),
          fullWidth: true,
          variant: ButtonVariant.primary,
          size: ButtonSize.medium,
        );
      case 'Picked Up':
        return PharmaButton(
          label: 'Start Delivery',
          icon: Icons.local_shipping_outlined,
          onPressed: () => _startDelivery(delivery['orderId']),
          fullWidth: true,
          variant: ButtonVariant.primary,
          size: ButtonSize.medium,
        );
      case 'In Transit':
        return PharmaButton(
          label: 'Complete Delivery',
          icon: Icons.check_circle,
          onPressed: () => _completeDelivery(delivery['orderId']),
          fullWidth: true,
          variant: ButtonVariant.primary,
          size: ButtonSize.medium,
        );
      case 'Delivered':
        return Container(
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          decoration: BoxDecoration(
            color: AppColors.successLight,
            borderRadius:
                BorderRadius.circular(UIConstants.borderRadiusMedium),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle,
                color: AppColors.success,
                size: UIConstants.iconSizeMedium,
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Text(
                'Delivery Completed',
                style: TextStyle(
                  color: AppColors.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
        title: Text(
          'Delivery Assignments',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w700,
              ),
        ),
        actions: [
          // Online/Offline Toggle Button
          Padding(
            padding: const EdgeInsets.all(UIConstants.paddingSmall),
            child: GestureDetector(
              onTap: _toggleOnlineStatus,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingMedium,
                  vertical: UIConstants.paddingSmall,
                ),
                decoration: BoxDecoration(
                  color: _isOnline ? AppColors.successLight : AppColors.neutral100,
                  borderRadius:
                      BorderRadius.circular(UIConstants.borderRadiusMedium),
                  border: Border.all(
                    color: _isOnline ? AppColors.success : AppColors.neutral300,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _isOnline ? AppColors.success : AppColors.neutral600,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: UIConstants.paddingXSmall),
                    Text(
                      _isOnline ? 'Online' : 'Offline',
                      style: TextStyle(
                        color: _isOnline ? AppColors.success : AppColors.neutral600,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _deliveriesFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(UIConstants.paddingMedium),
                  child: ShimmerLoading(
                    variant: ShimmerVariant.card,
                    itemCount: 5,
                  ),
                ),
              );
            }

          if (snapshot.hasError) {
            return Center(
              child: EmptyState(
                icon: Icons.error_outline,
                title: 'Error Loading Deliveries',
                subtitle: snapshot.error.toString(),
                actionLabel: 'Retry',
                onAction: () {
                  setState(() {
                    _deliveriesFuture = _loadDeliveries();
                  });
                },
                iconColor: AppColors.error,
              ),
            );
          }

          final allDeliveries = snapshot.data ?? [];
          final filteredDeliveries = _filterDeliveries(allDeliveries);

          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _deliveriesFuture = _loadDeliveries();
              });
              await _deliveriesFuture;
            },
            child: CustomScrollView(
              slivers: [
                // Filter Chips
                SliverToBoxAdapter(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                      vertical: UIConstants.paddingMedium,
                    ),
                    child: Row(
                      children: _filterOptions.map((filter) {
                        final isSelected = _selectedFilter == filter;
                        return Padding(
                          padding: const EdgeInsets.only(
                            right: UIConstants.paddingSmall,
                          ),
                          child: FilterChip(
                            label: Text(filter),
                            selected: isSelected,
                            onSelected: (_) => _handleFilterChange(filter),
                            backgroundColor: AppColors.neutral100,
                            selectedColor: AppColors.primary600,
                            labelStyle: TextStyle(
                              color: isSelected
                                  ? AppColors.neutralWhite
                                  : AppColors.neutral900,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                            side: isSelected
                                ? BorderSide.none
                                : const BorderSide(
                                    color: AppColors.neutral300,
                                  ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

                // Empty State or Delivery List
                if (filteredDeliveries.isEmpty)
                  SliverFillRemaining(
                    child: EmptyState(
                      icon: Icons.local_shipping_outlined,
                      title: 'No Deliveries',
                      subtitle: _selectedFilter == 'All'
                          ? 'No delivery assignments available right now.'
                          : 'No $_selectedFilter deliveries found.',
                      actionLabel: _selectedFilter == 'All'
                          ? null
                          : 'View All',
                      onAction: _selectedFilter == 'All'
                          ? null
                          : () => _handleFilterChange('All'),
                    ),
                  )
                else
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        return _buildDeliveryCard(filteredDeliveries[index]);
                      },
                      childCount: filteredDeliveries.length,
                    ),
                  ),

                // Bottom padding
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: UIConstants.paddingLarge,
                  ),
                ),
              ],
            ),
          );
          },
        ),
      ),
    );
  }
}
