import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class PharmacyRegistrationScreen extends StatefulWidget {
  const PharmacyRegistrationScreen({Key? key}) : super(key: key);

  @override
  State<PharmacyRegistrationScreen> createState() =>
      _PharmacyRegistrationScreenState();
}

class _PharmacyRegistrationScreenState
    extends State<PharmacyRegistrationScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  bool _isLoading = false;

  // Step 1: Business Details
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();

  // Step 2: Document Uploads
  File? _pharmacyLicenseFile;
  File? _cacCertificateFile;
  File? _ownerIdFile;

  // Mock file upload state
  String? _pharmacyLicenseFileName;
  String? _cacCertificateFileName;
  String? _ownerIdFileName;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  bool _validateStep1() {
    if (_nameController.text.isEmpty) {
      _showError('Pharmacy name is required');
      return false;
    }
    if (_descriptionController.text.isEmpty) {
      _showError('Description is required');
      return false;
    }
    if (_phoneController.text.isEmpty) {
      _showError('Phone number is required');
      return false;
    }
    if (_emailController.text.isEmpty) {
      _showError('Email is required');
      return false;
    }
    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
        .hasMatch(_emailController.text)) {
      _showError('Enter a valid email');
      return false;
    }
    if (_addressController.text.isEmpty) {
      _showError('Address is required');
      return false;
    }
    if (_cityController.text.isEmpty) {
      _showError('City is required');
      return false;
    }
    if (_stateController.text.isEmpty) {
      _showError('State is required');
      return false;
    }
    return true;
  }

  bool _validateStep2() {
    if (_pharmacyLicenseFile == null) {
      _showError('Pharmacy License is required');
      return false;
    }
    if (_cacCertificateFile == null) {
      _showError('CAC Certificate is required');
      return false;
    }
    if (_ownerIdFile == null) {
      _showError("Owner's Government ID is required");
      return false;
    }
    return true;
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.error,
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.success,
      ),
    );
  }

  Future<void> _pickFile(String documentName) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );

      if (pickedFile == null) {
        _showError('No file selected');
        return;
      }

      final file = File(pickedFile.path);
      final fileName = pickedFile.name;

      setState(() {
        switch (documentName) {
          case 'pharmacy_license':
            _pharmacyLicenseFile = file;
            _pharmacyLicenseFileName = fileName;
            break;
          case 'cac_certificate':
            _cacCertificateFile = file;
            _cacCertificateFileName = fileName;
            break;
          case 'owner_id':
            _ownerIdFile = file;
            _ownerIdFileName = fileName;
            break;
        }
      });

      _showSuccess('$documentName selected successfully');
    } catch (e) {
      _showError('Failed to select file: $e');
    }
  }

  Future<void> _handleSubmit() async {
    if (!_validateStep2()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();

      final registrationData = {
        'name': _nameController.text,
        'description': _descriptionController.text,
        'phone': _phoneController.text,
        'email': _emailController.text,
        'address': _addressController.text,
        'city': _cityController.text,
        'state': _stateController.text,
        'documents': {
          'pharmacyLicense': _pharmacyLicenseFileName ?? '',
          'cacCertificate': _cacCertificateFileName ?? '',
          'ownerId': _ownerIdFileName ?? '',
        },
      };

      await apiService.post(
        ApiEndpoints.pharmacies,
        body: registrationData,
      );

      if (mounted) {
        _showSuccess('Pharmacy registered successfully!');
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) {
          context.go('/dashboard/pharmacy');
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Failed to register pharmacy: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _nextStep() {
    if (_currentStep == 0 && !_validateStep1()) {
      return;
    }

    if (_currentStep < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: AppColors.neutralWhite,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _previousStep,
        ),
        title: Text(
          'Register Pharmacy',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w600,
              ) ?? const TextStyle(),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Step Indicator
            Padding(
              padding: const EdgeInsets.symmetric(vertical: UIConstants.paddingMedium),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  3,
                  (index) => Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: index <= _currentStep
                              ? AppColors.primary600
                              : AppColors.neutral200,
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              color: index <= _currentStep
                                  ? AppColors.neutralWhite
                                  : AppColors.neutral600,
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      if (index < 2)
                        Container(
                          width: 30,
                          height: 2,
                          color: index < _currentStep
                              ? AppColors.primary600
                              : AppColors.neutral200,
                        ),
                    ],
                  ),
                ),
              ),
            ),

            // Page View
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (index) {
                  setState(() => _currentStep = index);
                },
                children: [
                  _buildStep1(),
                  _buildStep2(),
                  _buildStep3(),
                ],
              ),
            ),

            // Navigation Buttons
            Padding(
              padding: const EdgeInsets.all(UIConstants.paddingMedium),
              child: Row(
                children: [
                  if (_currentStep > 0)
                    Expanded(
                      child: PharmaButton(
                        label: 'Back',
                        variant: ButtonVariant.outline,
                        onPressed: _previousStep,
                        fullWidth: true,
                      ),
                    ),
                  if (_currentStep > 0) const SizedBox(width: UIConstants.paddingMedium),
                  Expanded(
                    child: PharmaButton(
                      label: _currentStep == 2 ? 'Submit' : 'Next',
                      variant: ButtonVariant.primary,
                      onPressed: _currentStep == 2 ? _handleSubmit : _nextStep,
                      isLoading: _isLoading && _currentStep == 2,
                      fullWidth: true,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(
            title: 'Business Details',
            padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
          ),
          PharmaTextField(
            label: 'Pharmacy Name',
            hint: 'Enter your pharmacy name',
            controller: _nameController,
            prefixIcon: Icons.store_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          PharmaTextField(
            label: 'Description',
            hint: 'Tell us about your pharmacy',
            controller: _descriptionController,
            maxLines: 4,
            prefixIcon: Icons.description_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          PharmaTextField(
            label: 'Phone Number',
            hint: 'Your contact number',
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            prefixIcon: Icons.phone_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          PharmaTextField(
            label: 'Email Address',
            hint: 'Your business email',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icons.email_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          PharmaTextField(
            label: 'Address',
            hint: 'Street address',
            controller: _addressController,
            prefixIcon: Icons.location_on_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          Row(
            children: [
              Expanded(
                child: PharmaTextField(
                  label: 'City',
                  hint: 'City',
                  controller: _cityController,
                  prefixIcon: Icons.location_city_outlined,
                ),
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Expanded(
                child: PharmaTextField(
                  label: 'State',
                  hint: 'State',
                  controller: _stateController,
                  prefixIcon: Icons.public_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: UIConstants.paddingXLarge),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(
            title: 'Upload Documents',
            padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
          ),
          Text(
            'Please provide the following documents for verification',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutral600,
                ) ?? const TextStyle(),
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Pharmacy License
          _buildDocumentUploadCard(
            title: 'Pharmacy License',
            fileName: _pharmacyLicenseFileName,
            onTap: () => _pickFile('pharmacy_license'),
            isUploaded: _pharmacyLicenseFile != null,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // CAC Certificate
          _buildDocumentUploadCard(
            title: 'CAC Certificate',
            fileName: _cacCertificateFileName,
            onTap: () => _pickFile('cac_certificate'),
            isUploaded: _cacCertificateFile != null,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Owner's Government ID
          _buildDocumentUploadCard(
            title: "Owner's Government ID",
            fileName: _ownerIdFileName,
            onTap: () => _pickFile('owner_id'),
            isUploaded: _ownerIdFile != null,
          ),
          const SizedBox(height: UIConstants.paddingXLarge),
        ],
      ),
    );
  }

  Widget _buildDocumentUploadCard({
    required String title,
    String? fileName,
    required VoidCallback onTap,
    required bool isUploaded,
  }) {
    return PharmaCard(
      onTap: onTap,
      color: isUploaded ? AppColors.primary50 : AppColors.neutral50,
      border: Border.all(
        color: isUploaded ? AppColors.primary300 : AppColors.neutral300,
        width: 1.5,
      ),
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isUploaded ? Icons.check_circle : Icons.cloud_upload_outlined,
                color: isUploaded ? AppColors.success : AppColors.neutral500,
                size: UIConstants.iconSizeLarge,
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.neutral900,
                            fontWeight: FontWeight.w600,
                          ) ?? const TextStyle(),
                    ),
                    if (fileName != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        fileName,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.primary600,
                            ) ?? const TextStyle(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ] else
                      Text(
                        'Tap to upload PDF',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neutral500,
                            ) ?? const TextStyle(),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStep3() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(
            title: 'Review Information',
            padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
          ),
          Text(
            'Please review your information before submitting',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutral600,
                ) ?? const TextStyle(),
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Business Details Summary
          _buildReviewSection(
            title: 'Business Details',
            items: [
              ('Pharmacy Name', _nameController.text),
              ('Phone', _phoneController.text),
              ('Email', _emailController.text),
              ('Address', _addressController.text),
              ('City', _cityController.text),
              ('State', _stateController.text),
            ],
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Description
          PharmaCard(
            padding: const EdgeInsets.all(UIConstants.paddingMedium),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Description',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.neutral900,
                        fontWeight: FontWeight.w600,
                      ) ?? const TextStyle(),
                ),
                const SizedBox(height: 8),
                Text(
                  _descriptionController.text,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.neutral700,
                      ) ?? const TextStyle(),
                ),
              ],
            ),
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Documents Summary
          _buildReviewSection(
            title: 'Uploaded Documents',
            items: [
              ('Pharmacy License', _pharmacyLicenseFileName ?? 'Pending'),
              ('CAC Certificate', _cacCertificateFileName ?? 'Pending'),
              ("Owner's ID", _ownerIdFileName ?? 'Pending'),
            ],
          ),
          const SizedBox(height: UIConstants.paddingXLarge),

          // Disclaimer
          PharmaCard(
            color: AppColors.infoLight,
            border: Border.all(color: AppColors.info),
            padding: const EdgeInsets.all(UIConstants.paddingMedium),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outlined,
                  color: AppColors.info,
                  size: UIConstants.iconSizeMedium,
                ),
                const SizedBox(width: UIConstants.paddingMedium),
                Expanded(
                  child: Text(
                    'Your application will be reviewed within 24 hours. We will verify all documents and notify you via email.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.neutral700,
                        ) ?? const TextStyle(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: UIConstants.paddingXLarge),
        ],
      ),
    );
  }

  Widget _buildReviewSection({
    required String title,
    required List<(String, String)> items,
  }) {
    return PharmaCard(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.neutral900,
                  fontWeight: FontWeight.w600,
                ) ?? const TextStyle(),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          ...items.asMap().entries.map((entry) {
            final (label, value) = entry.value;
            final isLastItem = entry.key == items.length - 1;
            return Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.neutral600,
                          ) ?? const TextStyle(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(width: UIConstants.paddingSmall),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(
                          left: UIConstants.paddingMedium,
                        ),
                        child: Text(
                          value,
                          textAlign: TextAlign.right,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.neutral900,
                                fontWeight: FontWeight.w500,
                              ) ?? const TextStyle(),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                ),
                if (!isLastItem)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: UIConstants.paddingSmall,
                    ),
                    child: Divider(
                      color: AppColors.neutral200,
                      height: 1,
                    ),
                  ),
              ],
            );
          }).toList(),
        ],
      ),
    );
  }
}
