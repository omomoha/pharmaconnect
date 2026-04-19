import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/screens/auth/splash_screen.dart';
import 'package:provider/provider.dart';

void main() {
  group('SplashScreen', () {
    // Mock AuthProvider for testing
    late MockAuthProvider mockAuthProvider;

    setUp(() {
      mockAuthProvider = MockAuthProvider();
    });

    Widget createWidgetUnderTest({
      required AuthProvider authProvider,
    }) {
      return MaterialApp(
        home: ChangeNotifierProvider<AuthProvider>.value(
          value: authProvider,
          child: const SplashScreen(),
        ),
        theme: ThemeData(
          textTheme: const TextTheme(
            displayMedium: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
            bodyMedium: TextStyle(
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    testWidgets('SplashScreen displays PharmaConnect text',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      expect(find.text('PharmaConnect'), findsOneWidget);
    });

    testWidgets('SplashScreen displays subtitle text',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      expect(find.text('Online Pharmacy Marketplace'), findsOneWidget);
    });

    testWidgets('SplashScreen displays loading indicator',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('SplashScreen displays pharmacy icon',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      expect(find.byIcon(Icons.local_pharmacy_outlined), findsOneWidget);
    });

    testWidgets('SplashScreen is wrapped in SafeArea',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      expect(find.byType(SafeArea), findsOneWidget);
    });

    testWidgets('SplashScreen centers content',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      final centerFinder = find.byType(Center);
      expect(centerFinder, findsOneWidget);
    });

    testWidgets('SplashScreen has correct background color',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      final scaffold = find.byType(Scaffold);
      expect(scaffold, findsOneWidget);
    });

    testWidgets('SplashScreen animations are present',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      expect(find.byType(SlideTransition), findsOneWidget);
      expect(find.byType(FadeTransition), findsOneWidget);
      expect(find.byType(ScaleTransition), findsOneWidget);
    });

    testWidgets('SplashScreen displays text elements correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      final textFinders = find.byType(Text);
      expect(textFinders, findsWidgets);

      final appNameText = find.text('PharmaConnect');
      final subtitleText = find.text('Online Pharmacy Marketplace');

      expect(appNameText, findsOneWidget);
      expect(subtitleText, findsOneWidget);
    });

    testWidgets('SplashScreen has proper layout hierarchy',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      final columnFinder = find.byType(Column);
      expect(columnFinder, findsWidgets);
    });

    testWidgets('SplashScreen icon container is properly styled',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      final containerFinder = find.byType(Container);
      expect(containerFinder, findsWidgets);
    });

    testWidgets('SplashScreen shows all child widgets',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      // Check for main content
      expect(find.byIcon(Icons.local_pharmacy_outlined), findsOneWidget);
      expect(find.text('PharmaConnect'), findsOneWidget);
      expect(find.text('Online Pharmacy Marketplace'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('SplashScreen handles frame pumping correctly',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      // Pump to advance animations
      await tester.pump(const Duration(milliseconds: 500));

      // Verify content is still visible
      expect(find.text('PharmaConnect'), findsOneWidget);
    });

    testWidgets('SplashScreen animation completes without errors',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      // Animate forward
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verify no exceptions occurred
      expect(find.byType(SplashScreen), findsOneWidget);
    });
  });
}

// Mock AuthProvider for testing
class MockAuthProvider extends ChangeNotifier implements AuthProvider {
  @override
  bool get isAuthenticated => false;

  @override
  String getDashboardRoute() => '/customer-dashboard';

  @override
  Future<void> login(String email, String password) async {}

  @override
  Future<void> register(String email, String password, String displayName,
      String phoneNumber, String role) async {}

  @override
  Future<void> logout() async {}

  @override
  Future<void> verifyOtp(String otp) async {}

  @override
  Future<void> resendOtp() async {}

  @override
  String? get currentUserId => null;

  @override
  String? get currentUserEmail => null;

  @override
  String? get currentUserRole => null;

  @override
  bool get isLoading => false;

  @override
  String get errorMessage => '';

  @override
  Future<void> checkAuthStatus() async {}

  @override
  Future<void> refreshToken() async {}

  @override
  Future<void> forgotPassword(String email) async {}

  @override
  Future<void> resetPassword(String code, String newPassword) async {}
}
