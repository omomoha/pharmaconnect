import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:pharmaconnect/app.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/providers/cart_provider.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/auth_service.dart';
import 'package:pharmaconnect/services/notification_service.dart';
import 'package:pharmaconnect/services/socket_service.dart';
import 'package:provider/provider.dart';
import 'package:pharmaconnect/config/firebase_options.dart';

/// Background message handler — must be top-level
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  debugPrint('Background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Register background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  final authService = AuthService();
  final apiService = ApiService();
  final socketService = SocketService();
  final notificationService = NotificationService();

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
      ],
      child: const App(),
    ),
  );
}
