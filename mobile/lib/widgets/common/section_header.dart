import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final TextStyle? titleStyle;
  final TextStyle? actionStyle;
  final EdgeInsets? padding;

  const SectionHeader({
    Key? key,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.titleStyle,
    this.actionStyle,
    this.padding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ??
          const EdgeInsets.symmetric(
            horizontal: UIConstants.paddingMedium,
            vertical: UIConstants.paddingSmall,
          ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Title
          Expanded(
            child: Text(
              title,
              style: titleStyle ??
                  Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: AppColors.neutral900,
                        fontWeight: FontWeight.w700,
                      ),
            ),
          ),
          // Action link
          if (actionLabel != null && onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel!,
                style: actionStyle ??
                    Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.primary600,
                          fontWeight: FontWeight.w600,
                        ),
              ),
            ),
        ],
      ),
    );
  }
}
