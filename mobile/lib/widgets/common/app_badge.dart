import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color backgroundColor;
  final double fontSize;
  final double padding;
  final double borderRadius;

  const StatusBadge({
    Key? key,
    required this.label,
    required this.color,
    required this.backgroundColor,
    this.fontSize = 12,
    this.padding = UIConstants.paddingSmall,
    this.borderRadius = UIConstants.borderRadiusSmall,
  }) : super(key: key);

  factory StatusBadge.pending({String label = 'Pending'}) {
    return StatusBadge(
      label: label,
      color: AppColors.warning,
      backgroundColor: AppColors.warningLight,
    );
  }

  factory StatusBadge.approved({String label = 'Approved'}) {
    return StatusBadge(
      label: label,
      color: AppColors.success,
      backgroundColor: AppColors.successLight,
    );
  }

  factory StatusBadge.rejected({String label = 'Rejected'}) {
    return StatusBadge(
      label: label,
      color: AppColors.error,
      backgroundColor: AppColors.errorLight,
    );
  }

  factory StatusBadge.active({String label = 'Active'}) {
    return StatusBadge(
      label: label,
      color: AppColors.secondary600,
      backgroundColor: AppColors.secondary100,
    );
  }

  factory StatusBadge.completed({String label = 'Completed'}) {
    return StatusBadge(
      label: label,
      color: AppColors.success,
      backgroundColor: AppColors.successLight,
    );
  }

  factory StatusBadge.cancelled({String label = 'Cancelled'}) {
    return StatusBadge(
      label: label,
      color: AppColors.neutral600,
      backgroundColor: AppColors.neutral200,
    );
  }

  factory StatusBadge.processing({String label = 'Processing'}) {
    return StatusBadge(
      label: label,
      color: AppColors.info,
      backgroundColor: AppColors.infoLight,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: padding + 4,
        vertical: padding - 2,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
