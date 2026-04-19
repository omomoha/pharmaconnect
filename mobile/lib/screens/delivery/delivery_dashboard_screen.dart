import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/delivery_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';
import 'package:provider/provider.dart';

class DeliveryDashboardScreen extends StatefulWidget {
  const DeliveryDashboardScreen({Key? key}) : super(key: key);

  @override
  State<DeliveryDashboardScreen> createState() =>
      _DeliveryDashboardScreenState();
}

class _DeliveryDashboardScreenState extends State<DeliveryDashboardScreen> {
  int _currentIndex = 0;
  bool _isOnline = false;
  bool _isLoading = false;
  late RefreshController _refreshController;

  @override
  void initState() {
    super.initState();
    _refreshController = RefreshController(initialRefresh: false);
  }

  @override
  void dispose() {
    _refreshController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    try {
      final apiService = ApiService();
      final deliveryService = DeliveryService(apiService: apiService);

      // Refresh deliveries data
      await deliveryService.getMyDeliveries();
      await deliveryService.getAvailableOrders();

      if (mounted) {
        setState(() {});
        _refreshController.refreshCompleted();
      }
    } catch (e) {
      if (mounted) {
        _refreshController.refreshFailed();
      }
    }
  }

  Future<void> _toggleOnlineStatus() async {
    setState(() => _isLoading = true);
    try {
      // Update availability status via API
      final newStatus = _isOnline ? 'offline' : 'online';
      // Note: This endpoint may need to be added to backend if not present
      // For now, optimistic update
      setState(() => _isOnline = !_isOnline);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to $newStatus'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating status: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: [
            _buildDashboardTab(),
            _buildAvailableTab(),
            _buildActiveTab(),
            _buildEarningsTab(),
            _buildProfileTab(),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.neutralWhite,
        selectedItemColor: AppColors.primary600,
        unselectedItemColor: AppColors.neutral500,
        elevation: 8,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_outlined),
            activeIcon: Icon(Icons.list),
            label: 'Available',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_outlined),
            activeIcon: Icon(Icons.local_shipping),
            label: 'Active',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.trending_up_outlined),
            activeIcon: Icon(Icons.trending_up),
            label: 'Earnings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outlined),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  // ============ DASHBOARD TAB (Overview) ============
  Widget _buildDashboardTab() {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with online toggle
            Container(
              color: AppColors.neutralWhite,
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: UIConstants.paddingSmall),
                  Text(
                    'Delivery Dashboard',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.neutral900,
                        ),
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),
                  // Online/Offline Toggle
                  _buildOnlineToggle(),
                ],
              ),
            ),
            const SizedBox(height: UIConstants.paddingSmall),

            // Earnings Summary Cards
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingMedium,
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: StatsCard(
                          title: "Today's Earnings",
                          value: '₦8,500',
                          icon: Icons.wallet,
                          iconColor: AppColors.primary600,
                          trend: TrendDirection.up,
                          trendValue: '+2 deliveries',
                        ),
                      ),
                      const SizedBox(width: UIConstants.paddingSmall),
                      Expanded(
                        child: StatsCard(
                          title: 'Weekly Earnings',
                          value: '₦42,300',
                          icon: Icons.calendar_today,
                          iconColor: AppColors.success,
                          trend: TrendDirection.up,
                          trendValue: '+12 deliveries',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.paddingSmall),
                  Row(
                    children: [
                      Expanded(
                        child: StatsCard(
                          title: 'Total Deliveries',
                          value: '342',
                          icon: Icons.local_shipping,
                          iconColor: AppColors.warning,
                          trend: TrendDirection.up,
                          trendValue: '+8 this week',
                        ),
                      ),
                      const SizedBox(width: UIConstants.paddingSmall),
                      Expanded(
                        child: StatsCard(
                          title: 'Rating',
                          value: '4.8',
                          icon: Icons.star,
                          iconColor: Colors.amber,
                          subtitle: '342 reviews',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: UIConstants.paddingLarge),

            // Active Deliveries Section
            SectionHeader(
              title: 'Active Deliveries',
              actionLabel: 'View All',
              onAction: () => setState(() => _currentIndex = 2),
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingMedium,
              ),
            ),
            const SizedBox(height: UIConstants.paddingSmall),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingMedium,
              ),
              child: _buildActiveDeliveriesSection(),
            ),
            const SizedBox(height: UIConstants.paddingLarge),

            // Available Orders Section
            SectionHeader(
              title: 'Available Orders',
              actionLabel: 'View All',
              onAction: () => setState(() => _currentIndex = 1),
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingMedium,
              ),
            ),
            const SizedBox(height: UIConstants.paddingSmall),
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingMedium,
              ),
              child: _buildAvailableOrdersSection(),
            ),
            const SizedBox(height: UIConstants.paddingLarge),
          ],
        ),
      ),
    );
  }

  Widget _buildOnlineToggle() {
    return PharmaCard(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      color: _isOnline
          ? AppColors.success.withOpacity(0.05)
          : AppColors.neutral100,
      border: Border.all(
        color:
            _isOnline ? AppColors.success.withOpacity(0.2) : AppColors.neutral200,
        width: 1,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Availability Status',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.neutral900,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                _isOnline ? 'You are online' : 'You are offline',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: _isOnline ? AppColors.success : AppColors.neutral600,
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
          Switch(
            value: _isOnline,
            onChanged: _isLoading ? null : (_) => _toggleOnlineStatus(),
            activeColor: AppColors.primary600,
            inactiveThumbColor: AppColors.neutral400,
            inactiveTrackColor: AppColors.neutral300,
          ),
        ],
      ),
    );
  }

  Widget _buildActiveDeliveriesSection() {
    final sampleDeliveries = [
      {
        'id': '1',
        'customer': 'John Doe',
        'pharmacy': 'HealthPlus Pharmacy',
        'pickupAddress': '123 Main St, Lagos',
        'deliveryAddress': '456 Oak Ave, Lagos',
        'status': 'In Transit',
        'step': 2,
        'eta': '15 min',
      },
      {
        'id': '2',
        'customer': 'Jane Smith',
        'pharmacy': 'MediCare Pharmacy',
        'pickupAddress': '789 Elm St, Lagos',
        'deliveryAddress': '321 Pine Rd, Lagos',
        'status': 'Picked Up',
        'step': 1,
        'eta': '22 min',
      },
    ];

    if (sampleDeliveries.isEmpty) {
      return EmptyState(
        icon: Icons.local_shipping_outlined,
        title: 'No Active Deliveries',
        subtitle: 'Accept orders from available to start earning',
        iconColor: AppColors.neutral300,
        iconSize: 60,
      );
    }

    return Column(
      children: sampleDeliveries.map((delivery) {
        return _buildActiveDeliveryCard(delivery);
      }).toList(),
    );
  }

  Widget _buildActiveDeliveryCard(Map<String, dynamic> delivery) {
    final steps = ['Accepted', 'Picked Up', 'Delivering', 'Completed'];
    final currentStep = delivery['step'] as int;

    return PharmaCard(
      margin: const EdgeInsets.only(bottom: UIConstants.paddingSmall),
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    delivery['customer'],
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.neutral900,
                        ),
                  ),
                  Text(
                    delivery['pharmacy'],
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
                  color: _getStatusColor(delivery['status']).withOpacity(0.1),
                  borderRadius:
                      BorderRadius.circular(UIConstants.borderRadiusSmall),
                ),
                child: Text(
                  delivery['status'],
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: _getStatusColor(delivery['status']),
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Step Indicator
          _buildStepIndicator(steps, currentStep),
          const SizedBox(height: UIConstants.paddingMedium),

          // Addresses
          _buildAddressRow(
            'Pickup',
            delivery['pickupAddress'],
            Icons.location_on_outlined,
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          _buildAddressRow(
            'Delivery',
            delivery['deliveryAddress'],
            Icons.pin_drop_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Map placeholder
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: AppColors.neutral100,
              borderRadius: BorderRadius.circular(UIConstants.borderRadiusMedium),
            ),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.map_outlined,
                    color: AppColors.neutral400,
                    size: 32,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Map Preview',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.neutral500,
                        ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: PharmaButton(
                  label: _getActionButtonLabel(delivery['status']),
                  onPressed: () {},
                  variant: ButtonVariant.primary,
                  size: ButtonSize.small,
                ),
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Expanded(
                child: PharmaButton(
                  label: 'Details',
                  onPressed: () {},
                  variant: ButtonVariant.secondary,
                  size: ButtonSize.small,
                ),
              ),
            ],
          ),

          // ETA
          const SizedBox(height: UIConstants.paddingSmall),
          Text(
            'ETA: ${delivery['eta']}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.primary600,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(List<String> steps, int currentStep) {
    return SizedBox(
      height: 40,
      child: Row(
        children: List.generate(steps.length, (index) {
          final isDone = index < currentStep;
          final isCurrent = index == currentStep;

          return Expanded(
            child: Row(
              children: [
                // Circle
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDone || isCurrent
                        ? AppColors.primary600
                        : AppColors.neutral200,
                  ),
                  child: Center(
                    child: isDone
                        ? Icon(Icons.check,
                            color: AppColors.neutralWhite, size: 16)
                        : Text(
                            '${index + 1}',
                            style: TextStyle(
                              color: AppColors.neutralWhite,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                  ),
                ),
                // Line
                if (index < steps.length - 1)
                  Expanded(
                    child: Container(
                      height: 2,
                      color: isDone ? AppColors.primary600 : AppColors.neutral200,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildAddressRow(String label, String address, IconData icon) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.primary600, size: 18),
        const SizedBox(width: UIConstants.paddingSmall),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                      fontWeight: FontWeight.w500,
                    ),
              ),
              Text(
                address,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral900,
                    ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getActionButtonLabel(String status) {
    switch (status) {
      case 'In Transit':
        return 'Deliver';
      case 'Picked Up':
        return 'In Transit';
      default:
        return 'Pick Up';
    }
  }

  Widget _buildAvailableOrdersSection() {
    final sampleOrders = [
      {
        'id': '1',
        'pharmacy': 'HealthPlus Pharmacy',
        'address': 'Ikoyi, Lagos',
        'distance': '3.2 km',
        'payout': '₦1,200',
      },
      {
        'id': '2',
        'pharmacy': 'MediCare Pharmacy',
        'address': 'Victoria Island, Lagos',
        'distance': '4.8 km',
        'payout': '₦1,800',
      },
    ];

    if (sampleOrders.isEmpty) {
      return EmptyState(
        icon: Icons.inbox_outlined,
        title: 'No Available Orders',
        subtitle: 'Check back soon or increase your service radius',
        iconColor: AppColors.neutral300,
        iconSize: 60,
      );
    }

    return Column(
      children: sampleOrders.map((order) {
        return _buildAvailableOrderCard(order);
      }).toList(),
    );
  }

  Widget _buildAvailableOrderCard(Map<String, dynamic> order) {
    return PharmaCard(
      margin: const EdgeInsets.only(bottom: UIConstants.paddingSmall),
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      onTap: () {},
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order['pharmacy'],
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral900,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 14, color: AppColors.neutral600),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            order['address'],
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: AppColors.neutral600,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingSmall,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary100,
                  borderRadius:
                      BorderRadius.circular(UIConstants.borderRadiusSmall),
                ),
                child: Text(
                  order['distance'],
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.primary600,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Est. Payout',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
              Text(
                order['payout'],
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary600,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ============ AVAILABLE ORDERS TAB ============
  Widget _buildAvailableTab() {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: UIConstants.paddingSmall),
            SectionHeader(
              title: 'Available Orders',
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            _buildAvailableOrdersSection(),
          ],
        ),
      ),
    );
  }

  // ============ ACTIVE DELIVERIES TAB ============
  Widget _buildActiveTab() {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: UIConstants.paddingSmall),
            SectionHeader(
              title: 'Active Deliveries',
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            _buildActiveDeliveriesSection(),
          ],
        ),
      ),
    );
  }

  // ============ EARNINGS TAB ============
  Widget _buildEarningsTab() {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: UIConstants.paddingSmall),
            SectionHeader(
              title: 'Earnings',
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            Row(
              children: [
                Expanded(
                  child: StatsCard(
                    title: 'Total Earnings',
                    value: '₦156,800',
                    icon: Icons.wallet,
                    iconColor: AppColors.primary600,
                    trend: TrendDirection.up,
                    trendValue: '+₦8,500 today',
                  ),
                ),
                const SizedBox(width: UIConstants.paddingSmall),
                Expanded(
                  child: StatsCard(
                    title: 'Pending Payout',
                    value: '₦42,300',
                    icon: Icons.schedule,
                    iconColor: AppColors.warning,
                    subtitle: 'Next Friday',
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.paddingLarge),
            SectionHeader(
              title: 'Recent Deliveries',
              padding: EdgeInsets.zero,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            _buildEarningsHistory(),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningsHistory() {
    final deliveries = [
      {
        'customer': 'John Doe',
        'amount': '₦1,200',
        'date': '15 Apr, 2:30 PM',
      },
      {
        'customer': 'Jane Smith',
        'amount': '₦1,500',
        'date': '15 Apr, 1:15 PM',
      },
      {
        'customer': 'Mike Johnson',
        'amount': '₦1,800',
        'date': '14 Apr, 5:45 PM',
      },
    ];

    return Column(
      children: deliveries.map((delivery) {
        return PharmaCard(
          margin: const EdgeInsets.only(bottom: UIConstants.paddingSmall),
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      delivery['customer']!,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral900,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      delivery['date']!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                  ],
                ),
              ),
              Text(
                delivery['amount']!,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.success,
                    ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  // ============ PROFILE TAB ============
  Widget _buildProfileTab() {
    final authProvider = context.watch<AuthProvider>();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: UIConstants.paddingSmall),
          // Profile Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(UIConstants.paddingLarge),
            decoration: BoxDecoration(
              color: AppColors.primary100,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusLarge),
            ),
            child: Center(
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary600,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.delivery_dining,
                      size: 40,
                      color: AppColors.neutralWhite,
                    ),
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),
                  Text(
                    authProvider.user?.displayName ?? 'Delivery Provider',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.neutral900,
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
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Profile Menu Items
          SectionHeader(
            title: 'Account',
            padding: EdgeInsets.zero,
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          _buildProfileMenuItem(
            icon: Icons.person_outline,
            title: 'Profile Information',
            onTap: () {},
          ),
          _buildProfileMenuItem(
            icon: Icons.app_registration_outlined,
            title: 'Registration',
            onTap: () => context.push('/delivery/register'),
          ),
          _buildProfileMenuItem(
            icon: Icons.assignment_outlined,
            title: 'Assignments',
            onTap: () => context.push('/delivery/assignments'),
          ),
          _buildProfileMenuItem(
            icon: Icons.directions_car_outlined,
            title: 'Vehicle Information',
            onTap: () {},
          ),
          _buildProfileMenuItem(
            icon: Icons.description_outlined,
            title: 'Documents',
            onTap: () => context.push('/delivery/register'),
          ),
          _buildProfileMenuItem(
            icon: Icons.account_balance_wallet_outlined,
            title: 'Earnings',
            onTap: () => context.push('/delivery/earnings'),
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          SectionHeader(
            title: 'Settings',
            padding: EdgeInsets.zero,
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          _buildProfileMenuItem(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            onTap: () {},
          ),
          _buildProfileMenuItem(
            icon: Icons.security_outlined,
            title: 'Security',
            onTap: () {},
          ),
          _buildProfileMenuItem(
            icon: Icons.help_outline,
            title: 'Help & Support',
            onTap: () {},
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Sign Out Button
          PharmaButton(
            label: 'Sign Out',
            onPressed: () async {
              await authProvider.logout();
              if (mounted) {
                context.go('/login');
              }
            },
            variant: ButtonVariant.danger,
            size: ButtonSize.large,
            fullWidth: true,
          ),
        ],
      ),
    );
  }

  Widget _buildProfileMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
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
              Icon(icon, color: AppColors.primary600, size: 24),
              const SizedBox(width: UIConstants.paddingMedium),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                      color: AppColors.neutral900,
                    ),
              ),
            ],
          ),
          Icon(Icons.arrow_forward,
              color: AppColors.neutral400, size: 20),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'In Transit':
        return AppColors.primary600;
      case 'Picked Up':
        return AppColors.warning;
      default:
        return AppColors.neutral500;
    }
  }
}

class RefreshController {
  // ignore: unused_field
  bool isRefreshing = false;

  RefreshController({bool initialRefresh = false});

  void refreshCompleted() {
    isRefreshing = false;
  }

  void refreshFailed() {
    isRefreshing = false;
  }

  void dispose() {
    // Cleanup if needed
  }
}
