import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/models/conversation_model.dart';
import 'package:pharmaconnect/models/message_model.dart';
import 'package:pharmaconnect/services/chat_service.dart';
import 'package:pharmaconnect/services/socket_service.dart';
import 'package:pharmaconnect/widgets/chat/chat_bubble.dart';
import 'package:pharmaconnect/widgets/chat/chat_input.dart';
import 'package:pharmaconnect/widgets/chat/typing_indicator.dart';

class ChatScreen extends StatefulWidget {
  final String conversationId;

  const ChatScreen({super.key, required this.conversationId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatService _chatService = ChatService();
  final SocketService _socketService = SocketService();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _imagePicker = ImagePicker();

  ConversationModel? _conversation;
  List<MessageModel> _messages = [];
  bool _isLoading = true;
  bool _isOtherTyping = false;
  String? _error;
  Timer? _typingResetTimer;

  String get _currentUserId =>
      FirebaseAuth.instance.currentUser?.uid ?? '';

  @override
  void initState() {
    super.initState();
    _loadConversation();
    _connectSocket();
  }

  Future<void> _loadConversation() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final result =
          await _chatService.getConversation(widget.conversationId);
      if (!mounted) return;

      setState(() {
        _conversation =
            result['conversation'] as ConversationModel;
        _messages = result['messages'] as List<MessageModel>;
        _isLoading = false;
      });

      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load chat';
        _isLoading = false;
      });
    }
  }

  void _connectSocket() {
    // Join the chat room
    _socketService.joinChatRoom(widget.conversationId);

    // Listen for incoming messages
    _socketService.on(SocketEvents.chatMessageReceive, _onMessageReceived);

    // Listen for typing indicators
    _socketService.on(SocketEvents.chatTyping, _onTyping);
    _socketService.on(SocketEvents.chatStoppedTyping, _onStoppedTyping);

    // Listen for read receipts
    _socketService.on(SocketEvents.chatMessageRead, _onMessageRead);
  }

  void _onMessageReceived(dynamic data) {
    if (!mounted) return;
    final messageData = data['message'] ?? data;
    if (messageData is Map<String, dynamic>) {
      final message = MessageModel.fromJson(messageData);
      setState(() {
        _messages.add(message);
      });
      _scrollToBottom();

      // Auto mark as read if from other user
      if (message.senderId != _currentUserId) {
        _socketService.markMessageRead(
            widget.conversationId, message.id);
      }
    }
  }

  void _onTyping(dynamic data) {
    if (!mounted) return;
    final userId = data['userId'];
    if (userId != _currentUserId) {
      setState(() => _isOtherTyping = true);
      _typingResetTimer?.cancel();
      _typingResetTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) setState(() => _isOtherTyping = false);
      });
    }
  }

  void _onStoppedTyping(dynamic data) {
    if (!mounted) return;
    final userId = data['userId'];
    if (userId != _currentUserId) {
      setState(() => _isOtherTyping = false);
    }
  }

  void _onMessageRead(dynamic data) {
    if (!mounted) return;
    final messageId = data['messageId'];
    if (messageId != null) {
      setState(() {
        final idx = _messages.indexWhere((m) => m.id == messageId);
        if (idx != -1) {
          final old = _messages[idx];
          _messages[idx] = MessageModel(
            id: old.id,
            conversationId: old.conversationId,
            senderId: old.senderId,
            senderRole: old.senderRole,
            content: old.content,
            imageUrl: old.imageUrl,
            isRead: true,
            isFlagged: old.isFlagged,
            createdAt: old.createdAt,
          );
        }
      });
    }
  }

  void _sendMessage(String content) {
    // Send via socket for real-time delivery
    _socketService.sendMessage(widget.conversationId, content);

    // Optimistically add the message
    final optimisticMessage = MessageModel(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: widget.conversationId,
      senderId: _currentUserId,
      senderRole: 'customer',
      content: content,
      isRead: false,
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.add(optimisticMessage);
    });
    _scrollToBottom();
  }

  Future<void> _attachImage() async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      imageQuality: 80,
    );
    if (picked != null) {
      // For now, show a snackbar — image upload endpoint needed
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Image upload coming soon'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _socketService.leaveChatRoom(widget.conversationId);
    _socketService.off(SocketEvents.chatMessageReceive);
    _socketService.off(SocketEvents.chatTyping);
    _socketService.off(SocketEvents.chatStoppedTyping);
    _socketService.off(SocketEvents.chatMessageRead);
    _typingResetTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: Column(
        children: [
          Expanded(child: _buildMessageList()),
          if (_isOtherTyping) const TypingIndicator(),
          ChatInput(
            onSend: _sendMessage,
            onAttachImage: _attachImage,
            onTypingStarted: () =>
                _socketService.sendTyping(widget.conversationId),
            onTypingStopped: () =>
                _socketService.sendStoppedTyping(widget.conversationId),
            enabled: _conversation?.isActive ?? false,
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    final otherName = _conversation?.getOtherParticipantName(_currentUserId);
    final isPharmacy =
        _conversation?.type == ConversationType.customerPharmacy;

    return AppBar(
      titleSpacing: 0,
      title: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor:
                isPharmacy == true ? AppColors.primary50 : AppColors.secondary50,
            child: Icon(
              isPharmacy == true
                  ? Icons.local_pharmacy
                  : Icons.delivery_dining,
              size: 18,
              color: isPharmacy == true
                  ? AppColors.primary600
                  : AppColors.secondary600,
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                otherName ?? 'Chat',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              if (_isOtherTyping)
                Text(
                  'typing...',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.primary600,
                    fontWeight: FontWeight.w400,
                  ),
                )
              else if (_socketService.isConnected)
                const Text(
                  'Online',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.success,
                    fontWeight: FontWeight.w400,
                  ),
                ),
            ],
          ),
        ],
      ),
      actions: [
        if (_conversation != null && _conversation!.isActive)
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'close') {
                _showCloseDialog();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'close',
                child: Row(
                  children: [
                    Icon(Icons.close, size: 18),
                    SizedBox(width: 8),
                    Text('Close Conversation'),
                  ],
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildMessageList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text(_error!),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadConversation,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_outlined, size: 64, color: AppColors.neutral300),
            const SizedBox(height: 12),
            Text(
              'No messages yet',
              style: TextStyle(color: AppColors.neutral500, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              'Send a message to start the conversation',
              style: TextStyle(color: AppColors.neutral400, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final isMine = message.isMine(_currentUserId);

        // Show date separator
        final showDate = index == 0 ||
            !_isSameDay(
                _messages[index - 1].createdAt, message.createdAt);

        return Column(
          children: [
            if (showDate) _buildDateSeparator(message.createdAt),
            ChatBubble(
              message: message,
              isMine: isMine,
            ),
          ],
        );
      },
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    String label;
    if (_isSameDay(date, now)) {
      label = 'Today';
    } else if (_isSameDay(date, now.subtract(const Duration(days: 1)))) {
      label = 'Yesterday';
    } else {
      label = '${date.day}/${date.month}/${date.year}';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.neutral200,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.neutral600,
            ),
          ),
        ),
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  void _showCloseDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Close Conversation'),
        content: const Text(
            'Are you sure you want to close this conversation? You can still view the message history.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _chatService
                  .closeConversation(widget.conversationId);
              if (mounted) Navigator.of(context).pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
