import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/order_model.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/order_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class PharmacyOrdersScreen extends StatefulWidget {
  const PharmacyOrdersScreen({Key? key}) : super(key: key);

  @override
  State<PharmacyOrdersScreen> createState() => _PharmacyOrdersScreenState();
}

class _PharmacyOrdersScreenState extends State<PharmacyOrdersScreen> {
  late Future<Map<String, dynamic>> _ordersFuture;
  String _selectedFilter = 'all';
  final GlobalKey<RefreshIndicatorState> _refreshKey =
      GlobalKey<RefreshIndicatorState>();

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  void _loadOrders() {
    _ordersFuture = _fetchOrders();
  }

  Future<Map<String, dynamic>> _fetchOrders() async {
    final apiService = ApiService();
    final orderService = OrderService(apiService: apiService);
    return orderService.getMyOrders(
      status: _selectedFilter == 'all' ? null : _selectedFilter,
    );
  }

  Future<void> _refreshOrders() async {
    setState(() {
      _loadOrders();
    });
    await _ordersFuture;
  }

  void _showConfirmStatusDialog(OrderModel order, OrderStatus newStatus) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Status Change'),
        content: Text(
          'Update order status to ${newStatus.displayName}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _updateOrderStatus(order.id, newStatus);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateOrderStatus(String orderId, OrderStatus newStatus) async {
    try {
      final apiService = ApiService();
      await apiService.put(
        '${ApiEndpoints.orders}/$orderId/status',
        body: {'status': newStatus.value},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order status updated successfully')),
        );
        _refreshOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating order: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders'),
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
        foregroundColor: AppColors.neutral900,
      ),
      body: RefreshIndicator(
        key: _refreshKey,
        onRefresh: _refreshOrders,
        child: Column(
          children: [
            // Filter Chips
            SizedBox(
              height: 56,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingMedium,
                ),
                children: [
                  _buildFilterChip('All', 'all'),
                  _buildFilterChip('Pending', 'pending'),
                  _buildFilterChip('Confirmed', 'confirmed'),
                  _buildFilterChip('Preparing', 'preparing'),
                  _buildFilterChip('Ready', 'ready'),
                  _buildFilterChip('Out for Delivery', 'outForDelivery'),
                  _buildFilterChip('Delivered', 'delivered'),
                  _buildFilterChip('Cancelled', 'cancelled'),
                ],
              ),
            ),
            // Orders List
            Expanded(
              child: FutureBuilder<Map<String, dynamic>>(
                future: _ordersFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return ShimmerLoading(
                      variant: ShimmerVariant.list,
                      itemCount: 5,
                    );
                  }

                  if (snapshot.hasError) {
                    return Center(
                      child: ErrorStateWidget(
                        title: 'Failed to load orders',
                        subtitle: snapshot.error.toString(),
                        onRetry: _refreshOrders,
                      ),
                    );
                  }

                  final orders =
                      (snapshot.data?['orders'] as List<OrderModel>?) ?? [];

                  if (orders.isEmpty) {
                    return EmptyState(
                      icon: Icons.shopping_bag_outlined,
                      title: 'No Orders',
                      subtitle: 'You don\'t have any $_selectedFilter orders yet',
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(UIConstants.paddingMedium),
                    itemCount: orders.length,
                    itemBuilder: (context, index) {
                      final order = orders[index];
                      return _OrderCard(
                        order: order,
                        onTap: () {
                          context.push(
                            '/pharmacy/orders/${order.id}',
                          );
                        },
                        onActionPressed: () {
                          _handleOrderAction(order);
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: UIConstants.paddingSmall),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _selectedFilter = value;
            _loadOrders();
          });
        },
        backgroundColor: AppColors.neutral100,
        selectedColor: AppColors.primary500,
        labelStyle: TextStyle(
          color: isSelected ? AppColors.neutralWhite : AppColors.neutral700,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  void _handleOrderAction(OrderModel order) {
    switch (order.status) {
      case OrderStatus.pending:
        _showConfirmStatusDialog(order, OrderStatus.confirmed);
        break;
      case OrderStatus.confirmed:
        _showConfirmStatusDialog(order, OrderStatus.preparing);
        break;
      case OrderStatus.preparing:
        _showConfirmStatusDialog(order, OrderStatus.ready);
        break;
      default:
        break;
    }
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;
  final VoidCallback onTap;
  final VoidCallback onActionPressed;

  const _OrderCard({
    Key? key,
    required this.order,
    required this.onTap,
    required this.onActionPressed,
  }) : super(key: key);

  String _getOrderIdDisplay() {
    return order.id.toUpperCase().substring(0, 8);
  }

  Widget _getStatusBadge() {
    switch (order.status) {
      case OrderStatus.pending:
        return StatusBadge.pending();
      case OrderStatus.confirmed:
        return StatusBadge.processing(label: 'Confirmed');
      case OrderStatus.preparing:
        return StatusBadge.processing(label: 'Preparing');
      case OrderStatus.ready:
        return StatusBadge.approved(label: 'Ready');
      case OrderStatus.outForDelivery:
        return StatusBadge.active(label: 'Out for Delivery');
      case OrderStatus.delivered:
        return StatusBadge.completed();
      case OrderStatus.cancelled:
        return StatusBadge.cancelled();
    }
  }

  bool _hasAction() {
    return order.status == OrderStatus.pending ||
        order.status == OrderStatus.confirmed ||
        order.status == OrderStatus.preparing;
  }

  String _getActionButtonLabel() {
    switch (order.status) {
      case OrderStatus.pending:
        return 'Confirm Order';
      case OrderStatus.confirmed:
        return 'Start Preparing';
      case OrderStatus.preparing:
        return 'Mark as Ready';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return PharmaCard(
      onTap: onTap,
      margin: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order #${_getOrderIdDisplay()}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral900,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingXSmall),
                    Text(
                      order.pharmacyName,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                  ],
                ),
              ),
              _getStatusBadge(),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          // Customer Info
          Row(
            children: [
              Icon(
                Icons.person_outline,
                size: UIConstants.iconSizeMedium,
                color: AppColors.neutral500,
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Expanded(
                child: Text(
                  order.userId.isNotEmpty ? 'Customer Order' : 'Guest Order',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.neutral700,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          // Items & Price Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${order.items.length} item${order.items.length != 1 ? 's' : ''}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
              Text(
                '₦${order.total.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          // Date
          Text(
            'Ordered on ${_formatDate(order.createdAt)}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.neutral500,
                ),
          ),
          // Action Button
          if (_hasAction()) ...[
            const SizedBox(height: UIConstants.paddingMedium),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onActionPressed,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary600,
                  foregroundColor: AppColors.neutralWhite,
                  padding: const EdgeInsets.symmetric(
                    vertical: UIConstants.paddingSmall,
                  ),
                ),
                child: Text(_getActionButtonLabel()),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class PharmacyOrderDetailScreen extends StatefulWidget {
  final String orderId;

  const PharmacyOrderDetailScreen({
    Key? key,
    required this.orderId,
  }) : super(key: key);

  @override
  State<PharmacyOrderDetailScreen> createState() =>
      _PharmacyOrderDetailScreenState();
}

class _PharmacyOrderDetailScreenState extends State<PharmacyOrderDetailScreen> {
  late Future<OrderModel> _orderFuture;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  void _loadOrder() {
    final apiService = ApiService();
    final orderService = OrderService(apiService: apiService);
    _orderFuture = orderService.getOrderById(widget.orderId);
  }

  Future<void> _updateOrderStatus(OrderStatus newStatus) async {
    try {
      final apiService = ApiService();
      await apiService.put(
        '${ApiEndpoints.orders}/${widget.orderId}/status',
        body: {'status': newStatus.value},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order status updated successfully')),
        );
        setState(() {
          _loadOrder();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating order: $e')),
        );
      }
    }
  }

  void _showConfirmStatusDialog(OrderStatus newStatus) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Status Change'),
        content: Text(
          'Update order status to ${newStatus.displayName}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _updateOrderStatus(newStatus);
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Order Details'),
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
        foregroundColor: AppColors.neutral900,
      ),
      body: FutureBuilder<OrderModel>(
        future: _orderFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return ShimmerLoading(
              variant: ShimmerVariant.detail,
              itemCount: 1,
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: ErrorStateWidget(
                title: 'Failed to load order',
                subtitle: snapshot.error.toString(),
                onRetry: () {
                  setState(() {
                    _loadOrder();
                  });
                },
              ),
            );
          }

          final order = snapshot.data;
          if (order == null) {
            return const Center(child: Text('Order not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(UIConstants.paddingMedium),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Order Header
                _OrderHeader(order: order),
                const SizedBox(height: UIConstants.paddingLarge),
                // Customer Info
                _CustomerInfoSection(order: order),
                const SizedBox(height: UIConstants.paddingLarge),
                // Order Items
                _OrderItemsSection(order: order),
                const SizedBox(height: UIConstants.paddingLarge),
                // Delivery Info
                _DeliveryInfoSection(order: order),
                const SizedBox(height: UIConstants.paddingLarge),
                // Payment Summary
                _PaymentSummarySection(order: order),
                const SizedBox(height: UIConstants.paddingLarge),
                // Action Buttons
                _buildActionButtons(order),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionButtons(OrderModel order) {
    switch (order.status) {
      case OrderStatus.pending:
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              _showConfirmStatusDialog(OrderStatus.confirmed);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary600,
              foregroundColor: AppColors.neutralWhite,
              padding: const EdgeInsets.symmetric(
                vertical: UIConstants.paddingMedium,
              ),
            ),
            child: const Text('Confirm Order'),
          ),
        );
      case OrderStatus.confirmed:
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              _showConfirmStatusDialog(OrderStatus.preparing);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary600,
              foregroundColor: AppColors.neutralWhite,
              padding: const EdgeInsets.symmetric(
                vertical: UIConstants.paddingMedium,
              ),
            ),
            child: const Text('Start Preparing'),
          ),
        );
      case OrderStatus.preparing:
        return SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              _showConfirmStatusDialog(OrderStatus.ready);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary600,
              foregroundColor: AppColors.neutralWhite,
              padding: const EdgeInsets.symmetric(
                vertical: UIConstants.paddingMedium,
              ),
            ),
            child: const Text('Mark as Ready'),
          ),
        );
      case OrderStatus.ready:
        return PharmaCard(
          color: AppColors.successLight,
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          child: Row(
            children: [
              Icon(
                Icons.check_circle,
                color: AppColors.success,
                size: UIConstants.iconSizeXLarge,
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ready for Pickup',
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.success,
                              ),
                    ),
                    const SizedBox(height: UIConstants.paddingXSmall),
                    Text(
                      'Waiting for delivery provider to pick up',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.success,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _OrderHeader extends StatelessWidget {
  final OrderModel order;

  const _OrderHeader({Key? key, required this.order}) : super(key: key);

  Widget _getStatusBadge() {
    switch (order.status) {
      case OrderStatus.pending:
        return StatusBadge.pending();
      case OrderStatus.confirmed:
        return StatusBadge.processing(label: 'Confirmed');
      case OrderStatus.preparing:
        return StatusBadge.processing(label: 'Preparing');
      case OrderStatus.ready:
        return StatusBadge.approved(label: 'Ready');
      case OrderStatus.outForDelivery:
        return StatusBadge.active(label: 'Out for Delivery');
      case OrderStatus.delivered:
        return StatusBadge.completed();
      case OrderStatus.cancelled:
        return StatusBadge.cancelled();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PharmaCard(
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
                    'Order #${order.id.toUpperCase().substring(0, 8)}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: UIConstants.paddingXSmall),
                  Text(
                    'Placed on ${_formatDate(order.createdAt)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                ],
              ),
              _getStatusBadge(),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _CustomerInfoSection extends StatelessWidget {
  final OrderModel order;

  const _CustomerInfoSection({Key? key, required this.order})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Customer Information',
          padding: EdgeInsets.zero,
          titleStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: UIConstants.paddingMedium),
        PharmaCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Order ID',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
              const SizedBox(height: UIConstants.paddingXSmall),
              Text(
                order.id.toUpperCase().substring(0, 8),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: UIConstants.paddingLarge),
              Text(
                'Delivery Address',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
              const SizedBox(height: UIConstants.paddingXSmall),
              Text(
                order.deliveryAddress,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _OrderItemsSection extends StatelessWidget {
  final OrderModel order;

  const _OrderItemsSection({Key? key, required this.order}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Order Items',
          padding: EdgeInsets.zero,
          titleStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: UIConstants.paddingMedium),
        PharmaCard(
          child: Column(
            children: List.generate(
              order.items.length,
              (index) {
                final item = order.items[index];
                return Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.productName,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w500,
                                    ),
                              ),
                              const SizedBox(
                                height: UIConstants.paddingXSmall,
                              ),
                              Text(
                                'Qty: ${item.quantity}',
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
                          '₦${item.subtotal.toStringAsFixed(2)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary600,
                              ),
                        ),
                      ],
                    ),
                    if (index < order.items.length - 1) ...[
                      const SizedBox(height: UIConstants.paddingMedium),
                      Divider(
                        color: AppColors.neutral200,
                        height: 1,
                      ),
                      const SizedBox(height: UIConstants.paddingMedium),
                    ],
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _DeliveryInfoSection extends StatelessWidget {
  final OrderModel order;

  const _DeliveryInfoSection({Key? key, required this.order})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final trackingInfo = order.trackingInfo;
    final hasTracking = trackingInfo != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Delivery Information',
          padding: EdgeInsets.zero,
          titleStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: UIConstants.paddingMedium),
        PharmaCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Delivery Provider',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
              const SizedBox(height: UIConstants.paddingXSmall),
              Text(
                hasTracking
                    ? (trackingInfo.deliveryRiderName ?? 'Unassigned')
                    : 'Not assigned yet',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
              if (hasTracking && trackingInfo.vehicleInfo != null) ...[
                const SizedBox(height: UIConstants.paddingMedium),
                Text(
                  'Vehicle Information',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.neutral600,
                      ),
                ),
                const SizedBox(height: UIConstants.paddingXSmall),
                Text(
                  trackingInfo.vehicleInfo ?? 'Unknown',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
              if (hasTracking && trackingInfo.estimatedDeliveryTime != null) ...[
                const SizedBox(height: UIConstants.paddingMedium),
                Text(
                  'Estimated Delivery',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.neutral600,
                      ),
                ),
                const SizedBox(height: UIConstants.paddingXSmall),
                Text(
                  _formatDateTime(trackingInfo.estimatedDeliveryTime!),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

class _PaymentSummarySection extends StatelessWidget {
  final OrderModel order;

  const _PaymentSummarySection({Key? key, required this.order})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Payment Summary',
          padding: EdgeInsets.zero,
          titleStyle: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: UIConstants.paddingMedium),
        PharmaCard(
          child: Column(
            children: [
              _PaymentRow(
                context: context,
                label: 'Subtotal',
                amount: order.subtotal,
              ),
              const SizedBox(height: UIConstants.paddingMedium),
              _PaymentRow(
                context: context,
                label: 'Delivery Fee',
                amount: order.deliveryFee,
              ),
              const SizedBox(height: UIConstants.paddingMedium),
              _PaymentRow(
                context: context,
                label: 'Service Fee',
                amount: order.serviceFee,
              ),
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
                        ),
                  ),
                  Text(
                    '₦${order.total.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary600,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.paddingMedium),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Payment Method',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                  Text(
                    _formatPaymentMethod(order.paymentMethod),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatPaymentMethod(String? method) {
    if (method == null || method.isEmpty) return 'Not specified';
    return method[0].toUpperCase() + method.substring(1);
  }
}

class _PaymentRow extends StatelessWidget {
  final BuildContext context;
  final String label;
  final double amount;

  const _PaymentRow({
    Key? key,
    required this.context,
    required this.label,
    required this.amount,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.neutral600,
              ),
        ),
        Text(
          '₦${amount.toStringAsFixed(2)}',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
        ),
      ],
    );
  }
}

class ErrorStateWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onRetry;

  const ErrorStateWidget({
    Key? key,
    required this.title,
    this.subtitle,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(UIConstants.paddingLarge),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: UIConstants.paddingLarge),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.neutral900,
                  ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: UIConstants.paddingSmall),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
            ],
            if (onRetry != null) ...[
              const SizedBox(height: UIConstants.paddingLarge),
              ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary600,
                  foregroundColor: AppColors.neutralWhite,
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.paddingLarge,
                    vertical: UIConstants.paddingMedium,
                  ),
                ),
                child: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
