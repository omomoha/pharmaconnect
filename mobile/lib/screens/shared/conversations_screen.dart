import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/models/conversation_model.dart';
import 'package:pharmaconnect/services/chat_service.dart';
import 'package:pharmaconnect/services/socket_service.dart';
import 'package:pharmaconnect/widgets/common/empty_state.dart';
import 'package:intl/intl.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  final ChatService _chatService = ChatService();
  final SocketService _socketService = SocketService();
  List<ConversationModel> _conversations = [];
  List<ConversationModel> _filteredConversations = [];
  bool _isLoading = true;
  String? _error;
  bool _isSearching = false;
  late TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _searchController.addListener(_filterConversations);
    _loadConversations();
    _listenForNewMessages();
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterConversations);
    _searchController.dispose();
    _socketService.off(SocketEvents.chatMessageReceive);
    super.dispose();
  }

  Future<void> _loadConversations() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final conversations = await _chatService.getConversations();
      if (!mounted) return;

      setState(() {
        _conversations = conversations;
        _filteredConversations = conversations;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load conversations';
        _isLoading = false;
      });
    }
  }

  void _filterConversations() {
    final query = _searchController.text.toLowerCase();

    setState(() {
      if (query.isEmpty) {
        _filteredConversations = _conversations;
      } else {
        _filteredConversations = _conversations.where((conversation) {
          final currentUserId = FirebaseAuth.instance.currentUser?.uid ?? '';
          final otherName = conversation.getOtherParticipantName(currentUserId).toLowerCase();
          final lastMessage = conversation.lastMessage?.toLowerCase() ?? '';

          return otherName.contains(query) || lastMessage.contains(query);
        }).toList();
      }
    });
  }

  void _toggleSearch() {
    setState(() {
      _isSearching = !_isSearching;
      if (!_isSearching) {
        _searchController.clear();
        _filterConversations();
      }
    });
  }

  void _listenForNewMessages() {
    _socketService.on(SocketEvents.chatMessageReceive, (data) {
      // Refresh the list when a new message comes in
      _loadConversations();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search conversations...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: AppColors.neutral500),
                ),
                autofocus: true,
                style: const TextStyle(color: Colors.black87),
              )
            : const Text('Messages'),
        actions: [
          if (_conversations.isNotEmpty)
            IconButton(
              icon: Icon(_isSearching ? Icons.close : Icons.search),
              onPressed: _toggleSearch,
            ),
        ],
      ),
      body: SafeArea(
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: AppColors.neutral600)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadConversations,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_conversations.isEmpty) {
      return const EmptyState(
        icon: Icons.chat_bubble_outline,
        title: 'No conversations yet',
        subtitle:
            'Start a conversation with a pharmacy or delivery provider from your order details.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadConversations,
      child: _filteredConversations.isEmpty && _searchController.text.isNotEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.search_off,
                    size: 48,
                    color: AppColors.neutral400,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No conversations found',
                    style: TextStyle(
                      color: AppColors.neutral600,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      _searchController.clear();
                      _filterConversations();
                    },
                    child: const Text('Clear search'),
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: _filteredConversations.length,
              separatorBuilder: (_, __) => const Divider(
                height: 1,
                indent: 76,
                endIndent: 16,
              ),
              itemBuilder: (context, index) {
                return _ConversationTile(
                  conversation: _filteredConversations[index],
                  currentUserId: FirebaseAuth.instance.currentUser?.uid ?? '',
                  onTap: () {
                    context.push(
                      '/chat/${_filteredConversations[index].id}',
                    );
                  },
                );
              },
            ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final ConversationModel conversation;
  final String currentUserId;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conversation,
    required this.currentUserId,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final otherName = conversation.getOtherParticipantName(currentUserId);
    final isPharmacy =
        conversation.type == ConversationType.customerPharmacy;
    final hasUnread = conversation.unreadCount > 0;

    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: CircleAvatar(
        radius: 26,
        backgroundColor:
            isPharmacy ? AppColors.primary50 : AppColors.secondary50,
        child: Icon(
          isPharmacy ? Icons.local_pharmacy : Icons.delivery_dining,
          color: isPharmacy ? AppColors.primary600 : AppColors.secondary600,
          size: 22,
        ),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              otherName,
              style: TextStyle(
                fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w500,
                fontSize: 15,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (conversation.lastMessageAt != null)
            Text(
              _formatTimestamp(conversation.lastMessageAt!),
              style: TextStyle(
                fontSize: 12,
                color: hasUnread
                    ? AppColors.primary600
                    : AppColors.neutral500,
                fontWeight:
                    hasUnread ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
        ],
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: Text(
              conversation.lastMessage ?? 'No messages yet',
              style: TextStyle(
                color: hasUnread
                    ? AppColors.neutral800
                    : AppColors.neutral500,
                fontWeight:
                    hasUnread ? FontWeight.w500 : FontWeight.w400,
                fontSize: 13,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (hasUnread)
            Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(
                  horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary600,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                conversation.unreadCount > 99
                    ? '99+'
                    : conversation.unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      onTap: onTap,
    );
  }

  String _formatTimestamp(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return DateFormat.jm().format(dateTime);
    if (diff.inDays < 7) return DateFormat.E().format(dateTime);
    return DateFormat('MMM d').format(dateTime);
  }
}
