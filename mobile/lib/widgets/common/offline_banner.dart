import 'package:flutter/material.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/services/connectivity_service.dart';
import 'package:provider/provider.dart';

/// Banner widget that displays an offline notification when connectivity is lost
/// Automatically shows/hides based on connectivity status
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectivityService>(
      builder: (context, connectivityService, _) {
        if (connectivityService.isOnline) {
          return const SizedBox.shrink();
        }

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: 16.0,
            vertical: 12.0,
          ),
          decoration: BoxDecoration(
            color: AppColors.error,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(
                Icons.wifi_off,
                color: AppColors.neutralWhite,
                size: 18,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  "You're offline",
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.neutralWhite,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
