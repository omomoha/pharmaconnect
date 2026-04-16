import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';

/// Service for monitoring device connectivity
/// Uses InternetAddress.lookup for basic connectivity checks
class ConnectivityService extends ChangeNotifier {
  static final ConnectivityService _instance = ConnectivityService._internal();

  factory ConnectivityService() => _instance;

  ConnectivityService._internal();

  bool _isOnline = true;
  Timer? _connectivityTimer;
  final StreamController<bool> _connectivityController = StreamController<bool>.broadcast();

  /// Get current online status
  bool get isOnline => _isOnline;

  /// Get connectivity status stream
  Stream<bool> get onConnectivityChanged => _connectivityController.stream;

  /// Initialize connectivity monitoring
  /// Checks connectivity every 30 seconds in the background
  void startMonitoring() {
    // Initial check
    _checkConnectivity();

    // Set up periodic checks every 30 seconds
    _connectivityTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _checkConnectivity(),
    );
  }

  /// Perform an immediate connectivity check
  /// Uses DNS lookup to google.com (or other reliable host)
  Future<void> _checkConnectivity() async {
    try {
      final result = await InternetAddress.lookup('google.com')
          .timeout(const Duration(seconds: 5));

      final wasOnline = _isOnline;
      _isOnline = result.isNotEmpty && result[0].rawAddress.isNotEmpty;

      // Notify if status changed
      if (wasOnline != _isOnline) {
        _connectivityController.add(_isOnline);
        notifyListeners();
      }
    } on SocketException catch (_) {
      // No internet connection
      if (_isOnline) {
        _isOnline = false;
        _connectivityController.add(false);
        notifyListeners();
      }
    } on TimeoutException catch (_) {
      // Timeout indicates likely no connection
      if (_isOnline) {
        _isOnline = false;
        _connectivityController.add(false);
        notifyListeners();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Connectivity check error: $e');
      }
    }
  }

  /// Stop monitoring connectivity
  void stopMonitoring() {
    _connectivityTimer?.cancel();
    _connectivityTimer = null;
  }

  @override
  void dispose() {
    stopMonitoring();
    _connectivityController.close();
    super.dispose();
  }
}
