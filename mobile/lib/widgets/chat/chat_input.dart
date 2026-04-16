import 'package:flutter/material.dart';
import 'package:pharmaconnect/config/theme.dart';

class ChatInput extends StatefulWidget {
  final Function(String) onSend;
  final VoidCallback? onAttachImage;
  final VoidCallback? onTypingStarted;
  final VoidCallback? onTypingStopped;
  final bool enabled;

  const ChatInput({
    super.key,
    required this.onSend,
    this.onAttachImage,
    this.onTypingStarted,
    this.onTypingStopped,
    this.enabled = true,
  });

  @override
  State<ChatInput> createState() => _ChatInputState();
}

class _ChatInputState extends State<ChatInput> {
  final TextEditingController _controller = TextEditingController();
  bool _isTyping = false;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    final hasText = _controller.text.trim().isNotEmpty;
    if (hasText != _hasText) {
      setState(() => _hasText = hasText);
    }

    if (hasText && !_isTyping) {
      _isTyping = true;
      widget.onTypingStarted?.call();
    } else if (!hasText && _isTyping) {
      _isTyping = false;
      widget.onTypingStopped?.call();
    }
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    widget.onSend(text);
    _controller.clear();
    _isTyping = false;
    widget.onTypingStopped?.call();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 8,
        right: 8,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: BoxDecoration(
        color: AppColors.neutralWhite,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Attachment button
          if (widget.onAttachImage != null)
            IconButton(
              onPressed: widget.enabled ? widget.onAttachImage : null,
              icon: const Icon(Icons.add_photo_alternate_outlined),
              color: AppColors.neutral600,
              iconSize: 24,
            ),

          // Text input
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: AppColors.neutral50,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.neutral200),
              ),
              child: TextField(
                controller: _controller,
                enabled: widget.enabled,
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
                textInputAction: TextInputAction.newline,
                decoration: const InputDecoration(
                  hintText: 'Type a message...',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  filled: false,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                ),
                style: const TextStyle(fontSize: 15),
              ),
            ),
          ),

          const SizedBox(width: 4),

          // Send button
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            child: IconButton(
              onPressed: (widget.enabled && _hasText) ? _send : null,
              icon: Icon(
                Icons.send_rounded,
                color: _hasText
                    ? AppColors.primary600
                    : AppColors.neutral400,
              ),
              iconSize: 26,
            ),
          ),
        ],
      ),
    );
  }
}
