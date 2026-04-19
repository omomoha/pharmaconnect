import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/widgets/common/index.dart';

enum EarningsPeriod { today, week, month, allTime }

class DeliveryEarningsScreen extends StatefulWidget {
  const DeliveryEarningsScreen({Key? key}) : super(key: key);

  @override
  State<DeliveryEarningsScreen> createState() => _DeliveryEarningsScreenState();
}

class _DeliveryEarningsScreenState extends State<DeliveryEarningsScreen> {
  EarningsPeriod _selectedPeriod = EarningsPeriod.week;
  late Future<EarningsData> _earningsDataFuture;
  late Future<List<Transaction>> _transactionsFuture;

  @override
  void initState() {
    super.initState();
    _earningsDataFuture = _fetchEarningsData();
    _transactionsFuture = _fetchTransactions();
  }

  Future<EarningsData> _fetchEarningsData() async {
    // Mock data - replace with actual API call
    await Future.delayed(const Duration(milliseconds: 800));
    return EarningsData(
      totalEarnings: 45250.50,
      completedDeliveries: 127,
      averagePerDelivery: 356.23,
      thisWeekEarnings: 8950.00,
      lastWeekEarnings: 7650.00,
      currentBalance: 12500.75,
      nextPayoutDate: DateTime.now().add(const Duration(days: 5)),
      bankName: 'Guaranty Trust Bank',
      accountNumber: '****1234',
    );
  }

  Future<List<Transaction>> _fetchTransactions() async {
    // Mock data - replace with actual API call
    await Future.delayed(const Duration(milliseconds: 1000));
    return [
      Transaction(
        id: 'TXN001',
        orderId: 'ORD12345',
        amount: 450.00,
        pharmacyName: 'MediCare Pharmacy',
        distance: 5.2,
        status: 'Paid',
        date: DateTime.now().subtract(const Duration(days: 1)),
      ),
      Transaction(
        id: 'TXN002',
        orderId: 'ORD12344',
        amount: 320.00,
        pharmacyName: 'Wellness Plus',
        distance: 3.8,
        status: 'Paid',
        date: DateTime.now().subtract(const Duration(days: 2)),
      ),
      Transaction(
        id: 'TXN003',
        orderId: 'ORD12343',
        amount: 520.00,
        pharmacyName: 'Premium Health Center',
        distance: 7.1,
        status: 'Pending',
        date: DateTime.now().subtract(const Duration(days: 3)),
      ),
      Transaction(
        id: 'TXN004',
        orderId: 'ORD12342',
        amount: 380.00,
        pharmacyName: 'Quick Care Pharmacy',
        distance: 4.5,
        status: 'Paid',
        date: DateTime.now().subtract(const Duration(days: 4)),
      ),
      Transaction(
        id: 'TXN005',
        orderId: 'ORD12341',
        amount: 410.00,
        pharmacyName: 'City Pharmacy',
        distance: 6.2,
        status: 'Pending',
        date: DateTime.now().subtract(const Duration(days: 5)),
      ),
    ];
  }

  void _refreshData() {
    setState(() {
      _earningsDataFuture = _fetchEarningsData();
      _transactionsFuture = _fetchTransactions();
    });
  }

  void _requestPayout() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payout request submitted successfully'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  String _getPeriodLabel() {
    switch (_selectedPeriod) {
      case EarningsPeriod.today:
        return 'Today';
      case EarningsPeriod.week:
        return 'This Week';
      case EarningsPeriod.month:
        return 'This Month';
      case EarningsPeriod.allTime:
        return 'All Time';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralWhite,
      appBar: AppBar(
        backgroundColor: AppColors.neutralWhite,
        elevation: 0,
        title: Text(
          'Earnings',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.neutral900,
                fontWeight: FontWeight.w700,
              ),
        ),
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          color: AppColors.neutral900,
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => _refreshData(),
          color: AppColors.primary600,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                // Summary Section
                _buildSummarySection(),

                // Period Selector
                _buildPeriodSelector(),

                // Earnings Chart Placeholder
                _buildChartSection(),

                // Payout Section
                _buildPayoutSection(),

                // Transaction History Section
                _buildTransactionHistorySection(),

                const SizedBox(height: UIConstants.paddingXLarge),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummarySection() {
    return FutureBuilder<EarningsData>(
      future: _earningsDataFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: UIConstants.paddingMedium,
              vertical: UIConstants.paddingLarge,
            ),
            child: ShimmerLoading(
              variant: ShimmerVariant.card,
              itemCount: 1,
            ),
          );
        }

        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final data = snapshot.data!;
        final weekChange = data.thisWeekEarnings - data.lastWeekEarnings;
        final weekChangePercent =
            ((weekChange / data.lastWeekEarnings) * 100).toStringAsFixed(1);

        return Padding(
          padding: const EdgeInsets.all(UIConstants.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Total Earnings Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(UIConstants.paddingLarge),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary600,
                      AppColors.primary700,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(
                    UIConstants.borderRadiusLarge,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Earnings',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppColors.neutralWhite.withOpacity(0.8),
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingSmall),
                    Text(
                      '₦${data.totalEarnings.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                            color: AppColors.neutralWhite,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: UIConstants.paddingMedium),

              // Stats Grid
              GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: UIConstants.paddingMedium,
                crossAxisSpacing: UIConstants.paddingMedium,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  StatsCard(
                    title: 'Deliveries',
                    value: data.completedDeliveries.toString(),
                    subtitle: 'Completed',
                    icon: Icons.local_shipping_rounded,
                    iconColor: AppColors.secondary600,
                  ),
                  StatsCard(
                    title: 'Average',
                    value: '₦${data.averagePerDelivery.toStringAsFixed(0)}',
                    subtitle: 'Per delivery',
                    icon: Icons.trending_up_rounded,
                    iconColor: AppColors.success,
                  ),
                  StatsCard(
                    title: 'This Week',
                    value: '₦${data.thisWeekEarnings.toStringAsFixed(0)}',
                    subtitle: 'vs last week',
                    icon: Icons.calendar_today_rounded,
                    iconColor: AppColors.warning,
                    trend: weekChange >= 0 ? TrendDirection.up : TrendDirection.down,
                    trendValue:
                        '${weekChange >= 0 ? '+' : ''}$weekChangePercent%',
                  ),
                  StatsCard(
                    title: 'Last Week',
                    value: '₦${data.lastWeekEarnings.toStringAsFixed(0)}',
                    subtitle: 'Previous period',
                    icon: Icons.calendar_today_rounded,
                    iconColor: AppColors.neutral600,
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPeriodSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingMedium,
        vertical: UIConstants.paddingMedium,
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: EarningsPeriod.values.map((period) {
            final isSelected = _selectedPeriod == period;
            final label = period.name[0].toUpperCase() +
                period.name.substring(1).replaceAll('allTime', 'All Time');

            return Padding(
              padding: const EdgeInsets.only(right: UIConstants.paddingSmall),
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedPeriod = period;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: UIConstants.paddingMedium,
                    vertical: UIConstants.paddingSmall,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary600
                        : AppColors.neutral100,
                    borderRadius: BorderRadius.circular(
                      UIConstants.borderRadiusMedium,
                    ),
                    border: !isSelected
                        ? Border.all(color: AppColors.neutral300, width: 1)
                        : null,
                  ),
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: isSelected
                              ? AppColors.neutralWhite
                              : AppColors.neutral600,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildChartSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingMedium,
        vertical: UIConstants.paddingMedium,
      ),
      child: PharmaCard(
        padding: const EdgeInsets.all(UIConstants.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Earnings Trend',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: AppColors.neutral900,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: UIConstants.paddingLarge),
            // Chart Placeholder
            Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                color: AppColors.neutral50,
                borderRadius: BorderRadius.circular(
                  UIConstants.borderRadiusMedium,
                ),
                border: Border.all(
                  color: AppColors.neutral200,
                  width: 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bar_chart_rounded,
                    size: 48,
                    color: AppColors.neutral300,
                  ),
                  const SizedBox(height: UIConstants.paddingMedium),
                  Text(
                    'Chart data for ${_getPeriodLabel()}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.neutral500,
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

  Widget _buildPayoutSection() {
    return FutureBuilder<EarningsData>(
      future: _earningsDataFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final data = snapshot.data!;

        return Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: UIConstants.paddingMedium,
            vertical: UIConstants.paddingMedium,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionHeader(
                title: 'Payout Details',
                padding: const EdgeInsets.symmetric(
                  horizontal: UIConstants.paddingSmall,
                ),
              ),
              const SizedBox(height: UIConstants.paddingMedium),
              // Current Balance Card
              PharmaCard(
                padding: const EdgeInsets.all(UIConstants.paddingMedium),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Balance',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: AppColors.neutral600,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingSmall),
                    Text(
                      '₦${data.currentBalance.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            color: AppColors.primary600,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: UIConstants.paddingMedium),

              // Next Payout Date Card
              PharmaCard(
                padding: const EdgeInsets.all(UIConstants.paddingMedium),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Next Payout',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    color: AppColors.neutral600,
                                    fontWeight: FontWeight.w500,
                                  ),
                            ),
                            const SizedBox(height: UIConstants.paddingSmall),
                            Text(
                              _formatDate(data.nextPayoutDate),
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineSmall
                                  ?.copyWith(
                                    color: AppColors.neutral900,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(
                            UIConstants.paddingMedium,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.successLight,
                            borderRadius: BorderRadius.circular(
                              UIConstants.borderRadiusMedium,
                            ),
                          ),
                          child: Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.success,
                            size: UIConstants.iconSizeLarge,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: UIConstants.paddingMedium),

              // Bank Details Card
              PharmaCard(
                padding: const EdgeInsets.all(UIConstants.paddingMedium),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bank Details',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: AppColors.neutral600,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: UIConstants.paddingMedium),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bank',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppColors.neutral500,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              data.bankName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    color: AppColors.neutral900,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Account Number',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppColors.neutral500,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              data.accountNumber,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    color: AppColors.neutral900,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: UIConstants.paddingLarge),

              // Request Payout Button
              PharmaButton(
                label: 'Request Payout',
                onPressed: _requestPayout,
                variant: ButtonVariant.primary,
                size: ButtonSize.large,
                fullWidth: true,
                icon: Icons.account_balance_wallet_rounded,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTransactionHistorySection() {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: UIConstants.paddingMedium,
        vertical: UIConstants.paddingMedium,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(
            title: 'Transaction History',
            padding: const EdgeInsets.symmetric(
              horizontal: UIConstants.paddingSmall,
            ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          FutureBuilder<List<Transaction>>(
            future: _transactionsFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return ShimmerLoading(
                  variant: ShimmerVariant.list,
                  itemCount: 5,
                );
              }

              if (!snapshot.hasData || snapshot.data!.isEmpty) {
                return EmptyState(
                  icon: Icons.history_rounded,
                  title: 'No Transactions',
                  subtitle: 'Your delivery earnings will appear here',
                  iconColor: AppColors.neutral300,
                );
              }

              final transactions = snapshot.data!;

              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: transactions.length,
                itemBuilder: (context, index) {
                  final transaction = transactions[index];
                  return _buildTransactionCard(transaction);
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(Transaction transaction) {
    final isPaid = transaction.status == 'Paid';
    final statusColor =
        isPaid ? AppColors.success : AppColors.warning;

    return PharmaCard(
      padding: const EdgeInsets.all(UIConstants.paddingMedium),
      margin: const EdgeInsets.only(bottom: UIConstants.paddingSmall),
      child: Column(
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      transaction.pharmacyName,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: AppColors.neutral900,
                            fontWeight: FontWeight.w600,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Order #${transaction.orderId}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.neutral600,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₦${transaction.amount.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppColors.neutral900,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  StatusBadge(
                    label: transaction.status,
                    color: statusColor,
                    backgroundColor: isPaid
                        ? AppColors.successLight
                        : AppColors.warningLight,
                    fontSize: 11,
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: UIConstants.paddingMedium),

          // Details Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildDetailItem(
                icon: Icons.location_on_rounded,
                label: '${transaction.distance} km',
                context: context,
              ),
              _buildDetailItem(
                icon: Icons.calendar_today_rounded,
                label: _formatDateShort(transaction.date),
                context: context,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailItem({
    required IconData icon,
    required String label,
    required BuildContext context,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: UIConstants.iconSizeMedium,
          color: AppColors.neutral600,
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.neutral600,
              ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  String _formatDateShort(DateTime date) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}';
  }
}

// Models
class EarningsData {
  final double totalEarnings;
  final int completedDeliveries;
  final double averagePerDelivery;
  final double thisWeekEarnings;
  final double lastWeekEarnings;
  final double currentBalance;
  final DateTime nextPayoutDate;
  final String bankName;
  final String accountNumber;

  EarningsData({
    required this.totalEarnings,
    required this.completedDeliveries,
    required this.averagePerDelivery,
    required this.thisWeekEarnings,
    required this.lastWeekEarnings,
    required this.currentBalance,
    required this.nextPayoutDate,
    required this.bankName,
    required this.accountNumber,
  });
}

class Transaction {
  final String id;
  final String orderId;
  final double amount;
  final String pharmacyName;
  final double distance;
  final String status; // 'Paid' or 'Pending'
  final DateTime date;

  Transaction({
    required this.id,
    required this.orderId,
    required this.amount,
    required this.pharmacyName,
    required this.distance,
    required this.status,
    required this.date,
  });
}
