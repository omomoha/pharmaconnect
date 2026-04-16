import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/product_model.dart';
import 'package:pharmaconnect/providers/cart_provider.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/product_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';
import 'package:provider/provider.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({
    Key? key,
    required this.productId,
  }) : super(key: key);

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late ProductService _productService;
  late Future<ProductModel> _productFuture;
  int _quantity = 1;
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _productService = ProductService(apiService: ApiService());
    _productFuture = _productService.getProductById(widget.productId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      body: FutureBuilder<ProductModel>(
        future: _productFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return ShimmerLoading(variant: ShimmerVariant.card);
          }

          if (snapshot.hasError) {
            return Scaffold(
              appBar: AppBar(
                elevation: 0,
                backgroundColor: AppColors.neutralWhite,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new,
                      color: AppColors.neutral900),
                  onPressed: () => context.pop(),
                ),
              ),
              body: AppErrorWidget(
                message: 'Failed to load product details',
                onRetry: () {
                  setState(() {
                    _productFuture = _productService.getProductById(widget.productId);
                  });
                },
              ),
            );
          }

          final product = snapshot.data;
          if (product == null) {
            return Scaffold(
              appBar: AppBar(
                elevation: 0,
                backgroundColor: AppColors.neutralWhite,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new,
                      color: AppColors.neutral900),
                  onPressed: () => context.pop(),
                ),
              ),
              body: Center(
                child: EmptyState(
                  icon: Icons.medication_outlined,
                  title: 'Product Not Found',
                  subtitle: 'This product no longer exists',
                ),
              ),
            );
          }

          return CustomScrollView(
            slivers: [
              // App Bar
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
                    icon: const Icon(Icons.favorite_outline,
                        color: AppColors.neutral900),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Favorites feature coming soon'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                ],
              ),
              // Product Image
              SliverToBoxAdapter(
                child: _buildProductImageCarousel(product),
              ),
              // Product Details
              SliverToBoxAdapter(
                child: _buildProductDetails(product),
              ),
              // Description Section
              if (product.description.isNotEmpty)
                SliverToBoxAdapter(
                  child: _buildDescriptionSection(product),
                ),
              // Product Specifications
              if (product.dosageForm != null || product.strength != null)
                SliverToBoxAdapter(
                  child: _buildSpecificationsSection(product),
                ),
              // Pharmacy Info Card
              SliverToBoxAdapter(
                child: _buildPharmacyInfoCard(product),
              ),
              // Spacer
              SliverToBoxAdapter(
                child: const SizedBox(height: UIConstants.paddingLarge),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: FutureBuilder<ProductModel>(
        future: _productFuture,
        builder: (context, snapshot) {
          if (snapshot.data == null) {
            return const SizedBox.shrink();
          }
          final product = snapshot.data!;
          return _buildBottomBar(product);
        },
      ),
    );
  }

  Widget _buildProductImageCarousel(ProductModel product) {
    final images = product.images;

    return Column(
      children: [
        // Main Image
        Container(
          width: double.infinity,
          height: 300,
          color: AppColors.secondary100,
          child: images.isNotEmpty
              ? ClipRRect(
                  child: CachedNetworkImage(
                    imageUrl: images[_currentImageIndex],
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Shimmer.fromColors(
                      baseColor: AppColors.neutral200,
                      highlightColor: AppColors.neutral100,
                      child: Container(
                        color: AppColors.neutral200,
                      ),
                    ),
                    errorWidget: (context, url, error) => const Icon(
                      Icons.medication_outlined,
                      color: AppColors.secondary600,
                      size: 48,
                    ),
                  ),
                )
              : const Icon(
                  Icons.medication_outlined,
                  color: AppColors.secondary600,
                  size: 48,
                ),
        ),
        // Image Indicator/Carousel (if multiple images)
        if (images.length > 1)
          Padding(
            padding: const EdgeInsets.all(UIConstants.paddingMedium),
            child: SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: images.length,
                itemBuilder: (context, index) {
                  final isSelected = index == _currentImageIndex;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _currentImageIndex = index;
                      });
                    },
                    child: Container(
                      width: 70,
                      margin: const EdgeInsets.only(
                          right: UIConstants.paddingSmall),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(
                            UIConstants.borderRadiusSmall),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.primary600
                              : AppColors.neutral300,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(
                            UIConstants.borderRadiusSmall),
                        child: CachedNetworkImage(
                          imageUrl: images[index],
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Shimmer.fromColors(
                            baseColor: AppColors.neutral200,
                            highlightColor: AppColors.neutral100,
                            child: Container(
                              color: AppColors.neutral200,
                            ),
                          ),
                          errorWidget: (context, url, error) =>
                              Container(
                            color: AppColors.secondary100,
                            child: const Icon(
                              Icons.medication_outlined,
                              size: 24,
                              color: AppColors.secondary600,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildProductDetails(ProductModel product) {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Name
          Text(
            product.name,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          // Rating Row
          Row(
            children: [
              const Icon(
                Icons.star,
                size: 18,
                color: Colors.amber,
              ),
              const SizedBox(width: 4),
              Text(
                '${product.rating.toStringAsFixed(1)} (${product.reviewCount} reviews)',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          // Price Section
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'NGN ${product.price.toStringAsFixed(0)}',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: AppColors.primary600,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              if (product.compareAtPrice != null &&
                  product.compareAtPrice! > product.price)
                Text(
                  'NGN ${product.compareAtPrice!.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.neutral600,
                        decoration: TextDecoration.lineThrough,
                      ),
                ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          // Stock and Prescription Status
          Row(
            children: [
              // Stock Status
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingSmall,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: product.inStock
                      ? AppColors.successLight
                      : AppColors.errorLight,
                  borderRadius:
                      BorderRadius.circular(UIConstants.borderRadiusSmall),
                ),
                child: Text(
                  product.inStock ? 'In Stock' : 'Out of Stock',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: product.inStock
                            ? AppColors.success
                            : AppColors.error,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              // Prescription Badge
              if (product.requiresPrescription)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.paddingSmall,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius:
                        BorderRadius.circular(UIConstants.borderRadiusSmall),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.warning_outlined,
                        size: 14,
                        color: AppColors.warning,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Requires Prescription',
                        style:
                            Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.warning,
                                  fontWeight: FontWeight.w600,
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

  Widget _buildDescriptionSection(ProductModel product) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingMedium,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(),
          const SizedBox(height: UIConstants.paddingMedium),
          Text(
            'Description',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          Text(
            product.description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutral700,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecificationsSection(ProductModel product) {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(),
          const SizedBox(height: UIConstants.paddingMedium),
          Text(
            'Specifications',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          PharmaCard(
            padding: const EdgeInsets.all(UIConstants.paddingMedium),
            child: Column(
              children: [
                if (product.dosageForm != null)
                  _buildSpecRow('Dosage Form', product.dosageForm!),
                if (product.dosageForm != null && product.strength != null)
                  const Divider(height: 16),
                if (product.strength != null)
                  _buildSpecRow('Strength', product.strength!),
                if (product.strength != null && product.manufacturer != null)
                  const Divider(height: 16),
                if (product.manufacturer != null)
                  _buildSpecRow('Manufacturer', product.manufacturer!),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecRow(String label, String value) {
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
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }

  Widget _buildPharmacyInfoCard(ProductModel product) {
    return Padding(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: PharmaCard(
        onTap: () {
          context.push('/customer/pharmacy/${product.pharmacyId}');
        },
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sold by',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.neutral600,
              ),
            ),
            const SizedBox(height: UIConstants.paddingSmall),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.pharmacyName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.star,
                            size: 14,
                            color: Colors.amber,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'View Pharmacy',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                              color: AppColors.primary600,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  color: AppColors.neutral500,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar(ProductModel product) {
    return Container(
      padding: EdgeInsets.only(
        left: UIConstants.paddingMedium,
        right: UIConstants.paddingMedium,
        bottom: MediaQuery.of(context).padding.bottom + UIConstants.paddingMedium,
        top: UIConstants.paddingMedium,
      ),
      decoration: BoxDecoration(
        color: AppColors.neutralWhite,
        border: Border(
          top: BorderSide(
            color: AppColors.neutral200,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Quantity Selector
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.neutral300),
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusSmall),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove),
                  onPressed: _quantity > 1
                      ? () {
                          setState(() => _quantity--);
                        }
                      : null,
                  iconSize: 18,
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.paddingSmall,
                  ),
                  child: Text(
                    _quantity.toString(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: _quantity < product.stockQuantity
                      ? () {
                          setState(() => _quantity++);
                        }
                      : null,
                  iconSize: 18,
                ),
              ],
            ),
          ),
          const SizedBox(width: UIConstants.paddingMedium),
          // Add to Cart Button
          Expanded(
            child: ElevatedButton(
              onPressed: product.inStock
                  ? () {
                      // Add to cart via CartProvider
                      context.read<CartProvider>().addToCart(
                        product,
                        quantity: _quantity,
                      );

                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                              'Added $_quantity ${product.name} to cart'),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  vertical: UIConstants.paddingMedium,
                ),
                backgroundColor: product.inStock
                    ? AppColors.primary600
                    : AppColors.neutral400,
              ),
              child: Text(
                product.inStock ? 'Add to Cart' : 'Out of Stock',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.neutralWhite,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
