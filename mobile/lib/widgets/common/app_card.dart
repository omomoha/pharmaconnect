import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

class PharmaCard extends StatefulWidget {
  final Widget child;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final VoidCallback? onTap;
  final double elevation;
  final double borderRadius;
  final Color? color;
  final Border? border;
  final Color? shadowColor;

  const PharmaCard({
    Key? key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.elevation = 0,
    this.borderRadius = UIConstants.borderRadiusLarge,
    this.color,
    this.border,
    this.shadowColor,
  }) : super(key: key);

  @override
  State<PharmaCard> createState() => _PharmaCardState();
}

class _PharmaCardState extends State<PharmaCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: widget.margin ??
          const EdgeInsets.symmetric(vertical: UIConstants.paddingSmall),
      child: Material(
        color: Colors.transparent,
        child: GestureDetector(
          onTapDown: widget.onTap != null
              ? (_) {
                  setState(() => _isPressed = true);
                }
              : null,
          onTapUp: widget.onTap != null
              ? (_) {
                  setState(() => _isPressed = false);
                  widget.onTap?.call();
                }
              : null,
          onTapCancel: widget.onTap != null
              ? () {
                  setState(() => _isPressed = false);
                }
              : null,
          child: Container(
            padding: widget.padding ??
                const EdgeInsets.all(UIConstants.paddingMedium),
            decoration: BoxDecoration(
              color: widget.color ?? AppColors.neutralWhite,
              borderRadius: BorderRadius.circular(widget.borderRadius),
              border: widget.border ??
                  Border.all(
                    color: AppColors.neutral200,
                    width: 1,
                  ),
              boxShadow: [
                if (widget.elevation > 0)
                  BoxShadow(
                    color: widget.shadowColor ??
                        AppColors.neutral900.withOpacity(0.1),
                    blurRadius: widget.elevation,
                    offset: const Offset(0, 1),
                    spreadRadius: 0,
                  ),
              ],
            ),
            child: Opacity(
              opacity: _isPressed && widget.onTap != null ? 0.8 : 1.0,
              child: widget.child,
            ),
          ),
        ),
      ),
    );
  }
}
