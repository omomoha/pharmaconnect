import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';

enum ShimmerVariant { card, list, detail, grid }

class ShimmerLoading extends StatelessWidget {
  final ShimmerVariant variant;
  final int itemCount;

  const ShimmerLoading({
    Key? key,
    this.variant = ShimmerVariant.card,
    this.itemCount = 1,
  }) : super(key: key);

  Widget _buildCardSkeleton() {
    return Shimmer.fromColors(
      baseColor: AppColors.neutral200,
      highlightColor: AppColors.neutral100,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: UIConstants.paddingSmall),
        padding: const EdgeInsets.all(UIConstants.paddingMedium),
        decoration: BoxDecoration(
          color: AppColors.neutral100,
          borderRadius:
              BorderRadius.circular(UIConstants.borderRadiusLarge),
          border: Border.all(color: AppColors.neutral200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 16,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.neutral200,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
            ),
            const SizedBox(height: UIConstants.paddingMedium),
            Container(
              height: 24,
              width: double.infinity * 0.6,
              decoration: BoxDecoration(
                color: AppColors.neutral200,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
            ),
            const SizedBox(height: UIConstants.paddingSmall),
            Container(
              height: 14,
              width: double.infinity * 0.8,
              decoration: BoxDecoration(
                color: AppColors.neutral200,
                borderRadius:
                    BorderRadius.circular(UIConstants.borderRadiusSmall),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildListSkeleton() {
    return Shimmer.fromColors(
      baseColor: AppColors.neutral200,
      highlightColor: AppColors.neutral100,
      child: ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: itemCount,
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.symmetric(
            vertical: UIConstants.paddingSmall,
          ),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.neutral200,
                  borderRadius:
                      BorderRadius.circular(UIConstants.borderRadiusMedium),
                ),
              ),
              const SizedBox(width: UIConstants.paddingMedium),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 14,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.neutral200,
                        borderRadius: BorderRadius.circular(
                            UIConstants.borderRadiusSmall),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 12,
                      width: double.infinity * 0.6,
                      decoration: BoxDecoration(
                        color: AppColors.neutral200,
                        borderRadius: BorderRadius.circular(
                            UIConstants.borderRadiusSmall),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailSkeleton() {
    return Shimmer.fromColors(
      baseColor: AppColors.neutral200,
      highlightColor: AppColors.neutral100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.neutral200,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusLarge),
            ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          Container(
            height: 24,
            width: double.infinity * 0.6,
            decoration: BoxDecoration(
              color: AppColors.neutral200,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusSmall),
            ),
          ),
          const SizedBox(height: UIConstants.paddingSmall),
          Container(
            height: 16,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.neutral200,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusSmall),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 16,
            width: double.infinity * 0.8,
            decoration: BoxDecoration(
              color: AppColors.neutral200,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusSmall),
            ),
          ),
          const SizedBox(height: UIConstants.paddingMedium),
          Container(
            height: 44,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.neutral200,
              borderRadius:
                  BorderRadius.circular(UIConstants.borderRadiusMedium),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGridSkeleton() {
    return Shimmer.fromColors(
      baseColor: AppColors.neutral200,
      highlightColor: AppColors.neutral100,
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: UIConstants.paddingMedium,
          crossAxisSpacing: UIConstants.paddingMedium,
          childAspectRatio: 0.75,
        ),
        itemCount: itemCount,
        itemBuilder: (context, index) => Container(
          decoration: BoxDecoration(
            color: AppColors.neutral200,
            borderRadius:
                BorderRadius.circular(UIConstants.borderRadiusLarge),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.neutral200,
                    borderRadius: BorderRadius.only(
                      topLeft:
                          Radius.circular(UIConstants.borderRadiusLarge),
                      topRight:
                          Radius.circular(UIConstants.borderRadiusLarge),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(UIConstants.paddingSmall),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 12,
                      width: double.infinity * 0.8,
                      decoration: BoxDecoration(
                        color: AppColors.neutral200,
                        borderRadius: BorderRadius.circular(
                            UIConstants.borderRadiusSmall),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 10,
                      width: double.infinity * 0.5,
                      decoration: BoxDecoration(
                        color: AppColors.neutral200,
                        borderRadius: BorderRadius.circular(
                            UIConstants.borderRadiusSmall),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    switch (variant) {
      case ShimmerVariant.card:
        return _buildCardSkeleton();
      case ShimmerVariant.list:
        return _buildListSkeleton();
      case ShimmerVariant.detail:
        return _buildDetailSkeleton();
      case ShimmerVariant.grid:
        return _buildGridSkeleton();
    }
  }
}
