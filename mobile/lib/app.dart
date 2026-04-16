import 'package:flutter/material.dart';
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/config/router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:provider/provider.dart';

class App extends StatelessWidget {
  const App({Key? key}) : super(key: key);

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
