import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/product_model.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/product_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class ProductSearchScreen extends StatefulWidget {
  final String? initialQuery;

  const ProductSearchScreen({
    Key? key,
    this.initialQuery,
  }) : super(key: key);

  @override
  State<ProductSearchScreen> createState() => _ProductSearchScreenState();
}

class _ProductSearchScreenState extends State<ProductSearchScreen> {
  late ProductService _productService;
  late TextEditingController _searchController;
  String _searchQuery = '';
  String? _selectedCategory;
  String _sortBy = 'relevance'; // relevance, price_asc, price_desc, rating, newest
  List<String> _categories = [
    'Pain Relief',
    'Cold & Flu',
    'Vitamins',
    'Antibiotics',
    'Digestive',
  ];
  final Map<String, String> _sortOptions = {
    'relevance': 'Relevance',
    'price_asc': 'Price: Low to High',
    'price_desc': 'Price: High to Low',
    'rating': 'Top Rated',
    'newest': 'Newest',
  };

  @override
  void initState() {
    super.initState();
    _productService = ProductService(apiService: ApiService());
    _searchController = TextEditingController(text: widget.initialQuery ?? '');
    _searchQuery = widget.initialQuery ?? '';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
            title: const Text('Search Products'),
            titleTextStyle: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w700,
                ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new,
                  color: AppColors.neutral900),
              onPressed: () => context.pop(),
            ),
          ),
          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: PharmaSearchBar(
                controller: _searchController,
                hint: 'Search for products...',
                autofocus: true,
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),
          ),
          // Filter and Sort Row
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.paddingMedium,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          FilterChip(
                            label: const Text('All Categories'),
                            selected: _selectedCategory == null,
                            onSelected: (selected) {
                              setState(() {
                                _selectedCategory = null;
                              });
                            },
                            backgroundColor: AppColors.neutral100,
                            selectedColor: AppColors.primary600,
                            labelStyle: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: _selectedCategory == null
                                      ? AppColors.neutralWhite
                                      : AppColors.neutral900,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                          ...List.generate(
                            _categories.length,
                            (index) {
                              final category = _categories[index];
                              final isSelected = _selectedCategory == category;
                              return Padding(
                                padding: const EdgeInsets.only(
                                  left: UIConstants.paddingSmall,
                                ),
                                child: FilterChip(
                                  label: Text(category),
                                  selected: isSelected,
                                  onSelected: (selected) {
                                    setState(() {
                                      _selectedCategory =
                                          selected ? category : null;
                                    });
                                  },
                                  backgroundColor: AppColors.neutral100,
                                  selectedColor: AppColors.primary600,
                                  labelStyle: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: isSelected
                                            ? AppColors.neutralWhite
                                            : AppColors.neutral900,
                                        fontWeight: FontWeight.w500,
                                      ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: UIConstants.paddingSmall),
                  // Sort Button
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      setState(() {
                        _sortBy = value;
                      });
                    },
                    itemBuilder: (context) => _sortOptions.entries
                        .map(
                          (entry) => PopupMenuItem<String>(
                            value: entry.key,
                            child: Text(entry.value),
                          ),
                        )
                        .toList(),
                    child: Container(
                      padding: const EdgeInsets.all(UIConstants.paddingSmall),
                      decoration: BoxDecoration(
                        color: AppColors.neutral100,
                        borderRadius:
                            BorderRadius.circular(UIConstants.borderRadiusSmall),
                        border: Border.all(color: AppColors.neutral300),
                      ),
                      child: const Icon(
                        Icons.tune_outlined,
                        color: AppColors.neutral900,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(
            child: SizedBox(height: UIConstants.paddingMedium),
          ),
          // Products Grid
          SliverFillRemaining(
            child: _buildProductsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildProductsList() {
    return FutureBuilder<Map<String, dynamic>>(
      future: _searchQuery.isEmpty
          ? _productService.getProducts()
          : _productService.searchProducts(
              query: _searchQuery,
              category: _selectedCategory,
            ),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return ShimmerLoading(
            variant: ShimmerVariant.grid,
            itemCount: 6,
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

        var products = snapshot.data?['products'] as List<dynamic>? ?? [];

        // Apply sorting
        if (products.isNotEmpty) {
          products = _applySorting(products);
        }

        if (products.isEmpty) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.6,
              child: Center(
                child: EmptyState(
                  icon: Icons.medication_outlined,
                  title: 'No Products Found',
                  subtitle: _searchQuery.isEmpty
                      ? 'Try adjusting your filters'
                      : 'No results for "$_searchQuery"',
                  actionLabel: 'Clear Search',
                  onAction: () {
                    _searchController.clear();
                    setState(() {
                      _searchQuery = '';
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

  List<dynamic> _applySorting(List<dynamic> products) {
    final list = List<dynamic>.from(products);

    switch (_sortBy) {
      case 'price_asc':
        list.sort((a, b) {
          final priceA = _getPrice(a);
          final priceB = _getPrice(b);
          return priceA.compareTo(priceB);
        });
        break;
      case 'price_desc':
        list.sort((a, b) {
          final priceA = _getPrice(a);
          final priceB = _getPrice(b);
          return priceB.compareTo(priceA);
        });
        break;
      case 'rating':
        list.sort((a, b) {
          final ratingA = _getRating(a);
          final ratingB = _getRating(b);
          return ratingB.compareTo(ratingA);
        });
        break;
      case 'newest':
        list.sort((a, b) {
          final dateA = _getCreatedAt(a);
          final dateB = _getCreatedAt(b);
          return dateB.compareTo(dateA);
        });
        break;
      default:
        // relevance (keep original order)
        break;
    }

    return list;
  }

  double _getPrice(dynamic product) {
    if (product is ProductModel) {
      return product.price;
    }
    if (product is Map<String, dynamic>) {
      return (product['price'] as num?)?.toDouble() ?? 0.0;
    }
    return 0.0;
  }

  double _getRating(dynamic product) {
    if (product is ProductModel) {
      return product.rating;
    }
    if (product is Map<String, dynamic>) {
      return (product['rating'] as num?)?.toDouble() ?? 0.0;
    }
    return 0.0;
  }

  DateTime _getCreatedAt(dynamic product) {
    if (product is ProductModel) {
      return product.createdAt;
    }
    if (product is Map<String, dynamic>) {
      final createdAt = product['createdAt'];
      if (createdAt is String) {
        return DateTime.tryParse(createdAt) ?? DateTime.now();
      }
    }
    return DateTime.now();
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
                      child: CachedNetworkImage(
                        imageUrl: product.images.first,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: AppColors.neutral200,
                          highlightColor: AppColors.neutral100,
                          child: Container(
                            color: AppColors.neutral200,
                          ),
                        ),
                        errorWidget: (context, url, error) =>
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
          // Pharmacy Name
          Text(
            product.pharmacyName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.neutral600,
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
          const SizedBox(height: 4),
          // Rating
          Row(
            children: [
              const Icon(
                Icons.star,
                size: 12,
                color: Colors.amber,
              ),
              const SizedBox(width: 2),
              Text(
                '${product.rating.toStringAsFixed(1)} (${product.reviewCount})',
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
}
