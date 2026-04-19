import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/models/notification_model.dart';
import 'package:pharmaconnect/services/notification_service.dart';
import 'package:pharmaconnect/widgets/common/empty_state.dart';
import 'package:intl/intl.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationService _notificationService = NotificationService();

  @override
  void initState() {
    super.initState();
    _notificationService.addListener(_onUpdate);
  }

  void _onUpdate() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _notificationService.removeListener(_onUpdate);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final notifications = _notificationService.notifications;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notifications.isNotEmpty)
            TextButton(
              onPressed: () {
                _notificationService.markAllAsRead();
              },
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: SafeArea(
        child: notifications.isEmpty
            ? const EmptyState(
                icon: Icons.notifications_none,
                title: 'No notifications',
                subtitle: 'You\'ll see order updates, messages, and delivery alerts here.',
              )
            : ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: notifications.length,
                separatorBuilder: (_, __) =>
                    const Divider(height: 1, indent: 72, endIndent: 16),
                itemBuilder: (context, index) {
                  return _NotificationTile(
                    notification: notifications[index],
                    onTap: () => _handleTap(notifications[index]),
                  );
                },
              ),
      ),
    );
  }

  void _handleTap(NotificationModel notification) {
    // Mark as read
    if (!notification.isRead) {
      _notificationService.markAsRead(notification.id);
    }

    // Navigate based on type
    final data = notification.data;
    switch (notification.type) {
      case 'order_update':
        final orderId = data['orderId'] as String?;
        if (orderId != null) {
          context.push('/customer/orders/$orderId');
        }
        break;
      case 'chat_message':
        final conversationId = data['conversationId'] as String?;
        if (conversationId != null) {
          context.push('/chat/$conversationId');
        }
        break;
      case 'delivery_update':
        final assignmentId = data['assignmentId'] as String?;
        if (assignmentId != null) {
          context.push('/delivery/track/$assignmentId');
        }
        break;
      default:
        break;
    }
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.notification,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: CircleAvatar(
        radius: 22,
        backgroundColor: _bgColor.withOpacity(0.15),
        child: Icon(_icon, color: _bgColor, size: 22),
      ),
      title: Text(
        notification.title,
        style: TextStyle(
          fontWeight:
              notification.isRead ? FontWeight.w400 : FontWeight.w600,
          fontSize: 14,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 2),
          Text(
            notification.body,
            style: TextStyle(
              color: AppColors.neutral600,
              fontSize: 13,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            _formatTime(notification.createdAt),
            style: TextStyle(
              color: AppColors.neutral400,
              fontSize: 11,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
      trailing: notification.isRead
          ? null
          : Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.primary600,
                shape: BoxShape.circle,
              ),
            ),
      onTap: onTap,
    );
  }

  IconData get _icon {
    switch (notification.type) {
      case 'order_update':
        return Icons.shopping_bag_outlined;
      case 'chat_message':
        return Icons.chat_bubble_outline;
      case 'delivery_update':
        return Icons.local_shipping_outlined;
      case 'system':
        return Icons.info_outline;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color get _bgColor {
    switch (notification.type) {
      case 'order_update':
        return AppColors.secondary600;
      case 'chat_message':
        return AppColors.primary600;
      case 'delivery_update':
        return AppColors.warning;
      case 'system':
        return AppColors.info;
      default:
        return AppColors.neutral600;
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d').format(dateTime);
  }
}
