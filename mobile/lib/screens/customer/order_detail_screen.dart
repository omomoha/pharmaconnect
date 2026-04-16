import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/models/order_model.dart';
import 'package:pharmaconnect/services/order_service.dart';
import 'package:pharmaconnect/services/api_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({
    Key? key,
    required this.orderId,
  }) : super(key: key);

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late Future<OrderModel> _orderFuture;

  @override
  void initState() {
    super.initState();
    _orderFuture = context.read<OrderService>().getOrderById(widget.orderId);
  }

  Future<void> _refreshOrder() async {
    setState(() {
      _orderFuture = context.read<OrderService>().getOrderById(widget.orderId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
        title: FutureBuilder<OrderModel>(
          future: _orderFuture,
          builder: (context, snapshot) {
            final title = snapshot.hasData
                ? 'Order #${snapshot.data!.id.substring(0, 8).toUpperCase()}'
                : 'Order Details';
            return Text(
              title,
              style: AppTheme.titleMedium.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w600,
              ),
            );
          },
        ),
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: _refreshOrder,
        child: FutureBuilder<OrderModel>(
          future: _orderFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _LoadingState();
            }

            if (snapshot.hasError) {
              return _ErrorState(onRetry: _refreshOrder);
            }

            if (!snapshot.hasData) {
              return _ErrorState(onRetry: _refreshOrder);
            }

            final order = snapshot.data!;
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Banner
                  _StatusBanner(order: order),
                  const SizedBox(height: 24),

                  // Order Timeline
                  _OrderTimeline(order: order),
                  const SizedBox(height: 24),

                  // Delivery Info (if applicable)
                  if (order.deliveryInfo != null)
                    _DeliveryInfo(deliveryInfo: order.deliveryInfo!),
                  if (order.deliveryInfo != null) const SizedBox(height: 24),

                  // Items Section
                  _ItemsSection(order: order),
                  const SizedBox(height: 24),

                  // Payment Summary
                  _PaymentSummary(order: order),
                  const SizedBox(height: 24),

                  // Actions
                  _ActionsSection(order: order),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  final OrderModel order;

  const _StatusBanner({required this.order});

  String _getStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.preparing:
        return 'Preparing';
      case OrderStatus.ready:
        return 'Ready for Pickup';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  IconData _getStatusIcon(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Icons.schedule;
      case OrderStatus.confirmed:
        return Icons.check_circle;
      case OrderStatus.preparing:
        return Icons.local_pharmacy;
      case OrderStatus.ready:
        return Icons.done_all;
      case OrderStatus.outForDelivery:
        return Icons.local_shipping;
      case OrderStatus.delivered:
        return Icons.check_circle;
      case OrderStatus.cancelled:
        return Icons.cancel;
    }
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.delivered:
        return AppColors.success;
      case OrderStatus.cancelled:
        return AppColors.error;
      case OrderStatus.pending:
        return AppColors.info;
      case OrderStatus.confirmed:
      case OrderStatus.preparing:
      case OrderStatus.ready:
      case OrderStatus.outForDelivery:
        return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(order.status);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        border: Border.all(color: statusColor, width: 1.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            _getStatusIcon(order.status),
            color: statusColor,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getStatusLabel(order.status),
                  style: AppTheme.labelMedium.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  order.statusUpdatedAt != null
                      ? 'Updated ${_formatDateTime(order.statusUpdatedAt!)}'
                      : 'No updates yet',
                  style: AppTheme.labelSmall.copyWith(
                    color: AppColors.neutral600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}

class _OrderTimeline extends StatelessWidget {
  final OrderModel order;

  const _OrderTimeline({required this.order});

  bool _isStatusCompleted(OrderStatus checkStatus) {
    const statusOrder = [
      OrderStatus.pending,
      OrderStatus.confirmed,
      OrderStatus.preparing,
      OrderStatus.ready,
      OrderStatus.outForDelivery,
      OrderStatus.delivered,
    ];

    final currentIndex = statusOrder.indexOf(order.status);
    final checkIndex = statusOrder.indexOf(checkStatus);

    return checkIndex <= currentIndex &&
        order.status != OrderStatus.cancelled;
  }

  @override
  Widget build(BuildContext context) {
    const timelineSteps = [
      (OrderStatus.pending, 'Pending'),
      (OrderStatus.confirmed, 'Confirmed'),
      (OrderStatus.preparing, 'Preparing'),
      (OrderStatus.ready, 'Ready'),
      (OrderStatus.outForDelivery, 'Out for Delivery'),
      (OrderStatus.delivered, 'Delivered'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Order Timeline',
          style: AppTheme.titleSmall.copyWith(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: timelineSteps.length,
          itemBuilder: (context, index) {
            final (status, label) = timelineSteps[index];
            final isCompleted = _isStatusCompleted(status);
            final isCurrent = order.status == status;
            final isCancelled = order.status == OrderStatus.cancelled;

            return _TimelineStep(
              label: label,
              isCompleted: isCompleted,
              isCurrent: isCurrent,
              isCancelled: isCancelled,
              isLast: index == timelineSteps.length - 1,
            );
          },
        ),
      ],
    );
  }
}

class _TimelineStep extends StatelessWidget {
  final String label;
  final bool isCompleted;
  final bool isCurrent;
  final bool isCancelled;
  final bool isLast;

  const _TimelineStep({
    required this.label,
    required this.isCompleted,
    required this.isCurrent,
    required this.isCancelled,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    Color getColor() {
      if (isCancelled) return AppColors.error;
      if (isCompleted) return AppColors.success;
      if (isCurrent) return AppColors.warning;
      return AppColors.neutral200;
    }

    final color = getColor();

    return Column(
      children: [
        Row(
          children: [
            Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withOpacity(0.2),
                    border: Border.all(color: color, width: 2),
                  ),
                  child: Center(
                    child: Icon(
                      isCompleted ? Icons.check : Icons.circle,
                      size: 16,
                      color: color,
                    ),
                  ),
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 40,
                    color: isCompleted
                        ? AppColors.success
                        : AppColors.neutral200,
                  ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: AppTheme.bodySmall.copyWith(
                  color: isCurrent ? AppColors.warning : AppColors.neutral700,
                  fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _DeliveryInfo extends StatelessWidget {
  final OrderDeliveryInfo deliveryInfo;

  const _DeliveryInfo({required this.deliveryInfo});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Delivery Information',
          style: AppTheme.titleSmall.copyWith(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          color: AppColors.neutralWhite,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: AppColors.neutral200, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Rider Name
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Rider',
                      style: AppTheme.labelSmall.copyWith(
                        color: AppColors.neutral600,
                      ),
                    ),
                    Text(
                      deliveryInfo.riderName,
                      style: AppTheme.bodySmall.copyWith(
                        color: AppColors.neutral900,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Rider Phone
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Phone',
                      style: AppTheme.labelSmall.copyWith(
                        color: AppColors.neutral600,
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        // TODO: Implement phone call functionality
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Call ${deliveryInfo.riderPhone}'),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                      child: Text(
                        deliveryInfo.riderPhone,
                        style: AppTheme.bodySmall.copyWith(
                          color: AppColors.primary600,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Vehicle Info
                if (deliveryInfo.vehicleInfo != null)
                  Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Vehicle',
                            style: AppTheme.labelSmall.copyWith(
                              color: AppColors.neutral600,
                            ),
                          ),
                          Text(
                            deliveryInfo.vehicleInfo!,
                            style: AppTheme.bodySmall.copyWith(
                              color: AppColors.neutral900,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),

                // Estimated Delivery Time
                if (deliveryInfo.estimatedDeliveryTime != null)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Est. Delivery',
                        style: AppTheme.labelSmall.copyWith(
                          color: AppColors.neutral600,
                        ),
                      ),
                      Text(
                        _formatEstimatedTime(deliveryInfo.estimatedDeliveryTime!),
                        style: AppTheme.bodySmall.copyWith(
                          color: AppColors.neutral900,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _formatEstimatedTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}

class _ItemsSection extends StatelessWidget {
  final OrderModel order;

  const _ItemsSection({required this.order});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Items',
          style: AppTheme.titleSmall.copyWith(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: order.items.length,
          itemBuilder: (context, index) {
            final item = order.items[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.productName,
                          style: AppTheme.bodySmall.copyWith(
                            color: AppColors.neutral900,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Qty: ${item.quantity}',
                          style: AppTheme.labelSmall.copyWith(
                            color: AppColors.neutral600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '₦${item.price.toStringAsFixed(2)}',
                    style: AppTheme.bodySmall.copyWith(
                      color: AppColors.neutral900,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _PaymentSummary extends StatelessWidget {
  final OrderModel order;

  const _PaymentSummary({required this.order});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Payment Summary',
          style: AppTheme.titleSmall.copyWith(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          color: AppColors.neutral50,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Subtotal
                _SummaryRow(
                  label: 'Subtotal',
                  value: '₦${order.subtotal.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 12),

                // Delivery Fee
                _SummaryRow(
                  label: 'Delivery Fee',
                  value: '₦${order.deliveryFee.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 12),

                // Service Fee
                _SummaryRow(
                  label: 'Service Fee',
                  value: '₦${order.serviceFee.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 16),

                // Divider
                Container(
                  height: 1,
                  color: AppColors.neutral200,
                ),
                const SizedBox(height: 16),

                // Total
                _SummaryRow(
                  label: 'Total',
                  value: '₦${order.totalPrice.toStringAsFixed(2)}',
                  isBold: true,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTheme.bodySmall.copyWith(
            color: AppColors.neutral700,
            fontWeight: isBold ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: AppTheme.bodySmall.copyWith(
            color: AppColors.neutral900,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _ActionsSection extends StatelessWidget {
  final OrderModel order;

  const _ActionsSection({required this.order});

  bool _canCancelOrder(OrderStatus status) {
    return status == OrderStatus.pending || status == OrderStatus.confirmed;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Cancel Order Button
        if (_canCancelOrder(order.status))
          OutlinedButton(
            onPressed: () {
              // TODO: Implement cancel order functionality
              _showCancelDialog(context);
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: BorderSide(color: AppColors.error, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Cancel Order',
              style: AppTheme.labelMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        if (_canCancelOrder(order.status)) const SizedBox(height: 12),

        // Contact Pharmacy Button
        OutlinedButton(
          onPressed: () {
            // TODO: Navigate to chat with pharmacy
            context.push('/customer/chat/pharmacy/${order.pharmacyId}');
          },
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary600,
            side:
                BorderSide(color: AppColors.primary600, width: 1.5),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(
            'Contact Pharmacy',
            style: AppTheme.labelMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Reorder Button
        ElevatedButton(
          onPressed: () {
            // TODO: Implement reorder functionality
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Items added to cart'),
                duration: Duration(seconds: 2),
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary600,
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: Text(
            'Reorder',
            style: AppTheme.labelMedium.copyWith(
              color: AppColors.neutralWhite,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Cancel Order?',
          style: AppTheme.titleSmall.copyWith(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w600,
          ),
        ),
        content: Text(
          'Are you sure you want to cancel this order? This action cannot be undone.',
          style: AppTheme.bodySmall.copyWith(
            color: AppColors.neutral700,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: Text(
              'Keep Order',
              style: AppTheme.labelMedium.copyWith(
                color: AppColors.primary600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              context.pop();
              // TODO: Implement cancel order API call
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Order cancelled successfully'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child: Text(
              'Cancel Order',
              style: AppTheme.labelMedium.copyWith(
                color: AppColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLoadingContainer(height: 100),
          const SizedBox(height: 24),
          _buildLoadingContainer(height: 200),
          const SizedBox(height: 24),
          _buildLoadingContainer(height: 150),
        ],
      ),
    );
  }

  Widget _buildLoadingContainer({required double height}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.neutral100,
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Unable to Load Order',
              style: AppTheme.titleSmall.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Something went wrong. Please try again.',
              style: AppTheme.bodySmall.copyWith(
                color: AppColors.neutral600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary600,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                'Retry',
                style: AppTheme.labelMedium.copyWith(
                  color: AppColors.neutralWhite,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
