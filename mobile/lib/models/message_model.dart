class MessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderRole;
  final String content;
  final String? imageUrl;
  final bool isRead;
  final bool isFlagged;
  final DateTime createdAt;

  MessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderRole,
    required this.content,
    this.imageUrl,
    this.isRead = false,
    this.isFlagged = false,
    required this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] ?? '',
      conversationId: json['conversationId'] ?? '',
      senderId: json['senderId'] ?? '',
      senderRole: json['senderRole'] ?? 'customer',
      content: json['content'] ?? '',
      imageUrl: json['imageUrl'],
      isRead: json['isRead'] ?? false,
      isFlagged: json['isFlagged'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'senderRole': senderRole,
      'content': content,
      'imageUrl': imageUrl,
      'isRead': isRead,
      'isFlagged': isFlagged,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  bool isMine(String currentUserId) => senderId == currentUserId;
}
