import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/providers/auth_provider.dart';
import 'package:pharmaconnect/screens/auth/login_screen.dart';
import 'package:pharmaconnect/screens/auth/register_screen.dart';
import 'package:pharmaconnect/screens/auth/splash_screen.dart';
import 'package:pharmaconnect/screens/auth/forgot_password_screen.dart';
import 'package:pharmaconnect/screens/customer/customer_dashboard_screen.dart';
import 'package:pharmaconnect/screens/customer/browse_pharmacies_screen.dart';
import 'package:pharmaconnect/screens/customer/pharmacy_detail_screen.dart';
import 'package:pharmaconnect/screens/customer/product_search_screen.dart';
import 'package:pharmaconnect/screens/customer/product_detail_screen.dart';
import 'package:pharmaconnect/screens/customer/cart_screen.dart';
import 'package:pharmaconnect/screens/customer/checkout_screen.dart';
import 'package:pharmaconnect/screens/customer/order_history_screen.dart';
import 'package:pharmaconnect/screens/customer/order_detail_screen.dart';
import 'package:pharmaconnect/screens/pharmacy/pharmacy_dashboard_screen.dart';
import 'package:pharmaconnect/screens/delivery/delivery_dashboard_screen.dart';
import 'package:pharmaconnect/screens/admin/admin_dashboard_screen.dart';

class AppRouter {
  static GoRouter createRouter(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: '/splash',
      debugLogDiagnostics: true,
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isSplash = state.matchedLocation == '/splash';

        if (isSplash) {
          return null;
        }

        if (!isAuthenticated) {
          if (state.matchedLocation.startsWith('/dashboard')) {
            return '/login';
          }
          return null;
        }

        if (state.matchedLocation == '/login' ||
            state.matchedLocation == '/register') {
          return authProvider.getDashboardRoute();
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/splash',
          name: 'splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          name: 'register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/forgot-password',
          name: 'forgotPassword',
          builder: (context, state) => const ForgotPasswordScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) => child,
          routes: [
            GoRoute(
              path: '/dashboard/customer',
              name: 'customerDashboard',
              builder: (context, state) => const CustomerDashboardScreen(),
            ),
            GoRoute(
              path: '/dashboard/pharmacy',
              name: 'pharmacyDashboard',
              builder: (context, state) => const PharmacyDashboardScreen(),
            ),
            GoRoute(
              path: '/dashboard/delivery',
              name: 'deliveryDashboard',
              builder: (context, state) => const DeliveryDashboardScreen(),
            ),
            GoRoute(
              path: '/dashboard/admin',
              name: 'adminDashboard',
              builder: (context, state) => const AdminDashboardScreen(),
            ),
          ],
        ),
        // Customer shopping routes
        GoRoute(
          path: '/customer/browse-pharmacies',
          name: 'browsePharmacies',
          builder: (context, state) => const BrowsePharmaciesScreen(),
        ),
        GoRoute(
          path: '/customer/pharmacy/:id',
          name: 'pharmacyDetail',
          builder: (context, state) => PharmacyDetailScreen(
            pharmacyId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/customer/product-search',
          name: 'productSearch',
          builder: (context, state) => const ProductSearchScreen(),
        ),
        GoRoute(
          path: '/customer/product/:id',
          name: 'productDetail',
          builder: (context, state) => ProductDetailScreen(
            productId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/customer/cart',
          name: 'cart',
          builder: (context, state) => const CartScreen(),
        ),
        GoRoute(
          path: '/customer/checkout',
          name: 'checkout',
          builder: (context, state) => const CheckoutScreen(),
        ),
        GoRoute(
          path: '/customer/orders',
          name: 'orderHistory',
          builder: (context, state) => const OrderHistoryScreen(),
        ),
        GoRoute(
          path: '/customer/orders/:id',
          name: 'orderDetail',
          builder: (context, state) => OrderDetailScreen(
            orderId: state.pathParameters['id']!,
          ),
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64),
              const SizedBox(height: 16),
              Text('Route not found: ${state.matchedLocation}'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go('/'),
                child: const Text('Go Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class RouteNames {
  static const String splash = '/splash';
  static const String login = '/login';
  static const String register = '/register';
  static const String customerDashboard = '/dashboard/customer';
  static const String pharmacyDashboard = '/dashboard/pharmacy';
  static const String deliveryDashboard = '/dashboard/delivery';
  static const String adminDashboard = '/dashboard/admin';
  static const String forgotPassword = '/forgot-password';
  static const String browsePharmacies = '/customer/browse-pharmacies';
  static const String productSearch = '/customer/product-search';
  static const String cart = '/customer/cart';
  static const String checkout = '/customer/checkout';
  static const String orderHistory = '/customer/orders';
}
