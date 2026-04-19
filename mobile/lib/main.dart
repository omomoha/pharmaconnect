import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:pharmaconnect/app.dart';
import 'package:pharmaconnect/config/firebase_options.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/providers/cart_provider.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/auth_service.dart';
import 'package:pharmaconnect/services/connectivity_service.dart';
import 'package:pharmaconnect/services/crash_reporting_service.dart';
import 'package:pharmaconnect/services/feature_flags_service.dart';
import 'package:pharmaconnect/services/notification_service.dart';
import 'package:pharmaconnect/services/socket_service.dart';
import 'package:provider/provider.dart';

/// Background message handler — must be top-level
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  // Background message received — handled silently in production
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Initialize crash reporting
  await CrashReportingService.initialize();

  // Initialize feature flags
  await FeatureFlagsService.initialize();

  // Register background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Initialize services
  final authService = AuthService();
  final apiService = ApiService();
  final socketService = SocketService();
  final notificationService = NotificationService();
  final connectivityService = ConnectivityService();

  // Start connectivity monitoring
  connectivityService.startMonitoring();

  // Wrap app in zone to catch async errors
  runZonedGuarded(
    () {
      runApp(
        MultiProvider(
          providers: [
            Provider<AuthService>(create: (_) => authService),
            Provider<ApiService>(create: (_) => apiService),
            ChangeNotifierProvider(
              create: (_) => AuthProvider(authService: authService),
            ),
            ChangeNotifierProvider(
              create: (_) => CartProvider(),
            ),
            ChangeNotifierProvider<SocketService>.value(
              value: socketService,
            ),
            ChangeNotifierProvider<NotificationService>.value(
              value: notificationService,
            ),
            ChangeNotifierProvider<ConnectivityService>.value(
              value: connectivityService,
            ),
          ],
          child: const App(),
        ),
      );
    },
    (error, stackTrace) {
      CrashReportingService.recordError(error, stackTrace);
    },
  );
}
