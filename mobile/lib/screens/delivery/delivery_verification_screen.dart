import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class DeliveryVerificationScreen extends StatefulWidget {
  final String orderId;

  const DeliveryVerificationScreen({
    Key? key,
    required this.orderId,
  }) : super(key: key);

  @override
  State<DeliveryVerificationScreen> createState() =>
      _DeliveryVerificationScreenState();
}

class _DeliveryVerificationScreenState extends State<DeliveryVerificationScreen>
    with SingleTickerProviderStateMixin {
  late List<TextEditingController> _customerCodeControllers;
  late AnimationController _successAnimationController;
  late Timer _countdownTimer;

  int _currentStep = 1; // 1: Customer Code, 2: Rider Code, 3: Complete
  int _remainingSeconds = 300; // 5 minutes
  bool _customerCodeVerified = false;
  bool _riderCodeVerified = false;
  bool _isLoading = false;
  String _riderCode = '';

  @override
  void initState() {
    super.initState();
    _customerCodeControllers = List.generate(
      4,
      (index) => TextEditingController(),
    );
    _successAnimationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _startCountdown();
    _generateRiderCode();
  }

  void _generateRiderCode() {
    // Mock: Generate a random 4-digit code
    _riderCode = List.generate(4, (index) => DateTime.now().millisecond % 10)
        .join()
        .substring(0, 4);
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
        // Code expired - show option to resend
        _showCodeExpiredDialog();
      }
    });
  }

  void _showCodeExpiredDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) => AlertDialog(
        title: const Text('Code Expired'),
        content: const Text('The verification code has expired. Please request a new one.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resetCountdown();
            },
            child: const Text('Resend Code'),
          ),
        ],
      ),
    );
  }

  void _resetCountdown() {
    _countdownTimer.cancel();
    setState(() {
      _remainingSeconds = 300;
    });
    _startCountdown();
  }

  String _formatTime(int seconds) {
    int minutes = seconds ~/ 60;
    int secs = seconds % 60;
    return '$minutes:${secs.toString().padLeft(2, '0')}';
  }

  void _verifyCustomerCode() async {
    final code = _customerCodeControllers.map((c) => c.text).join();

    if (code.length != 4) {
      _showErrorSnackbar('Please enter a 4-digit code');
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Mock API call - in production, this would verify against backend
      await Future.delayed(const Duration(milliseconds: 800));

      // Mock: Accept any 4-digit code
      setState(() {
        _customerCodeVerified = true;
        _isLoading = false;
        _currentStep = 2;
      });

      _successAnimationController.forward().then((_) {
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            setState(() {
              _successAnimationController.reset();
            });
          }
        });
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showErrorSnackbar('Verification failed. Please try again.');
    }
  }

  void _verifyRiderCode() async {
    setState(() => _isLoading = true);

    try {
      // Mock API call
      await Future.delayed(const Duration(milliseconds: 800));

      setState(() {
        _riderCodeVerified = true;
        _isLoading = false;
        _currentStep = 3;
      });

      _successAnimationController.forward().then((_) {
        Future.delayed(const Duration(milliseconds: 1500), () {
          if (mounted) {
            setState(() {
              _successAnimationController.reset();
            });
          }
        });
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showErrorSnackbar('Verification failed. Please try again.');
    }
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _clearCustomerCodeFields() {
    for (var controller in _customerCodeControllers) {
      controller.clear();
    }
  }

  void _backToDashboard() {
    context.go('/dashboard/delivery');
  }

  @override
  void dispose() {
    for (var controller in _customerCodeControllers) {
      controller.dispose();
    }
    _countdownTimer.cancel();
    _successAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      appBar: AppBar(
        backgroundColor: AppColors.neutralWhite,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.neutral900),
          onPressed: _backToDashboard,
        ),
        title: Text(
          'Delivery Verification',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(UIConstants.paddingLarge),
          child: Column(
            children: [
              // Timer Section
              _buildTimerSection(),
              const SizedBox(height: UIConstants.paddingXLarge),

              // Content based on current step
              if (_currentStep == 1) _buildCustomerCodeStep(),
              if (_currentStep == 2) _buildRiderCodeStep(),
              if (_currentStep == 3) _buildCompletionStep(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimerSection() {
    return Container(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      decoration: BoxDecoration(
        color: _remainingSeconds < 60 ? AppColors.error.withOpacity(0.1) : AppColors.primary100,
        borderRadius: BorderRadius.circular(UIConstants.borderRadiusLarge),
        border: Border.all(
          color: _remainingSeconds < 60 ? AppColors.error : AppColors.primary300,
          width: 1.5,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.timer_outlined,
            color: _remainingSeconds < 60 ? AppColors.error : AppColors.primary600,
            size: UIConstants.iconSizeMedium,
          ),
          const SizedBox(width: UIConstants.paddingSmall),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Code expires in',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.neutral600,
                ),
              ),
              Text(
                _formatTime(_remainingSeconds),
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: _remainingSeconds < 60 ? AppColors.error : AppColors.primary600,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCodeStep() {
    return Column(
      children: [
        // Step indicator
        _buildStepIndicator('Step 1 of 2', 'Enter Customer\'s Code'),
        const SizedBox(height: UIConstants.paddingMedium),

        Text(
          'Ask the customer for their 4-digit verification code',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.neutral600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: UIConstants.paddingXLarge),

        // Code input boxes
        _buildCodeInputFields(),
        const SizedBox(height: UIConstants.paddingXLarge),

        // Verify button
        PharmaButton(
          label: _isLoading ? 'Verifying...' : 'Verify Code',
          onPressed: _isLoading ? null : _verifyCustomerCode,
          variant: ButtonVariant.primary,
          size: ButtonSize.large,
          fullWidth: true,
          isLoading: _isLoading,
        ),
      ],
    );
  }

  Widget _buildCodeInputFields() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        4,
        (index) => Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: UIConstants.paddingSmall,
          ),
          child: _buildCodeInputBox(index),
        ),
      ),
    );
  }

  Widget _buildCodeInputBox(int index) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.neutral50,
        border: Border.all(
          color: AppColors.neutral300,
          width: 1.5,
        ),
        borderRadius: BorderRadius.circular(UIConstants.borderRadiusMedium),
      ),
      child: TextField(
        controller: _customerCodeControllers[index],
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
        ],
        onChanged: (value) {
          if (value.isNotEmpty && index < 3) {
            FocusScope.of(context).nextFocus();
          }
          if (value.isEmpty && index > 0) {
            FocusScope.of(context).previousFocus();
          }
        },
        decoration: InputDecoration(
          counterText: '',
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(UIConstants.paddingSmall),
          hintText: '-',
          hintStyle: TextStyle(
            color: AppColors.neutral400,
            fontSize: 24,
          ),
        ),
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
          fontSize: 28,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildRiderCodeStep() {
    return Column(
      children: [
        // Step indicator
        _buildStepIndicator('Step 2 of 2', 'Show Your Code'),
        const SizedBox(height: UIConstants.paddingMedium),

        Text(
          'Show this code to the customer for verification',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.neutral600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: UIConstants.paddingXLarge),

        // Success animation for customer code
        if (_customerCodeVerified) ...[
          _buildSuccessCheckmark(),
          const SizedBox(height: UIConstants.paddingLarge),
        ],

        // Rider code display card
        _buildRiderCodeCard(),
        const SizedBox(height: UIConstants.paddingXLarge),

        // Instructions
        PharmaCard(
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          color: AppColors.primary50,
          border: Border.all(color: AppColors.primary200),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.info_outline,
                color: AppColors.primary600,
                size: UIConstants.iconSizeMedium,
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Expanded(
                child: Text(
                  'Ask the customer to confirm that the code matches what they see.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.primary700,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: UIConstants.paddingXLarge),

        // Confirm button
        PharmaButton(
          label: _isLoading ? 'Confirming...' : 'Code Confirmed',
          onPressed: _isLoading ? null : _verifyRiderCode,
          variant: ButtonVariant.primary,
          size: ButtonSize.large,
          fullWidth: true,
          isLoading: _isLoading,
        ),
      ],
    );
  }

  Widget _buildRiderCodeCard() {
    return Container(
      padding: const EdgeInsets.all(UIConstants.paddingLarge),
      decoration: BoxDecoration(
        color: AppColors.primary50,
        border: Border.all(
          color: AppColors.primary300,
          width: 2,
        ),
        borderRadius: BorderRadius.circular(UIConstants.borderRadiusLarge),
      ),
      child: Column(
        children: [
          Text(
            'Your Verification Code',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.neutral600,
            ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: UIConstants.paddingXLarge,
              vertical: UIConstants.paddingLarge,
            ),
            decoration: BoxDecoration(
              color: AppColors.neutralWhite,
              border: Border.all(
                color: AppColors.primary300,
                width: 1.5,
              ),
              borderRadius: BorderRadius.circular(UIConstants.borderRadiusMedium),
            ),
            child: Text(
              _riderCode,
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                color: AppColors.primary600,
                fontWeight: FontWeight.w700,
                letterSpacing: 4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionStep() {
    return Column(
      children: [
        // Confetti-style success icon
        _buildCompletionAnimation(),
        const SizedBox(height: UIConstants.paddingXLarge),

        Text(
          'Delivery Complete!',
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
            color: AppColors.primary600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: UIConstants.paddingMedium),

        Text(
          'Both codes have been verified successfully. The delivery is now complete.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.neutral600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: UIConstants.paddingXLarge),

        // Order summary
        _buildOrderSummary(),
        const SizedBox(height: UIConstants.paddingXLarge),

        // Back to dashboard button
        PharmaButton(
          label: 'Back to Dashboard',
          onPressed: _backToDashboard,
          variant: ButtonVariant.primary,
          size: ButtonSize.large,
          fullWidth: true,
        ),
      ],
    );
  }

  Widget _buildSuccessCheckmark() {
    return ScaleTransition(
      scale: _successAnimationController.view,
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: AppColors.successLight,
          shape: BoxShape.circle,
          border: Border.all(
            color: AppColors.success,
            width: 2,
          ),
        ),
        child: const Center(
          child: Icon(
            Icons.check,
            color: AppColors.success,
            size: 48,
          ),
        ),
      ),
    );
  }

  Widget _buildCompletionAnimation() {
    return ScaleTransition(
      scale: Tween<double>(begin: 0.8, end: 1.0).animate(
        CurvedAnimation(parent: _successAnimationController, curve: Curves.elasticOut),
      ),
      child: Container(
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          color: AppColors.successLight,
          shape: BoxShape.circle,
          border: Border.all(
            color: AppColors.success,
            width: 3,
          ),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(
              Icons.check_circle,
              color: AppColors.success,
              size: 80,
            ),
            // Confetti-style decorative elements
            Positioned(
              top: 10,
              left: 15,
              child: Icon(
                Icons.star,
                color: AppColors.primary600,
                size: 20,
              ),
            ),
            Positioned(
              top: 15,
              right: 20,
              child: Icon(
                Icons.star,
                color: AppColors.success,
                size: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummary() {
    return PharmaCard(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order Summary',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          _buildOrderSummaryRow('Order ID', widget.orderId),
          const SizedBox(height: UIConstants.paddingSmall),
          _buildOrderSummaryRow('Status', 'Delivered'),
          const SizedBox(height: UIConstants.paddingSmall),
          _buildOrderSummaryRow(
            'Time',
            '${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
          ),
        ],
      ),
    );
  }

  Widget _buildOrderSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppColors.neutral600,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.neutral900,
          ),
        ),
      ],
    );
  }

  Widget _buildStepIndicator(String stepText, String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          stepText,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppColors.neutral600,
          ),
        ),
        const SizedBox(height: UIConstants.paddingSmall),
        Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: AppColors.neutral900,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
