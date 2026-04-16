import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

enum ButtonVariant { primary, secondary, outline, text, danger }

enum ButtonSize { small, medium, large }

class PharmaButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isDisabled;
  final IconData? icon;
  final bool fullWidth;
  final ButtonSize size;
  final ButtonVariant variant;
  final EdgeInsets? padding;

  const PharmaButton({
    Key? key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.fullWidth = false,
    this.size = ButtonSize.medium,
    this.variant = ButtonVariant.primary,
    this.padding,
  }) : super(key: key);

  double _getHeight() {
    switch (size) {
      case ButtonSize.small:
        return UIConstants.buttonHeightSmall;
      case ButtonSize.medium:
        return UIConstants.buttonHeightMedium;
      case ButtonSize.large:
        return UIConstants.buttonHeightLarge;
    }
  }

  double _getFontSize() {
    switch (size) {
      case ButtonSize.small:
        return 12;
      case ButtonSize.medium:
        return 14;
      case ButtonSize.large:
        return 16;
    }
  }

  double _getPaddingHorizontal() {
    switch (size) {
      case ButtonSize.small:
        return 12;
      case ButtonSize.medium:
        return 16;
      case ButtonSize.large:
        return 24;
    }
  }

  Color _getBackgroundColor() {
    if (isDisabled) {
      return AppColors.neutral300;
    }

    switch (variant) {
      case ButtonVariant.primary:
        return AppColors.primary600;
      case ButtonVariant.secondary:
        return AppColors.secondary500;
      case ButtonVariant.danger:
        return AppColors.error;
      case ButtonVariant.outline:
      case ButtonVariant.text:
        return Colors.transparent;
    }
  }

  Color _getForegroundColor() {
    if (isDisabled) {
      return AppColors.neutral500;
    }

    switch (variant) {
      case ButtonVariant.primary:
      case ButtonVariant.secondary:
      case ButtonVariant.danger:
        return AppColors.neutralWhite;
      case ButtonVariant.outline:
        return AppColors.primary600;
      case ButtonVariant.text:
        return AppColors.primary600;
    }
  }

  BorderSide? _getBorderSide() {
    if (variant == ButtonVariant.outline) {
      if (isDisabled) {
        return BorderSide(color: AppColors.neutral300, width: 1.5);
      }
      return BorderSide(color: AppColors.primary600, width: 1.5);
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final height = _getHeight();
    final fontSize = _getFontSize();
    final paddingH = _getPaddingHorizontal();
    final backgroundColor = _getBackgroundColor();
    final foregroundColor = _getForegroundColor();
    final borderSide = _getBorderSide();

    final button = SizedBox(
      height: height,
      width: fullWidth ? double.infinity : null,
      child: isLoading
          ? Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
                ),
              ),
            )
          : TextButton(
              onPressed: (isDisabled || isLoading) ? null : onPressed,
              style: TextButton.styleFrom(
                backgroundColor: backgroundColor,
                foregroundColor: foregroundColor,
                padding: padding ??
                    EdgeInsets.symmetric(horizontal: paddingH, vertical: 0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(UIConstants.borderRadiusMedium),
                  side: borderSide ?? BorderSide.none,
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(
                      icon,
                      size: UIConstants.iconSizeMedium,
                    ),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: fontSize,
                      fontWeight: FontWeight.w600,
                      color: foregroundColor,
                    ),
                  ),
                ],
              ),
            ),
    );

    if (fullWidth) {
      return button;
    }

    return button;
  }
}
