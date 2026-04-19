import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class VersionService {
  static const String currentVersion = '1.0.0';

  /// Check if an app update is available
  /// Returns true if update is needed, false otherwise
  Future<bool> checkForUpdate() async {
    try {
      // TODO: Replace with actual remote version check
      // This could be from Firebase Remote Config, API endpoint, or App Store
      // For now, stub returns false (no update needed)
      final remoteVersion = await _fetchRemoteVersion();
      return _isUpdateNeeded(currentVersion, remoteVersion);
    } catch (e) {
      // Log error but don't block the app
      return false;
    }
  }

  /// Fetch the latest version from remote config
  /// This is a stub — integrate with your backend
  Future<String> _fetchRemoteVersion() async {
    // TODO: Implement actual remote version fetching
    // Example implementations:
    // 1. Firebase Remote Config: await FirebaseRemoteConfig.instance.getString('app_version')
    // 2. Custom API: await apiService.get('/app/version')
    // 3. GitHub releases: parse latest release

    // For now, return current version (no update)
    return currentVersion;
  }

  /// Compare versions to determine if update is needed
  /// Returns true if remoteVersion > currentVersion
  bool _isUpdateNeeded(String current, String remote) {
    try {
      final currentParts = current.split('.').map(int.parse).toList();
      final remoteParts = remote.split('.').map(int.parse).toList();

      // Pad with zeros if lengths differ
      while (currentParts.length < remoteParts.length) {
        currentParts.add(0);
      }
      while (remoteParts.length < currentParts.length) {
        remoteParts.add(0);
      }

      // Compare version parts
      for (int i = 0; i < currentParts.length; i++) {
        if (remoteParts[i] > currentParts[i]) {
          return true;
        } else if (remoteParts[i] < currentParts[i]) {
          return false;
        }
      }

      return false; // Versions are equal
    } catch (e) {
      return false;
    }
  }

  /// Show update dialog to user
  /// Set [isRequired] to true for forced updates
  void showUpdateDialog(
    BuildContext context, {
    bool isRequired = false,
    String appStoreUrl = 'https://apps.apple.com/app/id123456789',
    String playStoreUrl =
        'https://play.google.com/store/apps/details?id=com.pharmaconnect.app',
  }) {
    showDialog(
      context: context,
      barrierDismissible: !isRequired,
      builder: (ctx) => AlertDialog(
        title: const Text('Update Available'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isRequired
                  ? 'A required update is available. Please update to continue using the app.'
                  : 'A new version of PharmaConnect is available. Update now to get the latest features and improvements.',
              style: const TextStyle(fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 16),
            Text(
              'Current: $currentVersion',
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
          ],
        ),
        actions: [
          if (!isRequired)
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Later'),
            ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _openAppStore(appStoreUrl, playStoreUrl);
            },
            child: const Text('Update Now'),
          ),
        ],
      ),
    );
  }

  /// Open app store (iOS) or Play Store (Android)
  Future<void> _openAppStore(String iosUrl, String androidUrl) async {
    try {
      final url = Uri.parse(iosUrl); // Would check platform in real implementation
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      // Silently fail if unable to launch
    }
  }
}
