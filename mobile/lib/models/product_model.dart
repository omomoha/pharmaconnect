import 'package:cloud_firestore/cloud_firestore.dart';

class ProductModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? compareAtPrice;
  final String category;
  final String? subcategory;
  final String pharmacyId;
  final String pharmacyName;
  final List<String> images;
  final bool inStock;
  final int stockQuantity;
  final bool requiresPrescription;
  final String? dosageForm;
  final String? strength;
  final String? manufacturer;
  final List<String>? tags;
  final double rating;
  final int reviewCount;
  final DateTime createdAt;

  ProductModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.compareAtPrice,
    required this.category,
    this.subcategory,
    required this.pharmacyId,
    required this.pharmacyName,
    required this.images,
    required this.inStock,
    required this.stockQuantity,
    required this.requiresPrescription,
    this.dosageForm,
    this.strength,
    this.manufacturer,
    this.tags,
    this.rating = 0.0,
    this.reviewCount = 0,
    required this.createdAt,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      price: (json['price'] as num).toDouble(),
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice'] as num).toDouble()
          : null,
      category: json['category'] as String,
      subcategory: json['subcategory'] as String?,
      pharmacyId: json['pharmacyId'] as String,
      pharmacyName: json['pharmacyName'] as String,
      images: List<String>.from(json['images'] as List<dynamic>? ?? []),
      inStock: json['inStock'] as bool? ?? true,
      stockQuantity: json['stockQuantity'] as int? ?? 0,
      requiresPrescription: json['requiresPrescription'] as bool? ?? false,
      dosageForm: json['dosageForm'] as String?,
      strength: json['strength'] as String?,
      manufacturer: json['manufacturer'] as String?,
      tags: json['tags'] != null
          ? List<String>.from(json['tags'] as List<dynamic>)
          : null,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      createdAt: _parseDateTime(json['createdAt']),
    );
  }

  factory ProductModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data()!;
    return ProductModel(
      id: doc.id,
      name: data['name'] as String,
      description: data['description'] as String,
      price: (data['price'] as num).toDouble(),
      compareAtPrice: data['compareAtPrice'] != null
          ? (data['compareAtPrice'] as num).toDouble()
          : null,
      category: data['category'] as String,
      subcategory: data['subcategory'] as String?,
      pharmacyId: data['pharmacyId'] as String,
      pharmacyName: data['pharmacyName'] as String,
      images: List<String>.from(data['images'] as List<dynamic>? ?? []),
      inStock: data['inStock'] as bool? ?? true,
      stockQuantity: data['stockQuantity'] as int? ?? 0,
      requiresPrescription: data['requiresPrescription'] as bool? ?? false,
      dosageForm: data['dosageForm'] as String?,
      strength: data['strength'] as String?,
      manufacturer: data['manufacturer'] as String?,
      tags: data['tags'] != null
          ? List<String>.from(data['tags'] as List<dynamic>)
          : null,
      rating: (data['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: data['reviewCount'] as int? ?? 0,
      createdAt: _parseDateTime(data['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'compareAtPrice': compareAtPrice,
      'category': category,
      'subcategory': subcategory,
      'pharmacyId': pharmacyId,
      'pharmacyName': pharmacyName,
      'images': images,
      'inStock': inStock,
      'stockQuantity': stockQuantity,
      'requiresPrescription': requiresPrescription,
      'dosageForm': dosageForm,
      'strength': strength,
      'manufacturer': manufacturer,
      'tags': tags,
      'rating': rating,
      'reviewCount': reviewCount,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'description': description,
      'price': price,
      'compareAtPrice': compareAtPrice,
      'category': category,
      'subcategory': subcategory,
      'pharmacyId': pharmacyId,
      'pharmacyName': pharmacyName,
      'images': images,
      'inStock': inStock,
      'stockQuantity': stockQuantity,
      'requiresPrescription': requiresPrescription,
      'dosageForm': dosageForm,
      'strength': strength,
      'manufacturer': manufacturer,
      'tags': tags,
      'rating': rating,
      'reviewCount': reviewCount,
      'createdAt': createdAt,
    };
  }

  ProductModel copyWith({
    String? id,
    String? name,
    String? description,
    double? price,
    double? compareAtPrice,
    String? category,
    String? subcategory,
    String? pharmacyId,
    String? pharmacyName,
    List<String>? images,
    bool? inStock,
    int? stockQuantity,
    bool? requiresPrescription,
    String? dosageForm,
    String? strength,
    String? manufacturer,
    List<String>? tags,
    double? rating,
    int? reviewCount,
    DateTime? createdAt,
  }) {
    return ProductModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      compareAtPrice: compareAtPrice ?? this.compareAtPrice,
      category: category ?? this.category,
      subcategory: subcategory ?? this.subcategory,
      pharmacyId: pharmacyId ?? this.pharmacyId,
      pharmacyName: pharmacyName ?? this.pharmacyName,
      images: images ?? this.images,
      inStock: inStock ?? this.inStock,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      requiresPrescription: requiresPrescription ?? this.requiresPrescription,
      dosageForm: dosageForm ?? this.dosageForm,
      strength: strength ?? this.strength,
      manufacturer: manufacturer ?? this.manufacturer,
      tags: tags ?? this.tags,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductModel &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          pharmacyId == other.pharmacyId;

  @override
  int get hashCode => id.hashCode ^ pharmacyId.hashCode;

  @override
  String toString() {
    return 'ProductModel(id: $id, name: $name, price: $price, '
        'pharmacyId: $pharmacyId, inStock: $inStock)';
  }
}

DateTime _parseDateTime(dynamic value) {
  if (value == null) {
    return DateTime.now();
  }
  if (value is Timestamp) {
    return value.toDate();
  }
  if (value is String) {
    return DateTime.tryParse(value) ?? DateTime.now();
  }
  return DateTime.now();
}
