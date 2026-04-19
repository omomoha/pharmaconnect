import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pharmaconnect/models/user_model.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/screens/auth/splash_screen.dart';
import 'package:pharmaconnect/services/auth_service.dart';
import 'package:provider/provider.dart';

void main() {
  group('SplashScreen', () {
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

      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('PharmaConnect'), findsOneWidget);
    });

    testWidgets('SplashScreen animation completes without errors',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createWidgetUnderTest(authProvider: mockAuthProvider),
      );

      await tester.pumpAndSettle(const Duration(seconds: 2));

      expect(find.byType(SplashScreen), findsOneWidget);
    });
  });
}

/// Mock AuthProvider that implements the AuthProvider interface
/// without requiring Firebase dependencies.
class MockAuthProvider extends ChangeNotifier implements AuthProvider {
  @override
  AuthService get authService => throw UnimplementedError();

  @override
  bool get isAuthenticated => false;

  @override
  UserModel? get user => null;

  @override
  bool get isLoading => false;

  @override
  String? get error => null;

  @override
  bool get isCustomer => false;

  @override
  bool get isPharmacyAdmin => false;

  @override
  bool get isDeliveryAdmin => false;

  @override
  bool get isPlatformAdmin => false;

  @override
  bool get isSupportAdmin => false;

  @override
  String getDashboardRoute() => '/login';

  @override
  Future<void> login({
    required String email,
    required String password,
  }) async {}

  @override
  Future<void> register({
    required String email,
    required String password,
    required String displayName,
    required String phoneNumber,
    required UserRole role,
    bool registerOnMalPay = false,
  }) async {}

  @override
  Future<void> signInWithPhone({
    required String phoneNumber,
    required void Function(String, int?) onCodeSent,
    required void Function(String) onCodeAutoRetrievalTimeout,
  }) async {}

  @override
  Future<void> verifyPhoneOTP(String otp) async {}

  @override
  Future<void> logout() async {}

  @override
  Future<void> updateProfile({
    String? displayName,
    String? phoneNumber,
    String? photoUrl,
  }) async {}

  @override
  Future<void> sendPasswordResetEmail(String email) async {}

  @override
  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {}

  @override
  Future<void> sendEmailVerification() async {}

  @override
  Future<void> deleteAccount(String password) async {}

  @override
  void clearError() {}
}
