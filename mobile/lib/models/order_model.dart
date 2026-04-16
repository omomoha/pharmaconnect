import 'package:cloud_firestore/cloud_firestore.dart';

enum OrderStatus {
  pending('pending'),
  confirmed('confirmed'),
  preparing('preparing'),
  ready('ready'),
  outForDelivery('outForDelivery'),
  delivered('delivered'),
  cancelled('cancelled');

  final String value;
  const OrderStatus(this.value);

  static OrderStatus fromString(String value) {
    return OrderStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => OrderStatus.pending,
    );
  }

  String get displayName {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.preparing:
        return 'Preparing';
      case OrderStatus.ready:
        return 'Ready for Delivery';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class OrderItem {
  final String productId;
  final String productName;
  final int quantity;
  final double price;
  final String? imageUrl;

  OrderItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.price,
    this.imageUrl,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: json['productId'] as String,
      productName: json['productName'] as String,
      quantity: json['quantity'] as int,
      price: (json['price'] as num).toDouble(),
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'productName': productName,
      'quantity': quantity,
      'price': price,
      'imageUrl': imageUrl,
    };
  }

  double get subtotal => price * quantity;

  OrderItem copyWith({
    String? productId,
    String? productName,
    int? quantity,
    double? price,
    String? imageUrl,
  }) {
    return OrderItem(
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      quantity: quantity ?? this.quantity,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderItem &&
          runtimeType == other.runtimeType &&
          productId == other.productId;

  @override
  int get hashCode => productId.hashCode;
}

class TrackingInfo {
  final String? deliveryRiderId;
  final String? deliveryRiderName;
  final String? deliveryRiderPhone;
  final String? vehicleInfo;
  final double? currentLatitude;
  final double? currentLongitude;
  final DateTime? estimatedDeliveryTime;
  final List<TrackingEvent>? events;

  TrackingInfo({
    this.deliveryRiderId,
    this.deliveryRiderName,
    this.deliveryRiderPhone,
    this.vehicleInfo,
    this.currentLatitude,
    this.currentLongitude,
    this.estimatedDeliveryTime,
    this.events,
  });

  factory TrackingInfo.fromJson(Map<String, dynamic> json) {
    return TrackingInfo(
      deliveryRiderId: json['deliveryRiderId'] as String?,
      deliveryRiderName: json['deliveryRiderName'] as String?,
      deliveryRiderPhone: json['deliveryRiderPhone'] as String?,
      vehicleInfo: json['vehicleInfo'] as String?,
      currentLatitude:
          (json['currentLatitude'] as num?)?.toDouble(),
      currentLongitude:
          (json['currentLongitude'] as num?)?.toDouble(),
      estimatedDeliveryTime: json['estimatedDeliveryTime'] != null
          ? _parseDateTime(json['estimatedDeliveryTime'])
          : null,
      events: json['events'] != null
          ? (json['events'] as List<dynamic>)
              .map((e) => TrackingEvent.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'deliveryRiderId': deliveryRiderId,
      'deliveryRiderName': deliveryRiderName,
      'deliveryRiderPhone': deliveryRiderPhone,
      'vehicleInfo': vehicleInfo,
      'currentLatitude': currentLatitude,
      'currentLongitude': currentLongitude,
      'estimatedDeliveryTime': estimatedDeliveryTime?.toIso8601String(),
      'events': events?.map((e) => e.toJson()).toList(),
    };
  }

  TrackingInfo copyWith({
    String? deliveryRiderId,
    String? deliveryRiderName,
    String? deliveryRiderPhone,
    String? vehicleInfo,
    double? currentLatitude,
    double? currentLongitude,
    DateTime? estimatedDeliveryTime,
    List<TrackingEvent>? events,
  }) {
    return TrackingInfo(
      deliveryRiderId: deliveryRiderId ?? this.deliveryRiderId,
      deliveryRiderName: deliveryRiderName ?? this.deliveryRiderName,
      deliveryRiderPhone: deliveryRiderPhone ?? this.deliveryRiderPhone,
      vehicleInfo: vehicleInfo ?? this.vehicleInfo,
      currentLatitude: currentLatitude ?? this.currentLatitude,
      currentLongitude: currentLongitude ?? this.currentLongitude,
      estimatedDeliveryTime:
          estimatedDeliveryTime ?? this.estimatedDeliveryTime,
      events: events ?? this.events,
    );
  }
}

class TrackingEvent {
  final String status;
  final String? description;
  final DateTime timestamp;
  final double? latitude;
  final double? longitude;

  TrackingEvent({
    required this.status,
    this.description,
    required this.timestamp,
    this.latitude,
    this.longitude,
  });

  factory TrackingEvent.fromJson(Map<String, dynamic> json) {
    return TrackingEvent(
      status: json['status'] as String,
      description: json['description'] as String?,
      timestamp: _parseDateTime(json['timestamp']),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'description': description,
      'timestamp': timestamp.toIso8601String(),
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}

class OrderModel {
  final String id;
  final String userId;
  final String pharmacyId;
  final String pharmacyName;
  final List<OrderItem> items;
  final double subtotal;
  final double deliveryFee;
  final double serviceFee;
  final double total;
  final OrderStatus status;
  final String? paymentMethod;
  final String? paymentReference;
  final String deliveryAddress;
  final String? deliveryProviderId;
  final TrackingInfo? trackingInfo;
  final DateTime createdAt;
  final DateTime updatedAt;

  OrderModel({
    required this.id,
    required this.userId,
    required this.pharmacyId,
    required this.pharmacyName,
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.serviceFee,
    required this.total,
    this.status = OrderStatus.pending,
    this.paymentMethod,
    this.paymentReference,
    required this.deliveryAddress,
    this.deliveryProviderId,
    this.trackingInfo,
    required this.createdAt,
    required this.updatedAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      pharmacyId: json['pharmacyId'] as String,
      pharmacyName: json['pharmacyName'] as String,
      items: (json['items'] as List<dynamic>)
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: (json['subtotal'] as num).toDouble(),
      deliveryFee: (json['deliveryFee'] as num).toDouble(),
      serviceFee: (json['serviceFee'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      status: OrderStatus.fromString(json['status'] as String? ?? 'pending'),
      paymentMethod: json['paymentMethod'] as String?,
      paymentReference: json['paymentReference'] as String?,
      deliveryAddress: json['deliveryAddress'] as String,
      deliveryProviderId: json['deliveryProviderId'] as String?,
      trackingInfo: json['trackingInfo'] != null
          ? TrackingInfo.fromJson(json['trackingInfo'] as Map<String, dynamic>)
          : null,
      createdAt: _parseDateTime(json['createdAt']),
      updatedAt: _parseDateTime(json['updatedAt']),
    );
  }

  factory OrderModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data()!;
    return OrderModel(
      id: doc.id,
      userId: data['userId'] as String,
      pharmacyId: data['pharmacyId'] as String,
      pharmacyName: data['pharmacyName'] as String,
      items: (data['items'] as List<dynamic>)
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: (data['subtotal'] as num).toDouble(),
      deliveryFee: (data['deliveryFee'] as num).toDouble(),
      serviceFee: (data['serviceFee'] as num).toDouble(),
      total: (data['total'] as num).toDouble(),
      status: OrderStatus.fromString(data['status'] as String? ?? 'pending'),
      paymentMethod: data['paymentMethod'] as String?,
      paymentReference: data['paymentReference'] as String?,
      deliveryAddress: data['deliveryAddress'] as String,
      deliveryProviderId: data['deliveryProviderId'] as String?,
      trackingInfo: data['trackingInfo'] != null
          ? TrackingInfo.fromJson(data['trackingInfo'] as Map<String, dynamic>)
          : null,
      createdAt: _parseDateTime(data['createdAt']),
      updatedAt: _parseDateTime(data['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'pharmacyId': pharmacyId,
      'pharmacyName': pharmacyName,
      'items': items.map((e) => e.toJson()).toList(),
      'subtotal': subtotal,
      'deliveryFee': deliveryFee,
      'serviceFee': serviceFee,
      'total': total,
      'status': status.value,
      'paymentMethod': paymentMethod,
      'paymentReference': paymentReference,
      'deliveryAddress': deliveryAddress,
      'deliveryProviderId': deliveryProviderId,
      'trackingInfo': trackingInfo?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'pharmacyId': pharmacyId,
      'pharmacyName': pharmacyName,
      'items': items.map((e) => e.toJson()).toList(),
      'subtotal': subtotal,
      'deliveryFee': deliveryFee,
      'serviceFee': serviceFee,
      'total': total,
      'status': status.value,
      'paymentMethod': paymentMethod,
      'paymentReference': paymentReference,
      'deliveryAddress': deliveryAddress,
      'deliveryProviderId': deliveryProviderId,
      'trackingInfo': trackingInfo?.toJson(),
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  OrderModel copyWith({
    String? id,
    String? userId,
    String? pharmacyId,
    String? pharmacyName,
    List<OrderItem>? items,
    double? subtotal,
    double? deliveryFee,
    double? serviceFee,
    double? total,
    OrderStatus? status,
    String? paymentMethod,
    String? paymentReference,
    String? deliveryAddress,
    String? deliveryProviderId,
    TrackingInfo? trackingInfo,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return OrderModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      pharmacyId: pharmacyId ?? this.pharmacyId,
      pharmacyName: pharmacyName ?? this.pharmacyName,
      items: items ?? this.items,
      subtotal: subtotal ?? this.subtotal,
      deliveryFee: deliveryFee ?? this.deliveryFee,
      serviceFee: serviceFee ?? this.serviceFee,
      total: total ?? this.total,
      status: status ?? this.status,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentReference: paymentReference ?? this.paymentReference,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      deliveryProviderId: deliveryProviderId ?? this.deliveryProviderId,
      trackingInfo: trackingInfo ?? this.trackingInfo,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderModel &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          userId == other.userId;

  @override
  int get hashCode => id.hashCode ^ userId.hashCode;

  @override
  String toString() {
    return 'OrderModel(id: $id, status: ${status.value}, total: $total, '
        'itemCount: $itemCount, createdAt: $createdAt)';
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
