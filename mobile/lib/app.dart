import 'package:flutter/material.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/config/router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/services/notification_service.dart';
import 'package:pharmaconnect/services/socket_service.dart';
import 'package:provider/provider.dart';

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Initialize real-time services after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initServices();
    });
  }

  void _initServices() {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      _connectRealtime();
    }

    // Re-connect when auth state changes
    authProvider.addListener(() {
      if (authProvider.isAuthenticated) {
        _connectRealtime();
      } else {
        _disconnectRealtime();
      }
    });
  }

  void _connectRealtime() {
    final socket = context.read<SocketService>();
    final notifications = context.read<NotificationService>();

    socket.connect();
    notifications.initialize();
  }

  void _disconnectRealtime() {
    final socket = context.read<SocketService>();
    final notifications = context.read<NotificationService>();

    socket.disconnect();
    notifications.reset();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Reconnect when app comes to foreground
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated) {
        _connectRealtime();
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final router = AppRouter.createRouter(authProvider);

        return MaterialApp.router(
          title: AppConstants.appName,
          theme: AppTheme.lightTheme(),
          darkTheme: AppTheme.darkTheme(),
          themeMode: ThemeMode.light,
          routerConfig: router,
          debugShowCheckedModeBanner: false,
          supportedLocales: const [
            Locale('en', 'US'),
          ],
        );
      },
    );
  }
}
