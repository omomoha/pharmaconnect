import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class DeliveryRegistrationScreen extends StatefulWidget {
  const DeliveryRegistrationScreen({Key? key}) : super(key: key);

  @override
  State<DeliveryRegistrationScreen> createState() =>
      _DeliveryRegistrationScreenState();
}

class _DeliveryRegistrationScreenState
    extends State<DeliveryRegistrationScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  bool _isLoading = false;

  // Step 1: Business Details
  final _companyNameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _serviceAreaController = TextEditingController();

  String? _selectedFleetSize;
  final List<String> _fleetSizeOptions = ['1-5', '6-20', '21-50', '50+'];

  // Step 2: Document Uploads
  File? _cacCertificateFile;
  File? _vehicleInsuranceFile;
  File? _ownerIdFile;

  // Mock file upload state
  String? _cacCertificateFileName;
  String? _vehicleInsuranceFileName;
  String? _ownerIdFileName;

  // Step 3: Vehicle Information
  String? _selectedVehicleType;
  final List<String> _vehicleTypeOptions = ['Motorcycle', 'Car', 'Van', 'Truck'];

  final _licensePlateController = TextEditingController();
  final _vehicleColorController = TextEditingController();
  final _driverLicenseController = TextEditingController();

  @override
  void dispose() {
    _companyNameController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _serviceAreaController.dispose();
    _licensePlateController.dispose();
    _vehicleColorController.dispose();
    _driverLicenseController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  bool _validateStep1() {
    if (_companyNameController.text.isEmpty) {
      _showError('Company name is required');
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
    if (_selectedFleetSize == null) {
      _showError('Fleet size is required');
      return false;
    }
    if (_serviceAreaController.text.isEmpty) {
      _showError('Service area description is required');
      return false;
    }
    return true;
  }

  bool _validateStep2() {
    if (_cacCertificateFile == null) {
      _showError('CAC Certificate is required');
      return false;
    }
    if (_vehicleInsuranceFile == null) {
      _showError('Vehicle Insurance is required');
      return false;
    }
    if (_ownerIdFile == null) {
      _showError("Owner's Government ID is required");
      return false;
    }
    return true;
  }

  bool _validateStep3() {
    if (_selectedVehicleType == null) {
      _showError('Vehicle type is required');
      return false;
    }
    if (_licensePlateController.text.isEmpty) {
      _showError('License plate is required');
      return false;
    }
    if (_vehicleColorController.text.isEmpty) {
      _showError('Vehicle color is required');
      return false;
    }
    if (_driverLicenseController.text.isEmpty) {
      _showError('Driver license number is required');
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

  Future<void> _mockFileUpload(String documentName) async {
    // Mock file picker - in production, use file_picker package
    // For now, we simulate file selection
    final fileName = '$documentName-${DateTime.now().millisecondsSinceEpoch}.pdf';
    final mockFile = File(fileName);

    setState(() {
      switch (documentName) {
        case 'cac_certificate':
          _cacCertificateFile = mockFile;
          _cacCertificateFileName = 'CAC_Certificate.pdf';
          break;
        case 'vehicle_insurance':
          _vehicleInsuranceFile = mockFile;
          _vehicleInsuranceFileName = 'Vehicle_Insurance.pdf';
          break;
        case 'owner_id':
          _ownerIdFile = mockFile;
          _ownerIdFileName = "Owner_Government_ID.pdf";
          break;
      }
    });

    _showSuccess('$documentName uploaded successfully');
  }

  Future<void> _handleSubmit() async {
    if (!_validateStep3()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();

      final registrationData = {
        'companyName': _companyNameController.text,
        'description': _descriptionController.text,
        'phone': _phoneController.text,
        'email': _emailController.text,
        'address': _addressController.text,
        'city': _cityController.text,
        'state': _stateController.text,
        'fleetSize': _selectedFleetSize,
        'serviceArea': _serviceAreaController.text,
        'documents': {
          'cacCertificate': _cacCertificateFileName ?? '',
          'vehicleInsurance': _vehicleInsuranceFileName ?? '',
          'ownerId': _ownerIdFileName ?? '',
        },
        'vehicleInformation': {
          'vehicleType': _selectedVehicleType,
          'licensePlate': _licensePlateController.text,
          'vehicleColor': _vehicleColorController.text,
          'driverLicenseNumber': _driverLicenseController.text,
        },
      };

      await apiService.post(
        ApiEndpoints.deliveryProviders,
        body: registrationData,
      );

      if (mounted) {
        _showSuccess('Delivery provider registered successfully!');
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) {
          context.go('/dashboard/delivery');
        }
      }
    } catch (e) {
      if (mounted) {
        _showError('Failed to register delivery provider: ${e.toString()}');
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
    if (_currentStep == 1 && !_validateStep2()) {
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
          'Register Delivery Service',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w600,
              ) ?? const TextStyle(),
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
            label: 'Company Name',
            hint: 'Enter your company name',
            controller: _companyNameController,
            prefixIcon: Icons.business_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          PharmaTextField(
            label: 'Description',
            hint: 'Tell us about your delivery service',
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
          const SizedBox(height: UIConstants.paddingMedium),
          _buildDropdownField(
            label: 'Fleet Size',
            value: _selectedFleetSize,
            hint: 'Select fleet size',
            options: _fleetSizeOptions,
            onChanged: (value) {
              setState(() => _selectedFleetSize = value);
            },
            prefixIcon: Icons.local_shipping_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          PharmaTextField(
            label: 'Service Area Description',
            hint: 'Describe your service coverage area',
            controller: _serviceAreaController,
            maxLines: 3,
            prefixIcon: Icons.map_outlined,
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

          // CAC Certificate
          _buildDocumentUploadCard(
            title: 'CAC Certificate',
            fileName: _cacCertificateFileName,
            onTap: () => _mockFileUpload('cac_certificate'),
            isUploaded: _cacCertificateFile != null,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Vehicle Insurance
          _buildDocumentUploadCard(
            title: 'Vehicle Insurance',
            fileName: _vehicleInsuranceFileName,
            onTap: () => _mockFileUpload('vehicle_insurance'),
            isUploaded: _vehicleInsuranceFile != null,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Owner's Government ID
          _buildDocumentUploadCard(
            title: "Owner's Government ID",
            fileName: _ownerIdFileName,
            onTap: () => _mockFileUpload('owner_id'),
            isUploaded: _ownerIdFile != null,
          ),
          const SizedBox(height: UIConstants.paddingXLarge),
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
            title: 'Vehicle Information & Review',
            padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
          ),
          Text(
            'Provide vehicle details and review your information',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutral600,
                ) ?? const TextStyle(),
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Vehicle Type
          _buildDropdownField(
            label: 'Vehicle Type',
            value: _selectedVehicleType,
            hint: 'Select vehicle type',
            options: _vehicleTypeOptions,
            onChanged: (value) {
              setState(() => _selectedVehicleType = value);
            },
            prefixIcon: Icons.two_wheeler_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // License Plate
          PharmaTextField(
            label: 'License Plate',
            hint: 'Vehicle license plate',
            controller: _licensePlateController,
            prefixIcon: Icons.info_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Vehicle Color
          PharmaTextField(
            label: 'Vehicle Color',
            hint: 'Vehicle color',
            controller: _vehicleColorController,
            prefixIcon: Icons.palette_outlined,
          ),
          const SizedBox(height: UIConstants.paddingMedium),

          // Driver License Number
          PharmaTextField(
            label: 'Driver License Number',
            hint: 'Your driver license number',
            controller: _driverLicenseController,
            prefixIcon: Icons.card_membership_outlined,
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Review Summary
          SectionHeader(
            title: 'Review Information',
            padding: const EdgeInsets.only(bottom: UIConstants.paddingMedium),
          ),

          // Business Details Summary
          _buildReviewSection(
            title: 'Business Details',
            items: [
              ('Company Name', _companyNameController.text),
              ('Phone', _phoneController.text),
              ('Email', _emailController.text),
              ('Address', _addressController.text),
              ('City', _cityController.text),
              ('State', _stateController.text),
              ('Fleet Size', _selectedFleetSize ?? 'Not selected'),
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
                  'Service Area',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.neutral900,
                        fontWeight: FontWeight.w600,
                      ) ?? const TextStyle(),
                ),
                const SizedBox(height: 8),
                Text(
                  _serviceAreaController.text,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.neutral700,
                      ) ?? const TextStyle(),
                ),
              ],
            ),
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Vehicle Information Summary
          _buildReviewSection(
            title: 'Vehicle Information',
            items: [
              ('Vehicle Type', _selectedVehicleType ?? 'Not selected'),
              ('License Plate', _licensePlateController.text),
              ('Vehicle Color', _vehicleColorController.text),
              ('Driver License', _driverLicenseController.text),
            ],
          ),
          const SizedBox(height: UIConstants.paddingLarge),

          // Documents Summary
          _buildReviewSection(
            title: 'Uploaded Documents',
            items: [
              ('CAC Certificate', _cacCertificateFileName ?? 'Pending'),
              ('Vehicle Insurance', _vehicleInsuranceFileName ?? 'Pending'),
              ("Owner's ID", _ownerIdFileName ?? 'Pending'),
            ],
          ),
          const SizedBox(height: UIConstants.paddingLarge),

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

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required String hint,
    required List<String> options,
    required Function(String?) onChanged,
    required IconData prefixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.neutral600,
                fontWeight: FontWeight.w500,
              ) ?? const TextStyle(),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.neutral300),
            borderRadius: BorderRadius.circular(UIConstants.borderRadiusMedium),
            color: AppColors.neutralWhite,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: UIConstants.paddingMedium,
            ),
            child: DropdownButton<String>(
              value: value,
              hint: Text(hint),
              underline: const SizedBox(),
              isExpanded: true,
              items: options.map((option) {
                return DropdownMenuItem<String>(
                  value: option,
                  child: Text(option),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
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
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.neutral600,
                          ) ?? const TextStyle(),
                    ),
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
