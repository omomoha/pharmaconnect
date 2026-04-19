import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';
import 'package:provider/provider.dart';
import 'dart:async';

class PharmacyDashboardScreen extends StatefulWidget {
  const PharmacyDashboardScreen({Key? key}) : super(key: key);

  @override
  State<PharmacyDashboardScreen> createState() =>
      _PharmacyDashboardScreenState();
}

class _PharmacyDashboardScreenState extends State<PharmacyDashboardScreen> {
  int _currentIndex = 0;
  final GlobalKey<RefreshIndicatorState> _refreshKey =
      GlobalKey<RefreshIndicatorState>();

  // Mock data - replace with API calls
  Map<String, dynamic> _dashboardStats = {
    'totalOrders': 24,
    'revenue': 2450.00,
    'productsListed': 156,
    'averageRating': 4.8,
  };

  List<Map<String, dynamic>> _recentOrders = [];
  List<Map<String, dynamic>> _lowStockProducts = [];
  List<Map<String, dynamic>> _allOrders = [];
  Map<String, int> _orderFilters = {
    'all': 0,
    'pending': 0,
    'processing': 0,
    'ready': 0,
    'delivered': 0,
    'cancelled': 0,
  };

  bool _isLoading = false;
  String? _selectedOrderFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();

      // Get current user's pharmacy
      final pharmacyResponse = await apiService.get(ApiEndpoints.pharmacies + '/mine');
      if (pharmacyResponse is! Map<String, dynamic>) {
        throw Exception('Invalid pharmacy response');
      }

      final pharmacyId = pharmacyResponse['data']['id'] as String;

      // Fetch orders for this pharmacy
      final ordersResponse = await apiService.get(
        '${ApiEndpoints.orders}/pharmacy/$pharmacyId',
      );

      if (ordersResponse is! Map<String, dynamic>) {
        throw Exception('Invalid orders response');
      }

      final orders = ordersResponse['data'] as List<dynamic>? ?? [];

      // Fetch products for this pharmacy
      final productsResponse = await apiService.get(
        '${ApiEndpoints.pharmacies}/$pharmacyId/products',
      );

      if (productsResponse is! Map<String, dynamic>) {
        throw Exception('Invalid products response');
      }

      final products = productsResponse['data'] as List<dynamic>? ?? [];

      // Process orders data
      final recentOrders = <Map<String, dynamic>>[];
      final ordersList = <Map<String, dynamic>>[];

      for (final order in orders) {
        if (order is! Map<String, dynamic>) continue;

        final orderData = {
          'id': order['id'] as String? ?? 'Unknown',
          'customerName': order['customerName'] as String? ?? 'Unknown Customer',
          'itemsSummary': _formatItemsSummary(order['items'] as List<dynamic>? ?? []),
          'total': (order['total'] as num?)?.toDouble() ?? 0.0,
          'status': order['status'] as String? ?? 'pending',
          'date': _formatDate(order['createdAt'] as String?),
        };

        ordersList.add(orderData);

        // Only add first 3 orders to recent orders
        if (recentOrders.length < 3) {
          recentOrders.add(orderData);
        }
      }

      // Identify low stock products (assuming there's a stock field)
      final lowStockProducts = <Map<String, dynamic>>[];
      for (final product in products) {
        if (product is! Map<String, dynamic>) continue;

        final currentStock = (product['stock'] as num?)?.toInt() ?? 0;
        final minStock = (product['minStock'] as num?)?.toInt() ?? 20;

        if (currentStock < minStock) {
          lowStockProducts.add({
            'name': product['name'] as String? ?? 'Unknown',
            'currentStock': currentStock,
            'minStock': minStock,
          });
        }
      }

      // Calculate statistics
      final totalOrders = orders.length;
      final totalRevenue = orders.fold<double>(
        0.0,
        (sum, order) => sum + ((order['total'] as num?)?.toDouble() ?? 0.0),
      );

      setState(() {
        _dashboardStats = {
          'totalOrders': totalOrders,
          'revenue': totalRevenue,
          'productsListed': products.length,
          'averageRating': 4.8,
        };

        _recentOrders = recentOrders;
        _lowStockProducts = lowStockProducts;
        _allOrders = ordersList;

        // Count orders by status
        _orderFilters['all'] = _allOrders.length;
        _orderFilters['pending'] = _allOrders
            .where((o) => o['status'] == 'pending')
            .length;
        _orderFilters['processing'] = _allOrders
            .where((o) => o['status'] == 'processing')
            .length;
        _orderFilters['ready'] =
            _allOrders.where((o) => o['status'] == 'ready').length;
        _orderFilters['delivered'] = _allOrders
            .where((o) => o['status'] == 'delivered')
            .length;
        _orderFilters['cancelled'] = _allOrders
            .where((o) => o['status'] == 'cancelled')
            .length;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _formatItemsSummary(List<dynamic> items) {
    if (items.isEmpty) return 'No items';

    final itemNames = items
        .take(2)
        .map((item) {
          if (item is Map<String, dynamic>) {
            return item['name'] as String? ?? 'Unknown';
          }
          return 'Unknown';
        })
        .toList();

    final summary = itemNames.join(', ');
    if (items.length > 2) {
      return '$summary +${items.length - 2} more';
    }
    return summary;
  }

  String _formatDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return 'N/A';
    }

    try {
      final date = DateTime.parse(dateString);
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildDashboardTab(),
          _buildOrdersTab(),
          _buildProductsTab(),
          _buildEarningsTab(),
          _buildMoreTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_outlined),
            activeIcon: Icon(Icons.receipt),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Products',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.trending_up_outlined),
            activeIcon: Icon(Icons.trending_up),
            label: 'Earnings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz_outlined),
            activeIcon: Icon(Icons.more_horiz),
            label: 'More',
          ),
        ],
      ),
    );
  }

  // Dashboard Tab - Overview with stats, quick actions, recent orders, low stock
  Widget _buildDashboardTab() {
    return RefreshIndicator(
      key: _refreshKey,
      onRefresh: _loadDashboardData,
      backgroundColor: AppColors.neutralWhite,
      color: AppColors.primary600,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(
          left: UIConstants.paddingMedium,
          right: UIConstants.paddingMedium,
          top: UIConstants.paddingMedium,
          bottom: UIConstants.paddingLarge,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with greeting
            Padding(
              padding: const EdgeInsets.only(bottom: UIConstants.paddingLarge),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Dashboard',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          color: AppColors.neutral900,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: UIConstants.paddingSmall),
                  Text(
                    'Welcome back to your pharmacy',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                ],
              ),
            ),

            // Quick Actions Row (2x2 grid)
            _buildQuickActionsGrid(),
            const SizedBox(height: UIConstants.paddingLarge),

            // Stats Cards Row (2x2 grid)
            _buildStatsGrid(),
            const SizedBox(height: UIConstants.paddingLarge),

            // Recent Orders Section
            _buildRecentOrdersSection(),
            const SizedBox(height: UIConstants.paddingLarge),

            // Low Stock Alerts Section
            _buildLowStockSection(),
          ],
        ),
      ),
    );
  }

  // Quick Actions Grid
  Widget _buildQuickActionsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: UIConstants.paddingMedium,
      crossAxisSpacing: UIConstants.paddingMedium,
      children: [
        _buildQuickActionButton(
          icon: Icons.add_circle_outline,
          label: 'Add Product',
          onTap: () => context.push('/pharmacy/products/add'),
        ),
        _buildQuickActionButton(
          icon: Icons.receipt_outlined,
          label: 'View Orders',
          onTap: () => setState(() => _currentIndex = 1),
        ),
        _buildQuickActionButton(
          icon: Icons.message_outlined,
          label: 'Check Messages',
          onTap: () {},
        ),
        _buildQuickActionButton(
          icon: Icons.inventory_2_outlined,
          label: 'Manage Inventory',
          onTap: () => setState(() => _currentIndex = 2),
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return PharmaCard(
      onTap: onTap,
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(UIConstants.paddingMedium),
            decoration: BoxDecoration(
              color: AppColors.primary100,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
            ),
            child: Icon(
              icon,
              color: AppColors.primary600,
              size: UIConstants.iconSizeLarge,
            ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }

  // Stats Grid with trend indicators
  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: UIConstants.paddingMedium,
      crossAxisSpacing: UIConstants.paddingMedium,
      children: [
        StatsCard(
          title: 'Total Orders',
          value: _dashboardStats['totalOrders'].toString(),
          icon: Icons.receipt_outlined,
          iconColor: AppColors.primary600,
          trend: TrendDirection.up,
          trendValue: '+5.2%',
        ),
        StatsCard(
          title: 'Revenue',
          value: '\$${_dashboardStats['revenue'].toStringAsFixed(2)}',
          icon: Icons.trending_up_outlined,
          iconColor: AppColors.success,
          trend: TrendDirection.up,
          trendValue: '+12.5%',
        ),
        StatsCard(
          title: 'Products Listed',
          value: _dashboardStats['productsListed'].toString(),
          icon: Icons.inventory_2_outlined,
          iconColor: AppColors.secondary600,
          trend: TrendDirection.neutral,
          trendValue: '0%',
        ),
        StatsCard(
          title: 'Average Rating',
          value: _dashboardStats['averageRating'].toString(),
          icon: Icons.star_outlined,
          iconColor: AppColors.warning,
          trend: TrendDirection.up,
          trendValue: '+0.3%',
        ),
      ],
    );
  }

  // Recent Orders Section
  Widget _buildRecentOrdersSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Recent Orders',
          actionLabel: 'View All',
          onAction: () => setState(() => _currentIndex = 1),
          padding: EdgeInsets.zero,
        ),
        const SizedBox(height: UIConstants.paddingMedium),
        if (_isLoading)
          ShimmerLoading(
            variant: ShimmerVariant.card,
            itemCount: 3,
          )
        else if (_recentOrders.isEmpty)
          EmptyState(
            icon: Icons.receipt_outlined,
            title: 'No Orders Yet',
            subtitle: 'Orders from customers will appear here',
            actionLabel: 'Add Product',
            onAction: () {},
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _recentOrders.length,
            itemBuilder: (context, index) {
              final order = _recentOrders[index];
              return _buildOrderCard(order);
            },
          ),
      ],
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    return PharmaCard(
      margin: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row: Order ID and Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order['id'],
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.neutral900,
                            fontWeight: FontWeight.w600,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      order['customerName'],
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              _buildStatusBadge(order['status']),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Items and Total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Items',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      order['itemsSummary'],
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral900,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Total',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '\$${order['total'].toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppColors.neutral900,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Date and Action Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                order['date'],
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.paddingMedium,
                    vertical: UIConstants.paddingSmall,
                  ),
                ),
                child: Text(
                  'View Details',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.primary600,
                      ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'pending':
        bgColor = const Color(0xFFFEF3C7);
        textColor = const Color(0xFF92400E);
        icon = Icons.schedule_outlined;
        break;
      case 'processing':
        bgColor = const Color(0xFFDBEAFE);
        textColor = const Color(0xFF1E40AF);
        icon = Icons.autorenew_outlined;
        break;
      case 'ready':
        bgColor = const Color(0xFFD1FAE5);
        textColor = const Color(0xFF065F46);
        icon = Icons.check_circle_outline;
        break;
      case 'delivered':
        bgColor = AppColors.primary100;
        textColor = AppColors.primary700;
        icon = Icons.verified_outlined;
        break;
      case 'cancelled':
        bgColor = const Color(0xFFFEE2E2);
        textColor = const Color(0xFF991B1B);
        icon = Icons.cancel_outlined;
        break;
      default:
        bgColor = AppColors.neutral100;
        textColor = AppColors.neutral700;
        icon = Icons.info_outline;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingSmall,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(UIConstants.borderRadiusSmall),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            status.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: textColor,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }

  // Low Stock Alerts Section
  Widget _buildLowStockSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Low Stock Alerts',
          actionLabel: 'Manage All',
          onAction: () => setState(() => _currentIndex = 2),
          padding: EdgeInsets.zero,
        ),
        const SizedBox(height: UIConstants.paddingMedium),
        if (_lowStockProducts.isEmpty)
          EmptyState(
            icon: Icons.inventory_2_outlined,
            title: 'All Stock Levels Good',
            subtitle: 'No products are running low on inventory',
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _lowStockProducts.length,
            itemBuilder: (context, index) {
              final product = _lowStockProducts[index];
              return _buildLowStockCard(product);
            },
          ),
      ],
    );
  }

  Widget _buildLowStockCard(Map<String, dynamic> product) {
    final stockPercentage = (product['currentStock'] / product['minStock']) * 100;
    final isAlert = stockPercentage < 25;

    return PharmaCard(
      margin: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      border: Border.all(
        color: isAlert ? AppColors.warning : AppColors.neutral200,
        width: isAlert ? 1.5 : 1,
      ),
      child: Row(
        children: [
          // Warning Icon
          if (isAlert)
            Container(
              padding: const EdgeInsets.all(UIConstants.paddingSmall),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.1),
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
              child: Icon(
                Icons.warning_outlined,
                color: AppColors.warning,
                size: UIConstants.iconSizeMedium,
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(UIConstants.paddingSmall),
              decoration: BoxDecoration(
                color: AppColors.neutral200,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
              child: Icon(
                Icons.inventory_2_outlined,
                color: AppColors.neutral600,
                size: UIConstants.iconSizeMedium,
              ),
            ),
          const SizedBox(width: UIConstants.paddingMedium),

          // Product Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product['name'],
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppColors.neutral900,
                        fontWeight: FontWeight.w600,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Current: ${product['currentStock']} | Min: ${product['minStock']}',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.neutral600,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: UIConstants.paddingSmall),

          // Reorder Button
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingMedium,
                vertical: UIConstants.paddingSmall,
              ),
              backgroundColor: AppColors.primary600,
            ),
            child: Text(
              'Reorder',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.neutralWhite,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  // Orders Tab with filter tabs
  Widget _buildOrdersTab() {
    final filteredOrders = _selectedOrderFilter == 'all'
        ? _allOrders
        : _allOrders
            .where((o) => o['status'] == _selectedOrderFilter)
            .toList();

    return Column(
      children: [
        // Filter tabs
        Container(
          color: AppColors.neutralWhite,
          padding: const EdgeInsets.only(
            left: UIConstants.paddingMedium,
            right: UIConstants.paddingMedium,
            top: UIConstants.paddingMedium,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Orders',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: AppColors.neutral900,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: UIConstants.paddingMedium),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('All', 'all', _orderFilters['all'] ?? 0),
                    const SizedBox(width: UIConstants.paddingSmall),
                    _buildFilterChip(
                        'Pending', 'pending', _orderFilters['pending'] ?? 0),
                    const SizedBox(width: UIConstants.paddingSmall),
                    _buildFilterChip('Processing', 'processing',
                        _orderFilters['processing'] ?? 0),
                    const SizedBox(width: UIConstants.paddingSmall),
                    _buildFilterChip('Ready', 'ready', _orderFilters['ready'] ?? 0),
                    const SizedBox(width: UIConstants.paddingSmall),
                    _buildFilterChip('Delivered', 'delivered',
                        _orderFilters['delivered'] ?? 0),
                    const SizedBox(width: UIConstants.paddingSmall),
                    _buildFilterChip('Cancelled', 'cancelled',
                        _orderFilters['cancelled'] ?? 0),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: UIConstants.paddingMedium),

        // Orders list
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadDashboardData,
            backgroundColor: AppColors.neutralWhite,
            color: AppColors.primary600,
            child: _isLoading
                ? ShimmerLoading(
                    variant: ShimmerVariant.card,
                    itemCount: 5,
                  )
                : filteredOrders.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.5,
                            child: EmptyState(
                              icon: Icons.receipt_outlined,
                              title: 'No Orders',
                              subtitle:
                                  'No orders found in this category',
                              actionLabel: 'Add Product',
                              onAction: () {},
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(
                          horizontal: UIConstants.paddingMedium,
                        ),
                        itemCount: filteredOrders.length,
                        itemBuilder: (context, index) {
                          return _buildOrderCard(filteredOrders[index]);
                        },
                      ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value, int count) {
    final isSelected = _selectedOrderFilter == value;
    return FilterChip(
      label: Text('$label ($count)'),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _selectedOrderFilter = selected ? value : 'all');
      },
      backgroundColor: isSelected ? AppColors.primary100 : AppColors.neutral100,
      selectedColor: AppColors.primary100,
      labelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: isSelected ? AppColors.primary700 : AppColors.neutral700,
            fontWeight: FontWeight.w600,
          ),
      side: BorderSide(
        color: isSelected ? AppColors.primary600 : Colors.transparent,
        width: isSelected ? 1.5 : 0,
      ),
    );
  }

  // Products Tab
  Widget _buildProductsTab() {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      appBar: AppBar(
        title: const Text('Products'),
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              size: 64,
              color: AppColors.neutral400,
            ),
            const SizedBox(height: UIConstants.paddingLarge),
            Text(
              'No Products Yet',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: AppColors.neutral900,
                  ),
            ),
            const SizedBox(height: UIConstants.paddingSmall),
            Text(
              'Start adding products to your pharmacy',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.neutral600,
                  ),
            ),
            const SizedBox(height: UIConstants.paddingLarge),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add),
              label: const Text('Add Product'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingLarge,
                  vertical: UIConstants.paddingMedium,
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
    );
  }

  // Earnings Tab
  Widget _buildEarningsTab() {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      appBar: AppBar(
        title: const Text('Earnings'),
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Total Revenue Card
            PharmaCard(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Revenue',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                  const SizedBox(height: UIConstants.paddingSmall),
                  Text(
                    '\$${_dashboardStats['revenue'].toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                          color: AppColors.neutral900,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),
                  Container(
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary100,
                      borderRadius:
                          BorderRadius.circular(UIConstants.borderRadiusMedium),
                    ),
                    child: Center(
                      child: Text(
                        'Revenue Chart Placeholder',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neutral600,
                            ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: UIConstants.paddingLarge),

            // Payout Info
            SectionHeader(
              title: 'Payouts',
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            PharmaCard(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Available Balance',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neutral600,
                            ),
                      ),
                      Text(
                        '\$450.00',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppColors.primary600,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      minimumSize:
                          const Size.fromHeight(UIConstants.buttonHeightMedium),
                    ),
                    child: const Text('Request Payout'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: UIConstants.paddingLarge),

            // Subscription Info
            SectionHeader(
              title: 'Subscription',
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            PharmaCard(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
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
                            'Premium Plan',
                            style:
                                Theme.of(context).textTheme.titleSmall?.copyWith(
                                      color: AppColors.neutral900,
                                      fontWeight: FontWeight.w600,
                                    ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Renews on 2026-05-16',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.neutral600,
                                ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: UIConstants.paddingSmall,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary100,
                          borderRadius: BorderRadius.circular(
                            UIConstants.borderRadiusSmall,
                          ),
                        ),
                        child: Text(
                          'Active',
                          style:
                              Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: AppColors.primary700,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // More Tab
  Widget _buildMoreTab() {
    final authProvider = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(
          left: UIConstants.paddingMedium,
          right: UIConstants.paddingMedium,
          top: UIConstants.paddingMedium,
          bottom: UIConstants.paddingLarge,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Header
            Text(
              'More',
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: AppColors.neutral900,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: UIConstants.paddingLarge),

            // Profile Card
            PharmaCard(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.primary100,
                      borderRadius:
                          BorderRadius.circular(UIConstants.borderRadiusMedium),
                    ),
                    child: Icon(
                      Icons.business,
                      size: UIConstants.iconSizeLarge,
                      color: AppColors.primary600,
                    ),
                  ),
                  const SizedBox(width: UIConstants.paddingMedium),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authProvider.user?.displayName ?? 'Pharmacy Name',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                color: AppColors.neutral900,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          authProvider.user?.email ?? '',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.neutral600,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: AppColors.neutral400,
                  ),
                ],
              ),
              onTap: () {},
            ),
            const SizedBox(height: UIConstants.paddingLarge),

            // Menu Items
            _buildMenuSection('Account', [
              _buildMenuItem(
                'Profile',
                Icons.person_outline,
                () {},
              ),
              _buildMenuItem(
                'Approval Status',
                Icons.verified_outlined,
                () => context.push('/pharmacy/approval'),
              ),
              _buildMenuItem(
                'Documents',
                Icons.document_scanner_outlined,
                () => context.push('/pharmacy/approval'),
              ),
            ]),
            const SizedBox(height: UIConstants.paddingLarge),

            _buildMenuSection('Business', [
              _buildMenuItem(
                'Products',
                Icons.inventory_2_outlined,
                () => context.push('/pharmacy/products'),
              ),
              _buildMenuItem(
                'Orders',
                Icons.receipt_outlined,
                () => context.push('/pharmacy/orders'),
              ),
              _buildMenuItem(
                'Messages',
                Icons.message_outlined,
                () {},
              ),
              _buildMenuItem(
                'Subscription',
                Icons.card_membership_outlined,
                () {},
              ),
            ]),
            const SizedBox(height: UIConstants.paddingLarge),

            // Sign Out Button
            ElevatedButton.icon(
              onPressed: () async {
                await authProvider.logout();
                if (mounted) {
                  context.go('/login');
                }
              },
              icon: const Icon(Icons.logout),
              label: const Text('Sign Out'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                minimumSize:
                    const Size.fromHeight(UIConstants.buttonHeightMedium),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: AppColors.neutral600,
              ),
        ),
        const SizedBox(height: UIConstants.paddingSmall),
        ...items,
      ],
    );
  }

  Widget _buildMenuItem(String label, IconData icon, VoidCallback onTap) {
    return PharmaCard(
      margin: const EdgeInsets.only(bottom: UIConstants.paddingSmall),
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingMedium,
        vertical: UIConstants.paddingMedium,
      ),
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: AppColors.neutral600,
                size: UIConstants.iconSizeMedium,
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutral900,
                    ),
              ),
            ],
          ),
          const Icon(
            Icons.arrow_forward_ios,
            size: 14,
            color: AppColors.neutral400,
          ),
        ],
      ),
    );
  }
}
