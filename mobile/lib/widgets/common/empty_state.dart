import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import 'app_button.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Color iconColor;
  final double iconSize;

  const EmptyState({
    Key? key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.iconColor = AppColors.neutral300,
    this.iconSize = 80,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: UIConstants.paddingLarge,
            vertical: UIConstants.paddingXLarge,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon
              Icon(
                icon,
                size: iconSize,
                color: iconColor,
              ),
              const SizedBox(height: UIConstants.paddingLarge),
              // Title
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.neutral900,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              // Subtitle
              if (subtitle != null) ...[
                const SizedBox(height: UIConstants.paddingSmall),
                Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.neutral600,
                      ),
                ),
              ],
              // Action button
              if (actionLabel != null && onAction != null) ...[
                const SizedBox(height: UIConstants.paddingLarge),
                PharmaButton(
                  label: actionLabel!,
                  onPressed: onAction,
                  size: ButtonSize.medium,
                  variant: ButtonVariant.primary,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
