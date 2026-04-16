import 'package:cloud_firestore/cloud_firestore.dart';

class OperatingHours {
  final String day;
  final String openTime;
  final String closeTime;
  final bool isOpen;

  OperatingHours({
    required this.day,
    required this.openTime,
    required this.closeTime,
    required this.isOpen,
  });

  factory OperatingHours.fromJson(Map<String, dynamic> json) {
    return OperatingHours(
      day: json['day'] as String,
      openTime: json['openTime'] as String,
      closeTime: json['closeTime'] as String,
      isOpen: json['isOpen'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'day': day,
      'openTime': openTime,
      'closeTime': closeTime,
      'isOpen': isOpen,
    };
  }
}

class PharmacyModel {
  final String id;
  final String name;
  final String description;
  final String address;
  final String city;
  final String state;
  final String phone;
  final String email;
  final String? logoUrl;
  final String? coverImageUrl;
  final double rating;
  final int reviewCount;
  final bool isVerified;
  final bool isOpen;
  final List<OperatingHours>? operatingHours;
  final bool deliveryAvailable;
  final List<String>? categories;
  final DateTime createdAt;

  PharmacyModel({
    required this.id,
    required this.name,
    required this.description,
    required this.address,
    required this.city,
    required this.state,
    required this.phone,
    required this.email,
    this.logoUrl,
    this.coverImageUrl,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.isVerified = false,
    this.isOpen = true,
    this.operatingHours,
    this.deliveryAvailable = true,
    this.categories,
    required this.createdAt,
  });

  factory PharmacyModel.fromJson(Map<String, dynamic> json) {
    return PharmacyModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      address: json['address'] as String,
      city: json['city'] as String,
      state: json['state'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String,
      logoUrl: json['logoUrl'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      isVerified: json['isVerified'] as bool? ?? false,
      isOpen: json['isOpen'] as bool? ?? true,
      operatingHours: json['operatingHours'] != null
          ? (json['operatingHours'] as List<dynamic>)
              .map((e) => OperatingHours.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      deliveryAvailable: json['deliveryAvailable'] as bool? ?? true,
      categories: json['categories'] != null
          ? List<String>.from(json['categories'] as List<dynamic>)
          : null,
      createdAt: _parseDateTime(json['createdAt']),
    );
  }

  factory PharmacyModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data()!;
    return PharmacyModel(
      id: doc.id,
      name: data['name'] as String,
      description: data['description'] as String,
      address: data['address'] as String,
      city: data['city'] as String,
      state: data['state'] as String,
      phone: data['phone'] as String,
      email: data['email'] as String,
      logoUrl: data['logoUrl'] as String?,
      coverImageUrl: data['coverImageUrl'] as String?,
      rating: (data['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: data['reviewCount'] as int? ?? 0,
      isVerified: data['isVerified'] as bool? ?? false,
      isOpen: data['isOpen'] as bool? ?? true,
      operatingHours: data['operatingHours'] != null
          ? (data['operatingHours'] as List<dynamic>)
              .map((e) => OperatingHours.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      deliveryAvailable: data['deliveryAvailable'] as bool? ?? true,
      categories: data['categories'] != null
          ? List<String>.from(data['categories'] as List<dynamic>)
          : null,
      createdAt: _parseDateTime(data['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'address': address,
      'city': city,
      'state': state,
      'phone': phone,
      'email': email,
      'logoUrl': logoUrl,
      'coverImageUrl': coverImageUrl,
      'rating': rating,
      'reviewCount': reviewCount,
      'isVerified': isVerified,
      'isOpen': isOpen,
      'operatingHours': operatingHours?.map((e) => e.toJson()).toList(),
      'deliveryAvailable': deliveryAvailable,
      'categories': categories,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'description': description,
      'address': address,
      'city': city,
      'state': state,
      'phone': phone,
      'email': email,
      'logoUrl': logoUrl,
      'coverImageUrl': coverImageUrl,
      'rating': rating,
      'reviewCount': reviewCount,
      'isVerified': isVerified,
      'isOpen': isOpen,
      'operatingHours': operatingHours?.map((e) => e.toJson()).toList(),
      'deliveryAvailable': deliveryAvailable,
      'categories': categories,
      'createdAt': createdAt,
    };
  }

  PharmacyModel copyWith({
    String? id,
    String? name,
    String? description,
    String? address,
    String? city,
    String? state,
    String? phone,
    String? email,
    String? logoUrl,
    String? coverImageUrl,
    double? rating,
    int? reviewCount,
    bool? isVerified,
    bool? isOpen,
    List<OperatingHours>? operatingHours,
    bool? deliveryAvailable,
    List<String>? categories,
    DateTime? createdAt,
  }) {
    return PharmacyModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      address: address ?? this.address,
      city: city ?? this.city,
      state: state ?? this.state,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      logoUrl: logoUrl ?? this.logoUrl,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      isVerified: isVerified ?? this.isVerified,
      isOpen: isOpen ?? this.isOpen,
      operatingHours: operatingHours ?? this.operatingHours,
      deliveryAvailable: deliveryAvailable ?? this.deliveryAvailable,
      categories: categories ?? this.categories,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PharmacyModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'PharmacyModel(id: $id, name: $name, city: $city, '
        'isVerified: $isVerified, rating: $rating)';
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
