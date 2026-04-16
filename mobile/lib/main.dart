import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:pharmaconnect/app.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/providers/cart_provider.dart';
import 'package:pharmaconnect/services/api_service.dart';
import 'package:pharmaconnect/services/auth_service.dart';
import 'package:provider/provider.dart';
import 'package:pharmaconnect/config/firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  final authService = AuthService();
  final apiService = ApiService();

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
      ],
      child: const App(),
    ),
  );
}
