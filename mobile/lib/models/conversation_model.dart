import 'message_model.dart';

enum ConversationType { customerPharmacy, customerDelivery }

class ConversationModel {
  final String id;
  final String customerId;
  final String? pharmacyId;
  final String? deliveryRiderId;
  final ConversationType type;
  final String status; // active, closed
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final Map<String, String> participantNames;
  final MessageModel? latestMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  ConversationModel({
    required this.id,
    required this.customerId,
    this.pharmacyId,
    this.deliveryRiderId,
    required this.type,
    this.status = 'active',
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.participantNames = const {},
    this.latestMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['id'] ?? '',
      customerId: json['customerId'] ?? '',
      pharmacyId: json['pharmacyId'],
      deliveryRiderId: json['deliveryRiderId'],
      type: json['type'] == 'customer_delivery'
          ? ConversationType.customerDelivery
          : ConversationType.customerPharmacy,
      status: json['status'] ?? 'active',
      lastMessage: json['lastMessage'],
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.tryParse(json['lastMessageAt'].toString())
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      participantNames:
          Map<String, String>.from(json['participantNames'] ?? {}),
      latestMessage: json['latestMessage'] != null
          ? MessageModel.fromJson(json['latestMessage'])
          : null,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'pharmacyId': pharmacyId,
      'deliveryRiderId': deliveryRiderId,
      'type': type == ConversationType.customerDelivery
          ? 'customer_delivery'
          : 'customer_pharmacy',
      'status': status,
      'lastMessage': lastMessage,
      'unreadCount': unreadCount,
    };
  }

  String getOtherParticipantName(String currentUserId) {
    if (participantNames.isNotEmpty) {
      for (final entry in participantNames.entries) {
        if (entry.key != currentUserId) {
          return entry.value;
        }
      }
    }
    return type == ConversationType.customerPharmacy
        ? 'Pharmacy'
        : 'Delivery Rider';
  }

  bool get isActive => status == 'active';
}
