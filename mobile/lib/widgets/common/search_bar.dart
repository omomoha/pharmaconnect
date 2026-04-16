import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

class PharmaSearchBar extends StatefulWidget {
  final String? hint;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onSubmitted;
  final TextEditingController? controller;
  final bool autofocus;
  final Color? focusColor;
  final Color? iconColor;
  final ValueChanged<String>? onClear;

  const PharmaSearchBar({
    Key? key,
    this.hint,
    this.onChanged,
    this.onSubmitted,
    this.controller,
    this.autofocus = false,
    this.focusColor,
    this.iconColor,
    this.onClear,
  }) : super(key: key);

  @override
  State<PharmaSearchBar> createState() => _PharmaSearchBarState();
}

class _PharmaSearchBarState extends State<PharmaSearchBar> {
  late TextEditingController _controller;
  late FocusNode _focusNode;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _focusNode = FocusNode();
    _focusNode.addListener(_handleFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    _focusNode.dispose();
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  void _handleFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }

  void _handleClear() {
    _controller.clear();
    widget.onClear?.call('');
    widget.onChanged?.call('');
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      focusNode: _focusNode,
      autofocus: widget.autofocus,
      onChanged: widget.onChanged,
      onSubmitted: (_) => widget.onSubmitted?.call(),
      textInputAction: TextInputAction.search,
      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.neutral900,
          ),
      decoration: InputDecoration(
        hintText: widget.hint ?? 'Search...',
        hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.neutral500,
            ),
        prefixIcon: Icon(
          Icons.search_rounded,
          color: widget.iconColor ??
              (_isFocused ? AppColors.primary600 : AppColors.neutral500),
          size: UIConstants.iconSizeMedium,
        ),
        suffixIcon: _controller.text.isNotEmpty
            ? IconButton(
                icon: Icon(
                  Icons.close_rounded,
                  color: AppColors.neutral500,
                  size: UIConstants.iconSizeMedium,
                ),
                onPressed: _handleClear,
              )
            : null,
        filled: true,
        fillColor: AppColors.neutral50,
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
          borderSide: const BorderSide(color: AppColors.neutral300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius:
              BorderRadius.circular(UIConstants.borderRadiusMedium),
          borderSide: BorderSide(
            color: widget.focusColor ?? AppColors.primary600,
            width: 2,
          ),
        ),
      ),
    );
  }
}
