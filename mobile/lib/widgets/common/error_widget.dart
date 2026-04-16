import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import 'app_button.dart';

class AppErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final String? retryLabel;
  final IconData icon;
  final Color iconColor;
  final double iconSize;

  const AppErrorWidget({
    Key? key,
    required this.message,
    this.onRetry,
    this.retryLabel,
    this.icon = Icons.error_outline_rounded,
    this.iconColor = AppColors.error,
    this.iconSize = 64,
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
              // Error Icon
              Icon(
                icon,
                size: iconSize,
                color: iconColor,
              ),
              const SizedBox(height: UIConstants.paddingMedium),
              // Error Message
              Text(
                'Oops! Something went wrong',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.neutral900,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: UIConstants.paddingSmall),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutral600,
                    ),
              ),
              // Retry Button
              if (onRetry != null) ...[
                const SizedBox(height: UIConstants.paddingLarge),
                PharmaButton(
                  label: retryLabel ?? 'Try Again',
                  onPressed: onRetry,
                  size: ButtonSize.medium,
                  variant: ButtonVariant.primary,
                  icon: Icons.refresh_rounded,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
