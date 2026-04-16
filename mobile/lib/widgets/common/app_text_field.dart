import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

class PharmaTextField extends StatefulWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final IconData? suffixIcon;
  final IconData? prefixIcon;
  final TextInputType keyboardType;
  final int maxLines;
  final bool enabled;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final int? maxLength;
  final TextCapitalization textCapitalization;
  final VoidCallback? onSuffixIconTap;

  const PharmaTextField({
    Key? key,
    this.label,
    this.hint,
    this.controller,
    this.validator,
    this.obscureText = false,
    this.suffixIcon,
    this.prefixIcon,
    this.keyboardType = TextInputType.text,
    this.maxLines = 1,
    this.enabled = true,
    this.errorText,
    this.onChanged,
    this.maxLength,
    this.textCapitalization = TextCapitalization.none,
    this.onSuffixIconTap,
  }) : super(key: key);

  @override
  State<PharmaTextField> createState() => _PharmaTextFieldState();
}

class _PharmaTextFieldState extends State<PharmaTextField> {
  late FocusNode _focusNode;
  bool _isFocused = false;
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_handleFocusChange);
    _obscureText = widget.obscureText;
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _handleFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
        ],
        TextFormField(
          controller: widget.controller,
          validator: widget.validator,
          focusNode: _focusNode,
          obscureText: _obscureText && widget.maxLines == 1,
          keyboardType: widget.keyboardType,
          maxLines: widget.obscureText ? 1 : widget.maxLines,
          minLines: widget.obscureText ? 1 : (widget.maxLines == 1 ? 1 : null),
          enabled: widget.enabled,
          maxLength: widget.maxLength,
          textCapitalization: widget.textCapitalization,
          onChanged: widget.onChanged,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.neutral900,
              ),
          decoration: InputDecoration(
            hintText: widget.hint,
            errorText: widget.errorText,
            hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutral500,
                ),
            filled: true,
            fillColor: widget.enabled
                ? (widget.errorText != null
                    ? AppColors.errorLight
                    : AppColors.neutral50)
                : AppColors.neutral100,
            prefixIcon: widget.prefixIcon != null
                ? Icon(
                    widget.prefixIcon,
                    color: _isFocused
                        ? AppColors.primary600
                        : (widget.errorText != null
                            ? AppColors.error
                            : AppColors.neutral500),
                    size: UIConstants.iconSizeMedium,
                  )
                : null,
            suffixIcon: widget.suffixIcon != null || widget.obscureText
                ? Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: IconButton(
                      icon: Icon(
                        widget.obscureText
                            ? (_obscureText
                                ? Icons.visibility_off
                                : Icons.visibility)
                            : widget.suffixIcon,
                        color: _isFocused
                            ? AppColors.primary600
                            : (widget.errorText != null
                                ? AppColors.error
                                : AppColors.neutral500),
                        size: UIConstants.iconSizeMedium,
                      ),
                      onPressed: widget.obscureText
                          ? () {
                              setState(() {
                                _obscureText = !_obscureText;
                              });
                            }
                          : widget.onSuffixIconTap,
                    ),
                  )
                : null,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: UIConstants.paddingMedium,
              vertical: UIConstants.paddingSmall,
            ),
            border: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
              borderSide: const BorderSide(color: AppColors.neutral300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
              borderSide: BorderSide(
                color: widget.errorText != null
                    ? AppColors.error
                    : AppColors.neutral300,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
              borderSide: BorderSide(
                color: widget.errorText != null
                    ? AppColors.error
                    : AppColors.primary600,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
              borderSide: const BorderSide(
                color: AppColors.error,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
              borderSide: const BorderSide(
                color: AppColors.error,
                width: 2,
              ),
            ),
            errorStyle: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.error,
                  fontSize: 12,
                ),
            counterText: '',
          ),
        ),
      ],
    );
  }
}
