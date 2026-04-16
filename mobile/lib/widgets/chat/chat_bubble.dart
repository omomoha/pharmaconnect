import 'package:flutter/material.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/models/message_model.dart';
import 'package:intl/intl.dart';

class ChatBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMine;
  final bool showTimestamp;

  const ChatBubble({
    super.key,
    required this.message,
    required this.isMine,
    this.showTimestamp = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Row(
        mainAxisAlignment:
            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMine) const SizedBox(width: 4),
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isMine
                    ? AppColors.primary600
                    : AppColors.neutral100,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMine ? 16 : 4),
                  bottomRight: Radius.circular(isMine ? 4 : 16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // Image attachment
                  if (message.imageUrl != null && message.imageUrl!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          message.imageUrl!,
                          width: 200,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 200,
                            height: 100,
                            color: AppColors.neutral200,
                            child: const Icon(Icons.broken_image_outlined),
                          ),
                        ),
                      ),
                    ),

                  // Message text
                  if (message.content.isNotEmpty)
                    Text(
                      message.content,
                      style: TextStyle(
                        color: isMine
                            ? AppColors.neutralWhite
                            : AppColors.neutral900,
                        fontSize: 15,
                        height: 1.35,
                      ),
                    ),

                  // Timestamp + read status
                  if (showTimestamp) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatTime(message.createdAt),
                          style: TextStyle(
                            color: isMine
                                ? AppColors.neutralWhite.withOpacity(0.7)
                                : AppColors.neutral500,
                            fontSize: 11,
                          ),
                        ),
                        if (isMine) ...[
                          const SizedBox(width: 3),
                          Icon(
                            message.isRead
                                ? Icons.done_all
                                : Icons.done,
                            size: 14,
                            color: message.isRead
                                ? Colors.lightBlueAccent
                                : AppColors.neutralWhite.withOpacity(0.7),
                          ),
                        ],
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (isMine) const SizedBox(width: 4),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    if (dateTime.day == now.day &&
        dateTime.month == now.month &&
        dateTime.year == now.year) {
      return DateFormat.jm().format(dateTime);
    } else if (dateTime.difference(now).inDays.abs() < 7) {
      return DateFormat('E, h:mm a').format(dateTime);
    }
    return DateFormat('MMM d, h:mm a').format(dateTime);
  }
}
