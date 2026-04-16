import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/models/order_model.dart';
import 'package:pharmaconnect/services/order_service.dart';
import 'package:pharmaconnect/services/api_service.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({Key? key}) : super(key: key);

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final GlobalKey<RefreshIndicatorState> _refreshKey =
      GlobalKey<RefreshIndicatorState>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _refreshOrders() async {
    // Trigger refresh in provider
    if (mounted) {
      context.read<OrderService>().refreshMyOrders();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
        title: Text(
          'My Orders',
          style: AppTheme.titleMedium.copyWith(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: false,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Container(
            color: AppColors.neutralWhite,
            child: TabBar(
              controller: _tabController,
              labelColor: AppColors.primary600,
              unselectedLabelColor: AppColors.neutral700,
              indicatorColor: AppColors.primary600,
              indicatorWeight: 3,
              tabs: const [
                Tab(text: 'Active'),
                Tab(text: 'Completed'),
                Tab(text: 'Cancelled'),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        key: _refreshKey,
        onRefresh: _refreshOrders,
        child: TabBarView(
          controller: _tabController,
          children: [
            _ActiveOrdersList(),
            _CompletedOrdersList(),
            _CancelledOrdersList(),
          ],
        ),
      ),
    );
  }
}

class _ActiveOrdersList extends StatelessWidget {
  const _ActiveOrdersList();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<OrderModel>>(
      future: context.read<OrderService>().getMyOrders(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _LoadingOrdersList();
        }

        if (snapshot.hasError) {
          return _ErrorState(
            onRetry: () {
              // Trigger refresh
              (context as Element).reassemble();
            },
          );
        }

        final orders = snapshot.data ?? [];
        final activeOrders = orders.where((order) {
          return [
            OrderStatus.pending,
            OrderStatus.confirmed,
            OrderStatus.preparing,
            OrderStatus.ready,
            OrderStatus.outForDelivery,
          ].contains(order.status);
        }).toList();

        if (activeOrders.isEmpty) {
          return _EmptyState(
            icon: Icons.shopping_bag_outlined,
            title: 'No Active Orders',
            message: 'You don\'t have any active orders right now',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: activeOrders.length,
          itemBuilder: (context, index) {
            return _OrderCard(order: activeOrders[index]);
          },
        );
      },
    );
  }
}

class _CompletedOrdersList extends StatelessWidget {
  const _CompletedOrdersList();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<OrderModel>>(
      future: context.read<OrderService>().getMyOrders(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _LoadingOrdersList();
        }

        if (snapshot.hasError) {
          return _ErrorState(
            onRetry: () {
              (context as Element).reassemble();
            },
          );
        }

        final orders = snapshot.data ?? [];
        final completedOrders = orders
            .where((order) => order.status == OrderStatus.delivered)
            .toList();

        if (completedOrders.isEmpty) {
          return _EmptyState(
            icon: Icons.check_circle_outline,
            title: 'No Completed Orders',
            message: 'Your completed orders will appear here',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: completedOrders.length,
          itemBuilder: (context, index) {
            return _OrderCard(order: completedOrders[index]);
          },
        );
      },
    );
  }
}

class _CancelledOrdersList extends StatelessWidget {
  const _CancelledOrdersList();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<OrderModel>>(
      future: context.read<OrderService>().getMyOrders(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _LoadingOrdersList();
        }

        if (snapshot.hasError) {
          return _ErrorState(
            onRetry: () {
              (context as Element).reassemble();
            },
          );
        }

        final orders = snapshot.data ?? [];
        final cancelledOrders =
            orders.where((order) => order.status == OrderStatus.cancelled).toList();

        if (cancelledOrders.isEmpty) {
          return _EmptyState(
            icon: Icons.cancel_outlined,
            title: 'No Cancelled Orders',
            message: 'You don\'t have any cancelled orders',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: cancelledOrders.length,
          itemBuilder: (context, index) {
            return _OrderCard(order: cancelledOrders[index]);
          },
        );
      },
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;

  const _OrderCard({required this.order});

  String _getStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.preparing:
        return 'Preparing';
      case OrderStatus.ready:
        return 'Ready';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        context.push('/customer/orders/${order.id}');
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
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
              // Header: Order ID and Date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #${order.id.substring(0, 8).toUpperCase()}',
                    style: AppTheme.labelMedium.copyWith(
                      color: AppColors.neutral900,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    _formatDate(order.createdAt),
                    style: AppTheme.labelSmall.copyWith(
                      color: AppColors.neutral600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Pharmacy name
              Text(
                order.pharmacyName,
                style: AppTheme.bodySmall.copyWith(
                  color: AppColors.neutral700,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 12),
              // Items count and price
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${order.items.length} item${order.items.length != 1 ? 's' : ''}',
                    style: AppTheme.bodySmall.copyWith(
                      color: AppColors.neutral600,
                    ),
                  ),
                  Text(
                    '₦${order.totalPrice.toStringAsFixed(2)}',
                    style: AppTheme.bodySmall.copyWith(
                      color: AppColors.neutral900,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Status chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getStatusColor(order.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _getStatusLabel(order.status),
                  style: AppTheme.labelSmall.copyWith(
                    color: _getStatusColor(order.status),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingOrdersList extends StatelessWidget {
  const _LoadingOrdersList();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Container(
          height: 140,
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: AppColors.neutral100,
            borderRadius: BorderRadius.circular(12),
          ),
        );
      },
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppColors.neutral200,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: AppTheme.titleSmall.copyWith(
                color: AppColors.neutral700,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppTheme.bodySmall.copyWith(
                color: AppColors.neutral600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
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
              'Unable to Load Orders',
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
