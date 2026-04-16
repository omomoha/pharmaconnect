import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pharmaconnect/models/product_model.dart';
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
import 'package:pharmaconnect/screens/pharmacy/pharmacy_registration_screen.dart';
import 'package:pharmaconnect/screens/pharmacy/pharmacy_products_screen.dart';
import 'package:pharmaconnect/screens/pharmacy/pharmacy_orders_screen.dart';
import 'package:pharmaconnect/screens/pharmacy/pharmacy_approval_screen.dart';
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
        // Pharmacy management routes
        GoRoute(
          path: '/pharmacy/register',
          name: 'pharmacyRegistration',
          builder: (context, state) => const PharmacyRegistrationScreen(),
        ),
        GoRoute(
          path: '/pharmacy/products',
          name: 'pharmacyProducts',
          builder: (context, state) => const PharmacyProductsScreen(),
        ),
        GoRoute(
          path: '/pharmacy/products/add',
          name: 'addProduct',
          builder: (context, state) => const AddEditProductScreen(),
        ),
        GoRoute(
          path: '/pharmacy/products/edit/:id',
          name: 'editProduct',
          builder: (context, state) => AddEditProductScreen(
            product: state.extra as ProductModel?,
          ),
        ),
        GoRoute(
          path: '/pharmacy/orders',
          name: 'pharmacyOrders',
          builder: (context, state) => const PharmacyOrdersScreen(),
        ),
        GoRoute(
          path: '/pharmacy/orders/:id',
          name: 'pharmacyOrderDetail',
          builder: (context, state) => PharmacyOrderDetailScreen(
            orderId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/pharmacy/approval',
          name: 'pharmacyApproval',
          builder: (context, state) => const PharmacyApprovalScreen(),
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
  // Customer routes
  static const String browsePharmacies = '/customer/browse-pharmacies';
  static const String productSearch = '/customer/product-search';
  static const String cart = '/customer/cart';
  static const String checkout = '/customer/checkout';
  static const String orderHistory = '/customer/orders';
  // Pharmacy routes
  static const String pharmacyRegistration = '/pharmacy/register';
  static const String pharmacyProducts = '/pharmacy/products';
  static const String addProduct = '/pharmacy/products/add';
  static const String pharmacyOrders = '/pharmacy/orders';
  static const String pharmacyApproval = '/pharmacy/approval';
}
