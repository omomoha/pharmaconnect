import 'package:pharmaconnect/models/conversation_model.dart';
import 'package:pharmaconnect/models/message_model.dart';
import 'api_service.dart';

class ChatService {
  final ApiService _api;

  ChatService({ApiService? apiService}) : _api = apiService ?? ApiService();

  /// Create a new conversation
  Future<ConversationModel> createConversation({
    required String participantId,
    required String type, // 'customer_pharmacy' or 'customer_delivery'
    String? orderId,
  }) async {
    final response = await _api.post(
      '/chat/conversations',
      body: {
        'participantId': participantId,
        'type': type,
        if (orderId != null) 'orderId': orderId,
      },
    );
    return ConversationModel.fromJson(response['data'] ?? response);
  }

  /// Get all conversations for the current user
  Future<List<ConversationModel>> getConversations() async {
    final response = await _api.get('/chat/conversations');
    final data = response['data'] ?? response;
    if (data is List) {
      return data.map((c) => ConversationModel.fromJson(c)).toList();
    }
    return [];
  }

  /// Get a single conversation with its messages
  Future<Map<String, dynamic>> getConversation(String conversationId) async {
    final response = await _api.get('/chat/conversations/$conversationId');
    final data = response['data'] ?? response;

    final conversation = ConversationModel.fromJson(data['conversation'] ?? data);
    final messages = (data['messages'] as List?)
            ?.map((m) => MessageModel.fromJson(m))
            .toList() ??
        [];

    return {
      'conversation': conversation,
      'messages': messages,
    };
  }

  /// Send a message via REST (fallback when socket unavailable)
  Future<MessageModel> sendMessage({
    required String conversationId,
    required String content,
    String? imageUrl,
  }) async {
    final response = await _api.post(
      '/chat/conversations/$conversationId/messages',
      body: {
        'content': content,
        if (imageUrl != null) 'imageUrl': imageUrl,
      },
    );
    return MessageModel.fromJson(response['data'] ?? response);
  }

  /// Mark a message as read
  Future<void> markMessageAsRead({
    required String conversationId,
    required String messageId,
  }) async {
    await _api.patch(
      '/chat/conversations/$conversationId/messages/$messageId/read',
      body: {},
    );
  }

  /// Close a conversation
  Future<void> closeConversation(String conversationId) async {
    await _api.post(
      '/chat/conversations/$conversationId/close',
      body: {},
    );
  }

  /// Get unread message count
  Future<int> getUnreadCount() async {
    final response = await _api.get('/chat/unread-count');
    return response['data']?['count'] ?? response['count'] ?? 0;
  }
}
