import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/pharmacy_model.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/pharmacy_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class BrowsePharmaciesScreen extends StatefulWidget {
  const BrowsePharmaciesScreen({Key? key}) : super(key: key);

  @override
  State<BrowsePharmaciesScreen> createState() => _BrowsePharmaciesScreenState();
}

class _BrowsePharmaciesScreenState extends State<BrowsePharmaciesScreen> {
  late PharmacyService _pharmacyService;
  late TextEditingController _searchController;
  String _searchQuery = '';
  String? _selectedCategory;
  List<String> _categories = ['General', 'Hospital', 'Specialty', 'Clinic'];

  @override
  void initState() {
    super.initState();
    _pharmacyService = PharmacyService(apiService: ApiService());
    _searchController = TextEditingController();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      body: CustomScrollView(
        slivers: [
          // App Bar
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
          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: PharmaSearchBar(
                controller: _searchController,
                hint: 'Search pharmacies...',
                onChanged: (_) {
                  setState(() {});
                },
              ),
            ),
          ),
          // Category Filters
          SliverToBoxAdapter(
            child: SizedBox(
              height: 50,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingMedium,
                ),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final category = _categories[index];
                  final isSelected = _selectedCategory == category;
                  return Padding(
                    padding: const EdgeInsets.only(right: UIConstants.paddingSmall),
                    child: FilterChip(
                      label: Text(category),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _selectedCategory = selected ? category : null;
                        });
                      },
                      backgroundColor: AppColors.neutral100,
                      selectedColor: AppColors.primary600,
                      labelStyle: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: isSelected
                                ? AppColors.neutralWhite
                                : AppColors.neutral900,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  );
                },
              ),
            ),
          ),
          // Pharmacy List
          SliverFillRemaining(
            child: RefreshIndicator(
              onRefresh: () async {
                setState(() {});
                await Future.delayed(const Duration(milliseconds: 500));
              },
              child: _buildPharmaciesList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPharmaciesList() {
    return FutureBuilder<Map<String, dynamic>>(
      future: _searchQuery.isEmpty
          ? _pharmacyService.getPharmacies()
          : _pharmacyService.searchPharmacies(query: _searchQuery),
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
            onRetry: () {
              setState(() {});
            },
          );
        }

        final pharmacies = snapshot.data?['pharmacies'] as List<dynamic>? ?? [];

        if (pharmacies.isEmpty) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.6,
              child: Center(
                child: EmptyState(
                  icon: Icons.local_pharmacy_outlined,
                  title: 'No Pharmacies Found',
                  subtitle: _searchQuery.isEmpty
                      ? 'Try adjusting your filters'
                      : 'No results for "$_searchQuery"',
                  actionLabel: 'Clear Search',
                  onAction: () {
                    _searchController.clear();
                    setState(() {
                      _selectedCategory = null;
                    });
                  },
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
            itemCount: pharmacies.length,
            separatorBuilder: (_, __) =>
                const SizedBox(height: UIConstants.paddingMedium),
            itemBuilder: (context, index) {
              final pharmacyData = pharmacies[index];
              final pharmacy = pharmacyData is PharmacyModel
                  ? pharmacyData
                  : PharmacyModel.fromJson(pharmacyData as Map<String, dynamic>);
              return _buildPharmacyCard(pharmacy);
            },
          ),
        );
      },
    );
  }

  Widget _buildPharmacyCard(PharmacyModel pharmacy) {
    final isOpen = pharmacy.isOpen;
    final statusColor = isOpen ? AppColors.success : AppColors.error;
    final statusText = isOpen ? 'Open' : 'Closed';

    return PharmaCard(
      onTap: () {
        context.push('/customer/pharmacy/${pharmacy.id}');
      },
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo/Image Placeholder
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.primary100,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
            ),
            child: pharmacy.logoUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(
                        UIConstants.borderRadiusMedium),
                    child: Image.network(
                      pharmacy.logoUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          const Icon(
                        Icons.local_pharmacy,
                        color: AppColors.primary600,
                        size: 40,
                      ),
                    ),
                  )
                : const Icon(
                    Icons.local_pharmacy,
                    color: AppColors.primary600,
                    size: 40,
                  ),
          ),
          const SizedBox(width: UIConstants.paddingMedium),
          // Pharmacy Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name with Verified Badge
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        pharmacy.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                    ),
                    if (pharmacy.isVerified)
                      Container(
                        margin:
                            const EdgeInsets.only(left: UIConstants.paddingSmall),
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: AppColors.primary600,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: AppColors.neutralWhite,
                          size: 14,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                // Rating
                Row(
                  children: [
                    const Icon(
                      Icons.star,
                      size: 14,
                      color: Colors.amber,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${pharmacy.rating.toStringAsFixed(1)} (${pharmacy.reviewCount})',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // Location
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 12,
                      color: AppColors.neutral600,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${pharmacy.city}, ${pharmacy.state}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neutral600,
                            ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.paddingSmall,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius:
                        BorderRadius.circular(UIConstants.borderRadiusSmall),
                  ),
                  child: Text(
                    statusText,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
