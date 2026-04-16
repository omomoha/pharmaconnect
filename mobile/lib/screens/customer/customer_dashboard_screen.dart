import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/conversation_model.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/chat_service.dart';
import 'package:pharmaconnect/services/notification_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class CustomerDashboardScreen extends StatefulWidget {
  const CustomerDashboardScreen({Key? key}) : super(key: key);

  @override
  State<CustomerDashboardScreen> createState() =>
      _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> {
  int _currentIndex = 0;
  late ApiService _apiService;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildHomeTab(),
          _buildPharmaciesTab(),
          _buildOrdersTab(),
          _buildMessagesTab(),
          _buildProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_pharmacy_outlined),
            activeIcon: Icon(Icons.local_pharmacy),
            label: 'Pharmacies',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_outlined),
            activeIcon: Icon(Icons.receipt),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.message_outlined),
            activeIcon: Icon(Icons.message),
            label: 'Messages',
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

  // ============================================
  // HOME TAB - Dashboard Overview
  // ============================================
  Widget _buildHomeTab() {
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {});
        await Future.delayed(const Duration(milliseconds: 500));
      },
      child: CustomScrollView(
        slivers: [
          // App Bar with Status
          SliverAppBar(
            floating: true,
            elevation: 0,
            backgroundColor: AppColors.neutralWhite,
            title: const Text('PharmaConnect'),
            titleTextStyle: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w700,
                ),
          ),
          // Main Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Welcome message with user name
                  Consumer<AuthProvider>(
                    builder: (context, authProvider, _) {
                      final userName =
                          authProvider.user?.displayName ?? 'Customer';
                      return Text(
                        'Welcome back, $userName!',
                        style: Theme.of(context).textTheme.headlineMedium,
                      );
                    },
                  ),
                  const SizedBox(height: UIConstants.paddingLarge),

                  // AI Search Bar
                  _buildSearchBar(),
                  const SizedBox(height: UIConstants.paddingLarge),

                  // Stats Cards Row
                  _buildStatsCards(),
                  const SizedBox(height: UIConstants.paddingLarge),

                  // Recent Orders Section
                  _buildRecentOrders(),
                  const SizedBox(height: UIConstants.paddingLarge),

                  // Nearby Pharmacies Section
                  _buildNearbyPharmacies(),
                  const SizedBox(height: UIConstants.paddingLarge),

                  // AI Recommendations Section
                  _buildAiRecommendations(),
                  const SizedBox(height: UIConstants.paddingMedium),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return PharmaSearchBar(
      hint: 'Search for medicines, pharmacies...',
      onSubmitted: () {
        // Navigate to search/pharmacies tab
        setState(() => _currentIndex = 1);
      },
      onChanged: (value) {
        // Could implement real-time search suggestions
      },
    );
  }

  Widget _buildStatsCards() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildStatCard(
            title: 'Active Orders',
            value: '2',
            icon: Icons.shopping_bag_outlined,
            iconColor: AppColors.primary600,
          ),
          const SizedBox(width: UIConstants.paddingMedium),
          _buildStatCard(
            title: 'Saved Pharmacies',
            value: '5',
            icon: Icons.favorite_outline,
            iconColor: AppColors.error,
          ),
          const SizedBox(width: UIConstants.paddingMedium),
          _buildStatCard(
            title: 'Drug Checker',
            value: '3',
            icon: Icons.health_and_safety_outlined,
            iconColor: AppColors.info,
          ),
          const SizedBox(width: UIConstants.paddingMedium),
          _buildStatCard(
            title: 'Messages',
            value: '1',
            icon: Icons.message_outlined,
            iconColor: AppColors.secondary600,
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
  }) {
    return SizedBox(
      width: 140,
      child: StatsCard(
        title: title,
        value: value,
        icon: icon,
        iconColor: iconColor,
      ),
    );
  }

  Widget _buildRecentOrders() {
    return FutureBuilder<dynamic>(
      future: _apiService.get('/customer/orders?limit=3'),
      builder: (context, snapshot) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Recent Orders',
              actionLabel: 'View All',
              onAction: () => setState(() => _currentIndex = 2),
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            if (snapshot.connectionState == ConnectionState.waiting)
              ShimmerLoading(
                variant: ShimmerVariant.card,
              )
            else if (snapshot.hasError)
              AppErrorWidget(
                message: 'Failed to load orders',
                onRetry: () => setState(() {}),
              )
            else if (!snapshot.hasData || snapshot.data == null)
              EmptyState(
                icon: Icons.receipt_outlined,
                title: 'No Orders Yet',
                subtitle: 'Start browsing pharmacies to place your first order',
                actionLabel: 'Browse Pharmacies',
                onAction: () => setState(() => _currentIndex = 1),
              )
            else
              _buildOrdersList(snapshot.data),
          ],
        );
      },
    );
  }

  Widget _buildOrdersList(dynamic ordersData) {
    final orders = ordersData is Map && ordersData.containsKey('data')
        ? ordersData['data'] as List? ?? []
        : ordersData is List
            ? ordersData
            : [];

    if (orders.isEmpty) {
      return EmptyState(
        icon: Icons.receipt_outlined,
        title: 'No Orders Yet',
        subtitle: 'Start browsing pharmacies to place your first order',
        actionLabel: 'Browse Pharmacies',
        onAction: () => setState(() => _currentIndex = 1),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: orders.length,
      separatorBuilder: (_, __) => const SizedBox(height: UIConstants.paddingMedium),
      itemBuilder: (context, index) {
        final order = orders[index];
        return _buildOrderCard(order);
      },
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final orderId = order is Map ? order['id'] ?? 'N/A' : 'N/A';
    final pharmacyName = order is Map ? (order['pharmacy'] is Map ? order['pharmacy']['name'] ?? 'Unknown' : 'Unknown') : 'Unknown';
    final status = order is Map ? order['status'] ?? 'pending' : 'pending';
    final total = order is Map ? order['total'] ?? 0 : 0;
    final createdAt = order is Map ? order['createdAt'] ?? '' : '';

    return PharmaCard(
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
                    'Order #${orderId.toString().length >= 8 ? orderId.toString().substring(0, 8).toUpperCase() : orderId.toString().toUpperCase()}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    pharmacyName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral600,
                        ),
                  ),
                ],
              ),
              _buildStatusBadge(status),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'NGN ${total.toString()}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.primary600,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              Text(
                createdAt.toString().split(' ').first,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor = AppColors.primary100;
    Color textColor = AppColors.primary700;
    String displayStatus = 'Pending';

    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        bgColor = AppColors.successLight;
        textColor = AppColors.success;
        displayStatus = 'Delivered';
        break;
      case 'cancelled':
        bgColor = AppColors.errorLight;
        textColor = AppColors.error;
        displayStatus = 'Cancelled';
        break;
      case 'processing':
        bgColor = AppColors.warningLight;
        textColor = AppColors.warning;
        displayStatus = 'Processing';
        break;
      default:
        bgColor = AppColors.primary100;
        textColor = AppColors.primary700;
        displayStatus = 'Pending';
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
      child: Text(
        displayStatus,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: textColor,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }

  Widget _buildNearbyPharmacies() {
    return FutureBuilder<dynamic>(
      future: _apiService.get('/pharmacies/nearby?limit=5'),
      builder: (context, snapshot) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Nearby Pharmacies',
              actionLabel: 'View All',
              onAction: () => setState(() => _currentIndex = 1),
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            if (snapshot.connectionState == ConnectionState.waiting)
              ShimmerLoading(
                variant: ShimmerVariant.card,
              )
            else if (snapshot.hasError)
              AppErrorWidget(
                message: 'Failed to load pharmacies',
                onRetry: () => setState(() {}),
              )
            else if (!snapshot.hasData || snapshot.data == null)
              _buildEmptyPharmaciesState()
            else
              _buildPharmaciesList(snapshot.data),
          ],
        );
      },
    );
  }

  Widget _buildEmptyPharmaciesState() {
    return SizedBox(
      height: 180,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_off_outlined,
              size: 48,
              color: AppColors.neutral300,
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            Text(
              'No pharmacies nearby',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.neutral600,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPharmaciesList(dynamic pharmaciesData) {
    final pharmacies = pharmaciesData is Map && pharmaciesData.containsKey('data')
        ? pharmaciesData['data'] as List? ?? []
        : pharmaciesData is List
            ? pharmaciesData
            : [];

    if (pharmacies.isEmpty) {
      return _buildEmptyPharmaciesState();
    }

    return SizedBox(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: pharmacies.length,
        itemBuilder: (context, index) {
          final pharmacy = pharmacies[index];
          return _buildPharmacyCard(pharmacy);
        },
      ),
    );
  }

  Widget _buildPharmacyCard(dynamic pharmacy) {
    final name = pharmacy is Map ? pharmacy['name'] ?? 'Unknown' : 'Unknown';
    final rating = pharmacy is Map ? pharmacy['rating'] ?? 4.5 : 4.5;
    final distance =
        pharmacy is Map ? pharmacy['distance'] ?? '0.5' : '0.5';

    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: UIConstants.paddingMedium),
      child: PharmaCard(
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Pharmacy image placeholder
            Container(
              width: double.infinity,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary100,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusMedium),
              ),
              child: const Icon(
                Icons.local_pharmacy,
                color: AppColors.primary600,
                size: 32,
              ),
            ),
            const SizedBox(height: UIConstants.paddingSmall),
            // Pharmacy name
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            // Rating and distance
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.star,
                      size: 14,
                      color: Colors.amber,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      rating.toString(),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                Text(
                  '${distance}km',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.neutral600,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAiRecommendations() {
    return FutureBuilder<dynamic>(
      future: _apiService.get('/products/recommendations?limit=4'),
      builder: (context, snapshot) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'AI Recommendations',
              actionLabel: 'More',
              onAction: () => setState(() => _currentIndex = 1),
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            if (snapshot.connectionState == ConnectionState.waiting)
              ShimmerLoading(
                variant: ShimmerVariant.grid,
                itemCount: 4,
              )
            else if (snapshot.hasError)
              AppErrorWidget(
                message: 'Failed to load recommendations',
                onRetry: () => setState(() {}),
              )
            else if (!snapshot.hasData || snapshot.data == null)
              _buildEmptyRecommendationsState()
            else
              _buildRecommendationsList(snapshot.data),
          ],
        );
      },
    );
  }

  Widget _buildEmptyRecommendationsState() {
    return SizedBox(
      height: 150,
      child: Center(
        child: Text(
          'No recommendations at this time',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.neutral600,
              ),
        ),
      ),
    );
  }

  Widget _buildRecommendationsList(dynamic recommendationsData) {
    final recommendations =
        recommendationsData is Map && recommendationsData.containsKey('data')
            ? recommendationsData['data'] as List? ?? []
            : recommendationsData is List
                ? recommendationsData
                : [];

    if (recommendations.isEmpty) {
      return _buildEmptyRecommendationsState();
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: UIConstants.paddingMedium,
        mainAxisSpacing: UIConstants.paddingMedium,
        childAspectRatio: 0.75,
      ),
      itemCount: recommendations.length,
      itemBuilder: (context, index) {
        final product = recommendations[index];
        return _buildProductCard(product);
      },
    );
  }

  Widget _buildProductCard(dynamic product) {
    final name = product is Map ? product['name'] ?? 'Product' : 'Product';
    final price = product is Map ? product['price'] ?? 0 : 0;

    return PharmaCard(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product image placeholder
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.secondary100,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusMedium),
              ),
              child: const Icon(
                Icons.medication_outlined,
                color: AppColors.secondary600,
                size: 32,
              ),
            ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          // Product name
          Text(
            name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          // Product price
          Text(
            'NGN $price',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.primary600,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }

  // ============================================
  // PHARMACIES TAB - Browse Nearby Pharmacies
  // ============================================
  Widget _buildPharmaciesTab() {
    return RefreshIndicator(
      onRefresh: () async {
        await Future.delayed(const Duration(milliseconds: 500));
      },
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            elevation: 0,
            backgroundColor: AppColors.neutralWhite,
            title: const Text('Pharmacies'),
            titleTextStyle: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w700,
                ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: PharmaSearchBar(
                hint: 'Search pharmacies...',
                onSubmitted: () {},
              ),
            ),
          ),
          SliverFillRemaining(
            child: FutureBuilder<dynamic>(
              future: _apiService.get('/pharmacies/nearby'),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return ShimmerLoading(
                    variant: ShimmerVariant.list,
                    itemCount: 5,
                  );
                }

                if (snapshot.hasError) {
                  return AppErrorWidget(
                    message: 'Failed to load pharmacies',
                    onRetry: () => setState(() {}),
                  );
                }

                final pharmacies = snapshot.data is Map &&
                        snapshot.data.containsKey('data')
                    ? snapshot.data['data'] as List? ?? []
                    : snapshot.data is List
                        ? snapshot.data
                        : [];

                if (pharmacies.isEmpty) {
                  return Center(
                    child: EmptyState(
                      icon: Icons.location_off_outlined,
                      title: 'No Pharmacies Found',
                      subtitle: 'Try adjusting your search or location',
                    ),
                  );
                }

                return SingleChildScrollView(
                  padding:
                      const EdgeInsets.all(UIConstants.paddingMedium),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: pharmacies.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: UIConstants.paddingMedium),
                    itemBuilder: (context, index) {
                      final pharmacy = pharmacies[index];
                      return _buildPharmacyListItem(pharmacy);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPharmacyListItem(dynamic pharmacy) {
    final name = pharmacy is Map ? pharmacy['name'] ?? 'Unknown' : 'Unknown';
    final rating = pharmacy is Map ? pharmacy['rating'] ?? 4.5 : 4.5;
    final distance =
        pharmacy is Map ? pharmacy['distance'] ?? '0.5' : '0.5';
    final reviewCount =
        pharmacy is Map ? pharmacy['reviewCount'] ?? 0 : 0;

    return PharmaCard(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary100,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
            ),
            child: const Icon(
              Icons.local_pharmacy,
              color: AppColors.primary600,
              size: 32,
            ),
          ),
          const SizedBox(width: UIConstants.paddingMedium),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.star, size: 14, color: Colors.amber),
                    const SizedBox(width: 4),
                    Text(
                      '$rating ($reviewCount)',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 12,
                      color: AppColors.neutral600,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${distance}km away',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ============================================
  // ORDERS TAB - Order History with Filters
  // ============================================
  Widget _buildOrdersTab() {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: AppColors.neutralWhite,
        appBar: AppBar(
          elevation: 0,
          backgroundColor: AppColors.neutralWhite,
          title: const Text('Orders'),
          titleTextStyle: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w700,
              ),
          bottom: TabBar(
            labelColor: AppColors.primary600,
            unselectedLabelColor: AppColors.neutral600,
            indicatorColor: AppColors.primary600,
            tabs: const [
              Tab(text: 'All'),
              Tab(text: 'Active'),
              Tab(text: 'Completed'),
              Tab(text: 'Cancelled'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOrdersTabContent('all'),
            _buildOrdersTabContent('active'),
            _buildOrdersTabContent('completed'),
            _buildOrdersTabContent('cancelled'),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersTabContent(String status) {
    final queryStatus = status == 'all' ? '' : '&status=$status';
    return RefreshIndicator(
      onRefresh: () async {
        await Future.delayed(const Duration(milliseconds: 500));
      },
      child: FutureBuilder<dynamic>(
        future: _apiService.get('/customer/orders?limit=50$queryStatus'),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return ShimmerLoading(
              variant: ShimmerVariant.list,
              itemCount: 5,
            );
          }

          if (snapshot.hasError) {
            return AppErrorWidget(
              message: 'Failed to load orders',
              onRetry: () => setState(() {}),
            );
          }

          final orders = snapshot.data is Map && snapshot.data.containsKey('data')
              ? snapshot.data['data'] as List? ?? []
              : snapshot.data is List
                  ? snapshot.data
                  : [];

          if (orders.isEmpty) {
            return SingleChildScrollView(
              child: SizedBox(
                height: MediaQuery.of(context).size.height * 0.6,
                child: Center(
                  child: EmptyState(
                    icon: Icons.receipt_outlined,
                    title: 'No Orders',
                    subtitle: 'You have no $status orders yet',
                    actionLabel: 'Browse Pharmacies',
                    onAction: () => setState(() => _currentIndex = 1),
                  ),
                ),
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(UIConstants.paddingMedium),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: orders.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: UIConstants.paddingMedium),
              itemBuilder: (context, index) {
                return _buildOrderCard(orders[index]);
              },
            ),
          );
        },
      ),
    );
  }

  // ============================================
  // MESSAGES TAB - Chat Conversations
  // ============================================
  Widget _buildMessagesTab() {
    final chatService = ChatService();
    final currentUserId = FirebaseAuth.instance.currentUser?.uid ?? '';

    return RefreshIndicator(
      onRefresh: () async {
        setState(() {}); // Triggers rebuild which re-fetches
      },
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            elevation: 0,
            backgroundColor: AppColors.neutralWhite,
            title: const Text('Messages'),
            titleTextStyle: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w700,
                ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => context.push('/notifications'),
              ),
            ],
          ),
          SliverFillRemaining(
            child: FutureBuilder<List<ConversationModel>>(
              future: chatService.getConversations(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return ShimmerLoading(
                    variant: ShimmerVariant.list,
                    itemCount: 5,
                  );
                }

                if (snapshot.hasError) {
                  return AppErrorWidget(
                    message: 'Failed to load messages',
                    onRetry: () => setState(() {}),
                  );
                }

                final conversations = snapshot.data ?? [];

                if (conversations.isEmpty) {
                  return Center(
                    child: EmptyState(
                      icon: Icons.message_outlined,
                      title: 'No Messages',
                      subtitle: 'Start a conversation with a pharmacy from your order details',
                      actionLabel: 'Browse Pharmacies',
                      onAction: () => setState(() => _currentIndex = 1),
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: conversations.length,
                  separatorBuilder: (_, __) => const Divider(
                    height: 1,
                    indent: 76,
                    endIndent: 16,
                  ),
                  itemBuilder: (context, index) {
                    final conv = conversations[index];
                    return _buildConversationTile(conv, currentUserId);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationTile(ConversationModel conv, String currentUserId) {
    final otherName = conv.getOtherParticipantName(currentUserId);
    final isPharmacy = conv.type == ConversationType.customerPharmacy;
    final hasUnread = conv.unreadCount > 0;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: CircleAvatar(
        radius: 26,
        backgroundColor: isPharmacy ? AppColors.primary50 : AppColors.secondary50,
        child: Icon(
          isPharmacy ? Icons.local_pharmacy : Icons.delivery_dining,
          color: isPharmacy ? AppColors.primary600 : AppColors.secondary600,
          size: 22,
        ),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              otherName,
              style: TextStyle(
                fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w500,
                fontSize: 15,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (conv.lastMessageAt != null)
            Text(
              _formatConvTime(conv.lastMessageAt!),
              style: TextStyle(
                fontSize: 12,
                color: hasUnread ? AppColors.primary600 : AppColors.neutral500,
                fontWeight: hasUnread ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
        ],
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: Text(
              conv.lastMessage ?? 'No messages yet',
              style: TextStyle(
                color: hasUnread ? AppColors.neutral800 : AppColors.neutral500,
                fontWeight: hasUnread ? FontWeight.w500 : FontWeight.w400,
                fontSize: 13,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (hasUnread)
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary600,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                conv.unreadCount > 99 ? '99+' : conv.unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      onTap: () => context.push('/chat/${conv.id}'),
    );
  }

  String _formatConvTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return DateFormat.jm().format(dateTime);
    if (diff.inDays < 7) return DateFormat.E().format(dateTime);
    return DateFormat('MMM d').format(dateTime);
  }

  // ============================================
  // PROFILE TAB - Account Settings
  // ============================================
  Widget _buildProfileTab() {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return RefreshIndicator(
      onRefresh: () async {
        await Future.delayed(const Duration(milliseconds: 500));
      },
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            elevation: 0,
            backgroundColor: AppColors.neutralWhite,
            title: const Text('Profile'),
            titleTextStyle: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w700,
                ),
          ),
          SliverToBoxAdapter(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Profile Card
                  Container(
                    padding: const EdgeInsets.all(UIConstants.paddingLarge),
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(
                          UIConstants.borderRadiusLarge),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.primary100,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.person,
                            size: 40,
                            color: AppColors.primary600,
                          ),
                        ),
                        const SizedBox(height: UIConstants.paddingMedium),
                        Text(
                          user?.displayName ?? 'User',
                          style:
                              Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user?.email ?? 'No email',
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
                  const SizedBox(height: UIConstants.paddingLarge),

                  // Settings Sections
                  _buildProfileSection(
                    title: 'Account',
                    items: [
                      _buildProfileMenuItem(
                        icon: Icons.person_outline,
                        label: 'Edit Profile',
                        onTap: () {},
                      ),
                      _buildProfileMenuItem(
                        icon: Icons.lock_outline,
                        label: 'Change Password',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.paddingLarge),

                  _buildProfileSection(
                    title: 'Shopping',
                    items: [
                      _buildProfileMenuItem(
                        icon: Icons.location_on_outlined,
                        label: 'Saved Addresses',
                        onTap: () {},
                      ),
                      _buildProfileMenuItem(
                        icon: Icons.payment,
                        label: 'Payment Methods',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.paddingLarge),

                  _buildProfileSection(
                    title: 'App',
                    items: [
                      _buildProfileMenuItem(
                        icon: Icons.notifications_outlined,
                        label: 'Notifications',
                        onTap: () {},
                      ),
                      _buildProfileMenuItem(
                        icon: Icons.language,
                        label: 'Language',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.paddingLarge),

                  _buildProfileSection(
                    title: 'Support',
                    items: [
                      _buildProfileMenuItem(
                        icon: Icons.help_outline,
                        label: 'Help & Support',
                        onTap: () {},
                      ),
                      _buildProfileMenuItem(
                        icon: Icons.privacy_tip_outlined,
                        label: 'Privacy Policy',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.paddingLarge),

                  // Sign Out Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
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
                        padding: const EdgeInsets.symmetric(
                            vertical: UIConstants.paddingMedium),
                      ),
                    ),
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSection({
    required String title,
    required List<Widget> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: UIConstants.paddingMedium),
        PharmaCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: List.generate(
              items.length,
              (index) => Column(
                children: [
                  items[index],
                  if (index < items.length - 1)
                    const Divider(height: 0),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileMenuItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: UIConstants.paddingMedium,
          vertical: UIConstants.paddingMedium,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: AppColors.primary600,
              size: UIConstants.iconSizeMedium,
            ),
            const SizedBox(width: UIConstants.paddingMedium),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: AppColors.neutral500,
            ),
          ],
        ),
      ),
    );
  }
}
