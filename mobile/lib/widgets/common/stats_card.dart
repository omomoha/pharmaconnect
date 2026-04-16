import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import 'app_card.dart';

enum TrendDirection { up, down, neutral }

class StatsCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final Color iconColor;
  final TrendDirection? trend;
  final String? trendValue;

  const StatsCard({
    Key? key,
    required this.title,
    required this.value,
    this.subtitle,
    required this.icon,
    this.iconColor = AppColors.primary600,
    this.trend,
    this.trendValue,
  }) : super(key: key);

  Color _getTrendColor() {
    switch (trend) {
      case TrendDirection.up:
        return AppColors.success;
      case TrendDirection.down:
        return AppColors.error;
      case TrendDirection.neutral:
      case null:
        return AppColors.neutral500;
    }
  }

  IconData _getTrendIcon() {
    switch (trend) {
      case TrendDirection.up:
        return Icons.trending_up_rounded;
      case TrendDirection.down:
        return Icons.trending_down_rounded;
      case TrendDirection.neutral:
      case null:
        return Icons.remove_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final trendColor = _getTrendColor();
    final trendIcon = _getTrendIcon();

    return PharmaCard(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      borderRadius: UIConstants.borderRadiusLarge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon container at top left
          Container(
            padding: const EdgeInsets.all(UIConstants.paddingSmall),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: UIConstants.iconSizeLarge,
            ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          // Title
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.neutral600,
                  fontWeight: FontWeight.w500,
                ),
          ),
          const SizedBox(height: 4),
          // Main value
          Text(
            value,
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w700,
                ),
          ),
          if (subtitle != null || trend != null) ...[
            const SizedBox(height: UIConstants.paddingSmall),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (subtitle != null)
                  Expanded(
                    child: Text(
                      subtitle!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                if (trend != null && trendValue != null) ...[
                  const SizedBox(width: UIConstants.paddingSmall),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingSmall,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: trendColor.withOpacity(0.1),
                      borderRadius:
                          BorderRadius.circular(UIConstants.borderRadiusSmall),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          trendIcon,
                          size: 14,
                          color: trendColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          trendValue!,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: trendColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }
}
