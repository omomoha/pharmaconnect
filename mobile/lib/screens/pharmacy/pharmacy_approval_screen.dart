import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

class PharmacyApprovalScreen extends StatefulWidget {
  const PharmacyApprovalScreen({Key? key}) : super(key: key);

  @override
  State<PharmacyApprovalScreen> createState() =>
      _PharmacyApprovalScreenState();
}

class _PharmacyApprovalScreenState extends State<PharmacyApprovalScreen> {
  late Future<Map<String, dynamic>> _pharmacyFuture;
  final GlobalKey<RefreshIndicatorState> _refreshKey =
      GlobalKey<RefreshIndicatorState>();

  @override
  void initState() {
    super.initState();
    _loadPharmacyApprovalStatus();
  }

  void _loadPharmacyApprovalStatus() {
    _pharmacyFuture = _fetchPharmacyData();
  }

  Future<Map<String, dynamic>> _fetchPharmacyData() async {
    try {
      final response = await ApiService().get(
        '${ApiEndpoints.pharmacies}/my-pharmacy',
      );
      return response as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> _handleRefresh() async {
    setState(() {
      _loadPharmacyApprovalStatus();
    });
    await _pharmacyFuture;
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return 'Your application is under review';
      case 'approved':
        return 'Your pharmacy is approved and active!';
      case 'rejected':
        return 'Your application was rejected';
      case 'suspended':
        return 'Your pharmacy has been suspended';
      default:
        return 'Unknown status';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return AppColors.warning;
      case 'approved':
        return AppColors.success;
      case 'rejected':
      case 'suspended':
        return AppColors.error;
      default:
        return AppColors.neutral500;
    }
  }

  Color _getStatusBackgroundColor(String status) {
    switch (status) {
      case 'pending':
        return AppColors.warningLight;
      case 'approved':
        return AppColors.successLight;
      case 'rejected':
      case 'suspended':
        return AppColors.errorLight;
      default:
        return AppColors.neutral100;
    }
  }

  Widget _buildStatusIcon(String status) {
    switch (status) {
      case 'pending':
        return SizedBox(
          width: UIConstants.iconSizeMedium,
          height: UIConstants.iconSizeMedium,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor:
                AlwaysStoppedAnimation<Color>(AppColors.warning),
          ),
        );
      case 'approved':
        return Icon(
          Icons.check_circle,
          color: AppColors.success,
          size: UIConstants.iconSizeMedium,
        );
      case 'rejected':
      case 'suspended':
        return Icon(
          Icons.cancel,
          color: AppColors.error,
          size: UIConstants.iconSizeMedium,
        );
      default:
        return Icon(
          Icons.help_outline,
          color: AppColors.neutral500,
          size: UIConstants.iconSizeMedium,
        );
    }
  }

  Widget _buildStatusCard(
    String status,
    String? rejectionReason,
  ) {
    final cardColor = _getStatusBackgroundColor(status);
    final textColor = _getStatusColor(status);
    final statusText = _getStatusText(status);

    return PharmaCard(
      color: cardColor,
      border: Border.all(color: textColor, width: 1),
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      margin: const EdgeInsets.symmetric(horizontal: UIConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status header with icon and text
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatusIcon(status),
              const SizedBox(width: UIConstants.paddingMedium),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      statusText,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: textColor,
                            fontWeight: FontWeight.w600,
                          ) ??
                          const TextStyle(),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Rejection reason if applicable
          if (rejectionReason != null) ...[
            const SizedBox(height: UIConstants.paddingMedium),
            Container(
              decoration: BoxDecoration(
                color: AppColors.neutralWhite.withOpacity(0.5),
                borderRadius: BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
              padding: const EdgeInsets.all(UIConstants.paddingSmall),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Reason for rejection:',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.neutral900,
                          fontWeight: FontWeight.w600,
                        ) ??
                        const TextStyle(),
                  ),
                  const SizedBox(height: UIConstants.paddingSmall),
                  Text(
                    rejectionReason,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.neutral700,
                        ) ??
                        const TextStyle(),
                  ),
                ],
              ),
            ),
          ],

          // Estimated review time (if pending)
          if (status == 'pending') ...[
            const SizedBox(height: UIConstants.paddingMedium),
            Container(
              decoration: BoxDecoration(
                color: AppColors.neutralWhite.withOpacity(0.5),
                borderRadius: BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
              padding: const EdgeInsets.all(UIConstants.paddingSmall),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: AppColors.warning,
                    size: UIConstants.iconSizeSmall,
                  ),
                  const SizedBox(width: UIConstants.paddingSmall),
                  Expanded(
                    child: Text(
                      'Estimated review time: 2-3 business days',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral700,
                          ) ??
                          const TextStyle(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTimelineStep(
    int stepNumber,
    String label,
    String status, // 'completed', 'in_progress', 'pending'
  ) {
    final isCompleted = status == 'completed';
    final isInProgress = status == 'in_progress';
    final textColor = isCompleted
        ? AppColors.success
        : isInProgress
            ? AppColors.warning
            : AppColors.neutral500;

    return Column(
      children: [
        Row(
          children: [
            // Step circle
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isCompleted
                    ? AppColors.successLight
                    : isInProgress
                        ? AppColors.warningLight
                        : AppColors.neutral100,
                border: Border.all(
                  color: textColor,
                  width: 2,
                ),
              ),
              child: Center(
                child: isCompleted
                    ? Icon(
                        Icons.check,
                        color: AppColors.success,
                        size: UIConstants.iconSizeSmall,
                      )
                    : isInProgress
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                AppColors.warning,
                              ),
                            ),
                          )
                        : Text(
                            '$stepNumber',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  color: AppColors.neutral500,
                                  fontWeight: FontWeight.w600,
                                ) ??
                                const TextStyle(),
                          ),
              ),
            ),
            const SizedBox(width: UIConstants.paddingMedium),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: textColor,
                      fontWeight: isCompleted || isInProgress
                          ? FontWeight.w600
                          : FontWeight.w400,
                    ) ??
                    const TextStyle(),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        // Vertical connector line (except for last step)
        if (stepNumber < 4) ...[
          Padding(
            padding: const EdgeInsets.only(
              left: 20,
              top: UIConstants.paddingSmall,
              bottom: UIConstants.paddingSmall,
            ),
            child: Container(
              width: 2,
              height: 40,
              color: isCompleted ? AppColors.success : AppColors.neutral300,
            ),
          ),
        ] else ...[
          const SizedBox(height: UIConstants.paddingSmall),
        ],
      ],
    );
  }

  Widget _buildDocumentStatusRow(
    String documentName,
    String status, // 'uploaded', 'verified', 'rejected', 'pending'
  ) {
    Color statusColor;
    IconData statusIcon;

    switch (status) {
      case 'verified':
        statusColor = AppColors.success;
        statusIcon = Icons.verified;
        break;
      case 'rejected':
        statusColor = AppColors.error;
        statusIcon = Icons.cancel;
        break;
      case 'pending':
        statusColor = AppColors.warning;
        statusIcon = Icons.schedule;
        break;
      case 'uploaded':
      default:
        statusColor = AppColors.info;
        statusIcon = Icons.check_circle;
    }

    return PharmaCard(
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingMedium,
        vertical: UIConstants.paddingSmall,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  documentName,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.neutral900,
                        fontWeight: FontWeight.w500,
                      ) ??
                      const TextStyle(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: UIConstants.paddingXSmall),
                Text(
                  'Status: ${status.replaceAll('_', ' ').toUpperCase()}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.neutral600,
                      ) ??
                      const TextStyle(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Icon(
            statusIcon,
            color: statusColor,
            size: UIConstants.iconSizeMedium,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Pharmacy Approval',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w600,
              ) ??
              const TextStyle(),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        elevation: 0,
      ),
      body: RefreshIndicator(
        key: _refreshKey,
        onRefresh: _handleRefresh,
        color: AppColors.primary600,
        child: FutureBuilder<Map<String, dynamic>>(
          future: _pharmacyFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Center(
                child: CircularProgressIndicator(
                  color: AppColors.primary600,
                ),
              );
            }

            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: AppColors.error,
                      size: UIConstants.iconSizeXLarge,
                    ),
                    const SizedBox(height: UIConstants.paddingMedium),
                    Text(
                      'Failed to load approval status',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.neutral700,
                          ) ??
                          const TextStyle(),
                    ),
                    const SizedBox(height: UIConstants.paddingMedium),
                    PharmaButton(
                      label: 'Try Again',
                      onPressed: _handleRefresh,
                      variant: ButtonVariant.primary,
                      size: ButtonSize.medium,
                    ),
                  ],
                ),
              );
            }

            if (!snapshot.hasData) {
              return EmptyState(
                icon: Icons.info_outline,
                title: 'No Data Available',
                subtitle: 'Could not retrieve pharmacy approval information',
                actionLabel: 'Refresh',
                onAction: _handleRefresh,
              );
            }

            final pharmacy = snapshot.data!;
            final status = pharmacy['status'] as String? ?? 'pending';
            final rejectionReason = pharmacy['rejectionReason'] as String?;
            final documents = pharmacy['documents'] as Map<String, dynamic>? ?? {};
            final submittedAt = pharmacy['submittedAt'] as String?;

            // Determine timeline statuses
            String step2Status = 'pending';
            String step3Status = 'pending';
            String step4Status = 'pending';

            if (status == 'approved') {
              step2Status = 'completed';
              step3Status = 'completed';
              step4Status = 'completed';
            } else if (status == 'pending' || status == 'rejected') {
              step2Status = 'in_progress';
            }

            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: UIConstants.paddingMedium),

                  // Status card
                  _buildStatusCard(status, rejectionReason),

                  const SizedBox(height: UIConstants.paddingLarge),

                  // Timeline section
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          title: 'Verification Timeline',
                          padding: const EdgeInsets.only(
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: UIConstants.paddingMedium,
                          ),
                        ),
                        _buildTimelineStep(1, 'Application Submitted', 'completed'),
                        _buildTimelineStep(2, 'Documents Under Review', step2Status),
                        _buildTimelineStep(3, 'Admin Verification', step3Status),
                        _buildTimelineStep(4, 'Approved & Active', step4Status),
                      ],
                    ),
                  ),

                  const SizedBox(height: UIConstants.paddingLarge),

                  // Documents section
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                    ),
                    child: SectionHeader(
                      title: 'Uploaded Documents',
                      padding: const EdgeInsets.only(
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: UIConstants.paddingMedium,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                    ),
                    child: Column(
                      children: [
                        _buildDocumentStatusRow(
                          'Pharmacy License',
                          (documents['pharmacyLicense']
                                  as Map<String, dynamic>?)
                              ?['status'] as String? ??
                              'pending',
                        ),
                        const SizedBox(height: UIConstants.paddingSmall),
                        _buildDocumentStatusRow(
                          'CAC Certificate',
                          (documents['cacCertificate']
                                  as Map<String, dynamic>?)
                              ?['status'] as String? ??
                              'pending',
                        ),
                        const SizedBox(height: UIConstants.paddingSmall),
                        _buildDocumentStatusRow(
                          "Owner's Government ID",
                          (documents['governmentId']
                                  as Map<String, dynamic>?)
                              ?['status'] as String? ??
                              'pending',
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: UIConstants.paddingLarge),

                  // Action buttons
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: UIConstants.paddingMedium,
                    ),
                    child: Column(
                      children: [
                        if (status == 'pending') ...[
                          PharmaButton(
                            label: 'Contact Support',
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Support contact feature coming soon',
                                  ),
                                ),
                              );
                            },
                            variant: ButtonVariant.primary,
                            size: ButtonSize.large,
                            fullWidth: true,
                          ),
                        ] else if (status == 'approved') ...[
                          PharmaButton(
                            label: 'Go to Dashboard',
                            onPressed: () {
                              context.go('/dashboard/pharmacy');
                            },
                            variant: ButtonVariant.primary,
                            size: ButtonSize.large,
                            fullWidth: true,
                          ),
                        ] else if (status == 'rejected') ...[
                          PharmaButton(
                            label: 'Resubmit Application',
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Resubmission feature coming soon',
                                  ),
                                ),
                              );
                            },
                            variant: ButtonVariant.primary,
                            size: ButtonSize.large,
                            fullWidth: true,
                          ),
                          const SizedBox(height: UIConstants.paddingSmall),
                          PharmaButton(
                            label: 'Contact Support',
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Support contact feature coming soon',
                                  ),
                                ),
                              );
                            },
                            variant: ButtonVariant.outline,
                            size: ButtonSize.large,
                            fullWidth: true,
                          ),
                        ] else if (status == 'suspended') ...[
                          PharmaButton(
                            label: 'Contact Support',
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Support contact feature coming soon',
                                  ),
                                ),
                              );
                            },
                            variant: ButtonVariant.primary,
                            size: ButtonSize.large,
                            fullWidth: true,
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: UIConstants.paddingXLarge),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
