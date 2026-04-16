import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/pharmacy_model.dart';
import 'package:pharmaconnect/models/product_model.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/pharmacy_service.dart';
import 'package:pharmaconnect/services/product_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class PharmacyDetailScreen extends StatefulWidget {
  final String pharmacyId;

  const PharmacyDetailScreen({
    Key? key,
    required this.pharmacyId,
  }) : super(key: key);

  @override
  State<PharmacyDetailScreen> createState() => _PharmacyDetailScreenState();
}

class _PharmacyDetailScreenState extends State<PharmacyDetailScreen> {
  late PharmacyService _pharmacyService;
  late ProductService _productService;
  late TextEditingController _searchController;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _pharmacyService = PharmacyService(apiService: ApiService());
    _productService = ProductService(apiService: ApiService());
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
      body: FutureBuilder<PharmacyModel>(
        future: _pharmacyService.getPharmacyById(widget.pharmacyId),
        builder: (context, pharmacySnapshot) {
          if (pharmacySnapshot.connectionState == ConnectionState.waiting) {
            return ShimmerLoading(variant: ShimmerVariant.card);
          }

          if (pharmacySnapshot.hasError) {
            return Scaffold(
              appBar: AppBar(
                elevation: 0,
                backgroundColor: AppColors.neutralWhite,
              ),
              body: AppErrorWidget(
                message: 'Failed to load pharmacy details',
                onRetry: () {
                  setState(() {});
                },
              ),
            );
          }

          final pharmacy = pharmacySnapshot.data;
          if (pharmacy == null) {
            return Scaffold(
              appBar: AppBar(
                elevation: 0,
                backgroundColor: AppColors.neutralWhite,
              ),
              body: Center(
                child: EmptyState(
                  icon: Icons.local_pharmacy_outlined,
                  title: 'Pharmacy Not Found',
                  subtitle: 'This pharmacy no longer exists',
                ),
              ),
            );
          }

          return CustomScrollView(
            slivers: [
              // App Bar with Back Button
              SliverAppBar(
                floating: true,
                elevation: 0,
                backgroundColor: AppColors.neutralWhite,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new,
                      color: AppColors.neutral900),
                  onPressed: () => context.pop(),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.call, color: AppColors.primary600),
                    onPressed: () {
                      // TODO: Implement phone call
                    },
                  ),
                ],
              ),
              // Header Section
              SliverToBoxAdapter(
                child: _buildPharmacyHeader(pharmacy),
              ),
              // Operating Hours Section
              SliverToBoxAdapter(
                child: _buildOperatingHours(pharmacy),
              ),
              // Search Bar for Products
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(UIConstants.paddingMedium),
                  child: PharmaSearchBar(
                    controller: _searchController,
                    hint: 'Search products...',
                    onChanged: (_) {
                      setState(() {});
                    },
                  ),
                ),
              ),
              // Products Grid
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.paddingMedium,
                  ),
                  child: Text(
                    'Products',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(height: UIConstants.paddingSmall),
              ),
              SliverToBoxAdapter(
                child: _buildProductsList(pharmacy.id),
              ),
              // Contact Info Section
              SliverToBoxAdapter(
                child: _buildContactInfo(pharmacy),
              ),
              SliverToBoxAdapter(
                child: const SizedBox(height: UIConstants.paddingLarge),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPharmacyHeader(PharmacyModel pharmacy) {
    final isOpen = pharmacy.isOpen;
    final statusColor = isOpen ? AppColors.success : AppColors.error;
    final statusText = isOpen ? 'Open now' : 'Closed';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Cover Image
        Container(
          width: double.infinity,
          height: 200,
          decoration: BoxDecoration(
            color: AppColors.primary100,
          ),
          child: pharmacy.coverImageUrl != null
              ? Image.network(
                  pharmacy.coverImageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const Center(
                    child: Icon(
                      Icons.local_pharmacy,
                      color: AppColors.primary600,
                      size: 48,
                    ),
                  ),
                )
              : const Center(
                  child: Icon(
                    Icons.local_pharmacy,
                    color: AppColors.primary600,
                    size: 48,
                  ),
                ),
        ),
        // Logo and Details Overlay
        Padding(
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.neutralWhite,
                      borderRadius: BorderRadius.circular(
                          UIConstants.borderRadiusMedium),
                      border:
                          Border.all(color: AppColors.neutral200, width: 1),
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
                              ),
                            ),
                          )
                        : const Icon(
                            Icons.local_pharmacy,
                            color: AppColors.primary600,
                          ),
                  ),
                  const SizedBox(width: UIConstants.paddingMedium),
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
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                            ),
                            if (pharmacy.isVerified)
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: AppColors.primary600,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.check,
                                  color: AppColors.neutralWhite,
                                  size: 16,
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
                              size: 16,
                              color: Colors.amber,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${pharmacy.rating.toStringAsFixed(1)} (${pharmacy.reviewCount} reviews)',
                              style: Theme.of(context).textTheme.bodySmall,
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
                            borderRadius: BorderRadius.circular(
                                UIConstants.borderRadiusSmall),
                          ),
                          child: Text(
                            statusText,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
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
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOperatingHours(PharmacyModel pharmacy) {
    final hours = pharmacy.operatingHours;
    if (hours == null || hours.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: PharmaCard(
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Operating Hours',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: hours.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: UIConstants.paddingSmall),
              itemBuilder: (context, index) {
                final hour = hours[index];
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      hour.day,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    Text(
                      '${hour.openTime} - ${hour.closeTime}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.neutral600,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductsList(String pharmacyId) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _searchQuery.isEmpty
          ? _productService.getPharmacyProducts(pharmacyId: pharmacyId)
          : _productService.searchProducts(query: _searchQuery),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return ShimmerLoading(
            variant: ShimmerVariant.grid,
            itemCount: 4,
          );
        }

        if (snapshot.hasError) {
          return AppErrorWidget(
            message: 'Failed to load products',
            onRetry: () {
              setState(() {});
            },
          );
        }

        final products = snapshot.data?['products'] as List<dynamic>? ?? [];

        if (products.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: UIConstants.paddingMedium,
            ),
            child: Center(
              child: EmptyState(
                icon: Icons.medication_outlined,
                title: 'No Products Found',
                subtitle: _searchQuery.isEmpty
                    ? 'This pharmacy has no products listed'
                    : 'No results for "$_searchQuery"',
              ),
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: UIConstants.paddingMedium,
          ),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: UIConstants.paddingMedium,
              mainAxisSpacing: UIConstants.paddingMedium,
              childAspectRatio: 0.75,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final productData = products[index];
              final product = productData is ProductModel
                  ? productData
                  : ProductModel.fromJson(productData as Map<String, dynamic>);
              return _buildProductCard(product);
            },
          ),
        );
      },
    );
  }

  Widget _buildProductCard(ProductModel product) {
    return PharmaCard(
      onTap: () {
        context.push('/customer/product/${product.id}');
      },
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Image
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.secondary100,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusMedium),
              ),
              child: product.images.isNotEmpty
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(
                          UIConstants.borderRadiusMedium),
                      child: Image.network(
                        product.images.first,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            const Icon(
                          Icons.medication_outlined,
                          color: AppColors.secondary600,
                          size: 32,
                        ),
                      ),
                    )
                  : const Icon(
                      Icons.medication_outlined,
                      color: AppColors.secondary600,
                      size: 32,
                    ),
            ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          // Product Name
          Text(
            product.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 4),
          // Price
          Text(
            'NGN ${product.price.toStringAsFixed(0)}',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.primary600,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          // In Stock Badge
          if (!product.inStock)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingSmall,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
              child: Text(
                'Out of Stock',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildContactInfo(PharmacyModel pharmacy) {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: PharmaCard(
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Contact Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            // Phone
            Row(
              children: [
                const Icon(
                  Icons.phone_outlined,
                  color: AppColors.primary600,
                  size: 20,
                ),
                const SizedBox(width: UIConstants.paddingMedium),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Phone',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neutral600,
                            ),
                      ),
                      Text(
                        pharmacy.phone,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            // Email
            Row(
              children: [
                const Icon(
                  Icons.email_outlined,
                  color: AppColors.primary600,
                  size: 20,
                ),
                const SizedBox(width: UIConstants.paddingMedium),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Email',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neutral600,
                            ),
                      ),
                      Text(
                        pharmacy.email,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            // Address
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  color: AppColors.primary600,
                  size: 20,
                ),
                const SizedBox(width: UIConstants.paddingMedium),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Address',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neutral600,
                            ),
                      ),
                      Text(
                        '${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
