import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/models/product_model.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/product_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class PharmacyProductsScreen extends StatefulWidget {
  const PharmacyProductsScreen({Key? key}) : super(key: key);

  @override
  State<PharmacyProductsScreen> createState() => _PharmacyProductsScreenState();
}

class _PharmacyProductsScreenState extends State<PharmacyProductsScreen> {
  late Future<Map<String, dynamic>> _productsFuture;
  final TextEditingController _searchController = TextEditingController();
  bool _showSearch = false;
  String _selectedFilter = 'All';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  void _loadProducts() {
    final apiService = ApiService();
    final productService = ProductService(apiService: apiService);

    _productsFuture = productService.getProducts(
      search: _searchQuery.isNotEmpty ? _searchQuery : null,
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    setState(() {
      _searchQuery = value;
      _loadProducts();
    });
  }

  void _onFilterSelected(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
  }

  List<ProductModel> _filterProducts(List<ProductModel> products) {
    switch (_selectedFilter) {
      case 'In Stock':
        return products.where((p) => p.inStock).toList();
      case 'Out of Stock':
        return products.where((p) => !p.inStock).toList();
      case 'All':
      default:
        return products;
    }
  }

  void _deleteProduct(String productId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Product'),
        content: const Text(
          'Are you sure you want to delete this product? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final apiService = ApiService();
                await apiService.delete('${ApiEndpoints.products}/$productId');

                if (mounted) {
                  setState(() {
                    _loadProducts();
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Product deleted successfully'),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error deleting product: $e'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              }
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Products'),
        elevation: 0,
        actions: [
          if (!_showSearch)
            IconButton(
              icon: const Icon(Icons.search_rounded),
              onPressed: () {
                setState(() {
                  _showSearch = true;
                });
              },
            ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          if (_showSearch)
            Padding(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Row(
                children: [
                  Expanded(
                    child: PharmaSearchBar(
                      controller: _searchController,
                      hint: 'Search products...',
                      onChanged: _onSearchChanged,
                      autofocus: true,
                    ),
                  ),
                  const SizedBox(width: UIConstants.paddingSmall),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () {
                      setState(() {
                        _showSearch = false;
                        _searchController.clear();
                        _searchQuery = '';
                        _loadProducts();
                      });
                    },
                  ),
                ],
              ),
            ),

          // Filter chips
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: UIConstants.paddingMedium,
              vertical: UIConstants.paddingSmall,
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  'All',
                  'In Stock',
                  'Out of Stock',
                ].map((filter) {
                  final isSelected = _selectedFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: UIConstants.paddingSmall),
                    child: FilterChip(
                      label: Text(filter),
                      selected: isSelected,
                      onSelected: (_) => _onFilterSelected(filter),
                      backgroundColor: AppColors.neutral100,
                      selectedColor: AppColors.primary600,
                      labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: isSelected
                                ? AppColors.neutralWhite
                                : AppColors.neutral700,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // Products list
          Expanded(
            child: FutureBuilder<Map<String, dynamic>>(
              future: _productsFuture,
              builder: (context, snapshot) {
                // Loading state
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Padding(
                    padding: const EdgeInsets.all(UIConstants.paddingMedium),
                    child: ShimmerLoading(
                      variant: ShimmerVariant.card,
                      itemCount: 5,
                    ),
                  );
                }

                // Error state
                if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline_rounded,
                          size: 64,
                          color: AppColors.error,
                        ),
                        const SizedBox(height: UIConstants.paddingMedium),
                        Text(
                          'Error loading products',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: UIConstants.paddingSmall),
                        Text(
                          snapshot.error.toString(),
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.neutral600,
                              ),
                        ),
                        const SizedBox(height: UIConstants.paddingLarge),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _loadProducts();
                            });
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                // No data
                if (!snapshot.hasData ||
                    (snapshot.data?['products'] as List<dynamic>).isEmpty) {
                  return EmptyState(
                    icon: Icons.inventory_2_outlined,
                    title: 'No Products Yet',
                    subtitle: 'Add your first product to get started',
                    actionLabel: 'Add Product',
                    onAction: () {
                      context.push('/pharmacy/products/add');
                    },
                  );
                }

                // Products list
                final allProducts =
                    (snapshot.data!['products'] as List<dynamic>)
                        .cast<ProductModel>();
                final filteredProducts = _filterProducts(allProducts);

                if (filteredProducts.isEmpty) {
                  return EmptyState(
                    icon: Icons.search_off_rounded,
                    title: 'No Products Found',
                    subtitle: 'Try adjusting your filters or search query',
                    actionLabel: 'Clear Filters',
                    onAction: () {
                      _onFilterSelected('All');
                      _searchController.clear();
                      _searchQuery = '';
                      _loadProducts();
                    },
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    setState(() {
                      _loadProducts();
                    });
                    await _productsFuture;
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(UIConstants.paddingMedium),
                    itemCount: filteredProducts.length,
                    itemBuilder: (context, index) {
                      final product = filteredProducts[index];
                      return _ProductCard(
                        product: product,
                        onEdit: () {
                          context.push(
                            '/pharmacy/products/edit/${product.id}',
                            extra: product,
                          );
                        },
                        onDelete: () {
                          _deleteProduct(product.id);
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.push('/pharmacy/products/add');
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final ProductModel product;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ProductCard({
    Key? key,
    required this.product,
    required this.onEdit,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return PharmaCard(
      margin: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
      onTap: onEdit,
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product image
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius:
                      BorderRadius.circular(UIConstants.borderRadiusMedium),
                  color: AppColors.neutral100,
                  image: product.images.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(product.images[0]),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: product.images.isEmpty
                    ? Icon(
                        Icons.image_not_supported_outlined,
                        color: AppColors.neutral400,
                      )
                    : null,
              ),
              const SizedBox(width: UIConstants.paddingMedium),

              // Product details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name and stock badge
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            product.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: AppColors.neutral900,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                        const SizedBox(width: UIConstants.paddingSmall),
                        StatusBadge(
                          label: product.inStock ? 'In Stock' : 'Out of Stock',
                          color: product.inStock
                              ? AppColors.success
                              : AppColors.error,
                          backgroundColor: product.inStock
                              ? AppColors.successLight
                              : AppColors.errorLight,
                          fontSize: 10,
                        ),
                      ],
                    ),
                    const SizedBox(height: UIConstants.paddingSmall),

                    // Price
                    Text(
                      '₦${product.price.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: AppColors.primary600,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingSmall),

                    // Category and rating
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: UIConstants.paddingSmall,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.secondary100,
                            borderRadius: BorderRadius.circular(
                              UIConstants.borderRadiusSmall,
                            ),
                          ),
                          child: Text(
                            product.category,
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: AppColors.secondary700,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                        const SizedBox(width: UIConstants.paddingSmall),
                        if (product.rating > 0)
                          Row(
                            children: [
                              const Icon(
                                Icons.star_rounded,
                                size: 14,
                                color: AppColors.warning,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                '${product.rating.toStringAsFixed(1)} (${product.reviewCount})',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      color: AppColors.neutral600,
                                    ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Divider
          const SizedBox(height: UIConstants.paddingMedium),
          Container(
            height: 1,
            color: AppColors.neutral200,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('Edit'),
                ),
              ),
              const SizedBox(width: UIConstants.paddingSmall),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('Delete'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class AddEditProductScreen extends StatefulWidget {
  final ProductModel? product;

  const AddEditProductScreen({
    Key? key,
    this.product,
  }) : super(key: key);

  @override
  State<AddEditProductScreen> createState() => _AddEditProductScreenState();
}

class _AddEditProductScreenState extends State<AddEditProductScreen> {
  late TextEditingController _nameController;
  late TextEditingController _descriptionController;
  late TextEditingController _priceController;
  late TextEditingController _compareAtPriceController;
  late TextEditingController _stockQuantityController;
  late TextEditingController _dosageFormController;
  late TextEditingController _strengthController;
  late TextEditingController _manufacturerController;

  String _selectedCategory = '';
  bool _inStock = true;
  bool _requiresPrescription = false;
  List<String> _images = [];
  bool _isLoading = false;
  List<String> _availableCategories = [];

  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _initializeControllers();
    _loadCategories();
  }

  void _initializeControllers() {
    _nameController = TextEditingController(text: widget.product?.name ?? '');
    _descriptionController =
        TextEditingController(text: widget.product?.description ?? '');
    _priceController =
        TextEditingController(text: widget.product?.price.toString() ?? '');
    _compareAtPriceController = TextEditingController(
      text: widget.product?.compareAtPrice?.toString() ?? '',
    );
    _stockQuantityController = TextEditingController(
      text: widget.product?.stockQuantity.toString() ?? '0',
    );
    _dosageFormController =
        TextEditingController(text: widget.product?.dosageForm ?? '');
    _strengthController =
        TextEditingController(text: widget.product?.strength ?? '');
    _manufacturerController =
        TextEditingController(text: widget.product?.manufacturer ?? '');

    _selectedCategory = widget.product?.category ?? '';
    _inStock = widget.product?.inStock ?? true;
    _requiresPrescription = widget.product?.requiresPrescription ?? false;
    _images = List<String>.from(widget.product?.images ?? []);
  }

  void _loadCategories() async {
    try {
      final apiService = ApiService();
      final productService = ProductService(apiService: apiService);
      final categories = await productService.getCategories();
      setState(() {
        _availableCategories = categories;
        if (_selectedCategory.isEmpty && categories.isNotEmpty) {
          _selectedCategory = categories[0];
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading categories: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _compareAtPriceController.dispose();
    _stockQuantityController.dispose();
    _dosageFormController.dispose();
    _strengthController.dispose();
    _manufacturerController.dispose();
    super.dispose();
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();
      final productData = {
        'name': _nameController.text.trim(),
        'description': _descriptionController.text.trim(),
        'price': double.parse(_priceController.text.trim()),
        'compareAtPrice': _compareAtPriceController.text.isEmpty
            ? null
            : double.parse(_compareAtPriceController.text.trim()),
        'category': _selectedCategory,
        'stockQuantity': int.parse(_stockQuantityController.text.trim()),
        'inStock': _inStock,
        'dosageForm': _dosageFormController.text.isEmpty
            ? null
            : _dosageFormController.text.trim(),
        'strength': _strengthController.text.isEmpty
            ? null
            : _strengthController.text.trim(),
        'manufacturer': _manufacturerController.text.isEmpty
            ? null
            : _manufacturerController.text.trim(),
        'requiresPrescription': _requiresPrescription,
        'images': _images,
      };

      if (widget.product != null) {
        // Update existing product
        await apiService.put(
          '${ApiEndpoints.products}/${widget.product!.id}',
          body: productData,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Product updated successfully'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      } else {
        // Create new product
        await apiService.post(
          ApiEndpoints.products,
          body: productData,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Product created successfully'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      }

      if (mounted) {
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving product: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  String? _validateRequired(String? value) {
    if (value == null || value.isEmpty) {
      return 'This field is required';
    }
    return null;
  }

  String? _validatePrice(String? value) {
    if (value == null || value.isEmpty) {
      return 'Price is required';
    }
    try {
      double.parse(value);
      return null;
    } catch (e) {
      return 'Please enter a valid price';
    }
  }

  String? _validateQuantity(String? value) {
    if (value == null || value.isEmpty) {
      return 'Quantity is required';
    }
    try {
      int.parse(value);
      return null;
    } catch (e) {
      return 'Please enter a valid quantity';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditMode = widget.product != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditMode ? 'Edit Product' : 'Add Product'),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Basic Information Section
              SectionHeader(
                title: 'Basic Information',
                padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
              ),

              PharmaTextField(
                label: 'Product Name',
                hint: 'e.g., Paracetamol 500mg',
                controller: _nameController,
                validator: _validateRequired,
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              PharmaTextField(
                label: 'Description',
                hint: 'Describe your product...',
                controller: _descriptionController,
                validator: _validateRequired,
                maxLines: 4,
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              // Pricing Section
              SectionHeader(
                title: 'Pricing',
                padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
              ),

              Row(
                children: [
                  Expanded(
                    child: PharmaTextField(
                      label: 'Price (₦)',
                      hint: '0.00',
                      controller: _priceController,
                      validator: _validatePrice,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                  const SizedBox(width: UIConstants.paddingMedium),
                  Expanded(
                    child: PharmaTextField(
                      label: 'Compare at Price (₦)',
                      hint: 'Optional',
                      controller: _compareAtPriceController,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              // Category & Stock Section
              SectionHeader(
                title: 'Category & Stock',
                padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
              ),

              PharmaTextField(
                label: 'Category',
                hint: 'Select a category',
                controller: TextEditingController(text: _selectedCategory),
                enabled: false,
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              PharmaTextField(
                label: 'Stock Quantity',
                hint: '0',
                controller: _stockQuantityController,
                validator: _validateQuantity,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              // Stock Status Toggle
              PharmaCard(
                padding: const EdgeInsets.all(UIConstants.paddingMedium),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'In Stock',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.neutral900,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    Switch(
                      value: _inStock,
                      onChanged: (value) {
                        setState(() => _inStock = value);
                      },
                      activeColor: AppColors.primary600,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              // Medical Information Section
              SectionHeader(
                title: 'Medical Information',
                padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
              ),

              PharmaTextField(
                label: 'Dosage Form',
                hint: 'e.g., Tablet, Capsule, Liquid',
                controller: _dosageFormController,
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              PharmaTextField(
                label: 'Strength',
                hint: 'e.g., 500mg, 10ml',
                controller: _strengthController,
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              PharmaTextField(
                label: 'Manufacturer',
                hint: 'e.g., Novartis',
                controller: _manufacturerController,
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              // Prescription Toggle
              PharmaCard(
                padding: const EdgeInsets.all(UIConstants.paddingMedium),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Requires Prescription',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppColors.neutral900,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: UIConstants.paddingSmall),
                        Text(
                          'Mark if this product requires a prescription',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.neutral600,
                              ),
                        ),
                      ],
                    ),
                    Switch(
                      value: _requiresPrescription,
                      onChanged: (value) {
                        setState(() => _requiresPrescription = value);
                      },
                      activeColor: AppColors.primary600,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: UIConstants.paddingMedium),

              // Image Upload Section
              SectionHeader(
                title: 'Product Images',
                padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
              ),

              PharmaCard(
                padding: const EdgeInsets.all(UIConstants.paddingMedium),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_images.isNotEmpty)
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: UIConstants.paddingSmall,
                          mainAxisSpacing: UIConstants.paddingSmall,
                        ),
                        itemCount: _images.length + 1,
                        itemBuilder: (context, index) {
                          if (index < _images.length) {
                            return Stack(
                              children: [
                                Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(
                                      UIConstants.borderRadiusMedium,
                                    ),
                                    image: DecorationImage(
                                      image: NetworkImage(_images[index]),
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 0,
                                  right: 0,
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _images.removeAt(index);
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(2),
                                      decoration: const BoxDecoration(
                                        color: AppColors.error,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        color: AppColors.neutralWhite,
                                        size: 14,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          }

                          return Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(
                                UIConstants.borderRadiusMedium,
                              ),
                              border: Border.all(
                                color: AppColors.neutral300,
                                width: 2,
                              ),
                            ),
                            child: Icon(
                              Icons.add_rounded,
                              color: AppColors.neutral400,
                              size: 32,
                            ),
                          );
                        },
                      )
                    else
                      GestureDetector(
                        onTap: () {
                          // Image upload implementation would go here
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Image upload feature coming soon',
                              ),
                            ),
                          );
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(UIConstants.paddingLarge),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(
                              UIConstants.borderRadiusMedium,
                            ),
                            border: Border.all(
                              color: AppColors.neutral300,
                              width: 2,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.image_outlined,
                                size: 48,
                                color: AppColors.neutral400,
                              ),
                              const SizedBox(height: UIConstants.paddingSmall),
                              Text(
                                'Add Product Images',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      color: AppColors.neutral600,
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Tap to upload images',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: AppColors.neutral500,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: UIConstants.paddingXLarge),

              // Save button
              SizedBox(
                width: double.infinity,
                height: UIConstants.buttonHeightMedium,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProduct,
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.neutralWhite,
                            ),
                          ),
                        )
                      : Text(isEditMode ? 'Update Product' : 'Add Product'),
                ),
              ),
              const SizedBox(height: UIConstants.paddingLarge),
            ],
          ),
        ),
      ),
    );
  }
}
