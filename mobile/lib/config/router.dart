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
import 'package:pharmaconnect/screens/delivery/delivery_registration_screen.dart';
import 'package:pharmaconnect/screens/delivery/delivery_assignments_screen.dart';
import 'package:pharmaconnect/screens/delivery/delivery_navigation_screen.dart';
import 'package:pharmaconnect/screens/delivery/delivery_verification_screen.dart';
import 'package:pharmaconnect/screens/delivery/delivery_earnings_screen.dart';
import 'package:pharmaconnect/screens/admin/admin_dashboard_screen.dart';
import 'package:pharmaconnect/screens/shared/conversations_screen.dart';
import 'package:pharmaconnect/screens/shared/chat_screen.dart';
import 'package:pharmaconnect/screens/shared/delivery_tracking_screen.dart';
import 'package:pharmaconnect/screens/shared/notifications_screen.dart';

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
          if (state.matchedLocation.startsWith('/dashboard') ||
              state.matchedLocation.startsWith('/chat') ||
              state.matchedLocation.startsWith('/notifications') ||
              state.matchedLocation.startsWith('/delivery/track')) {
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

        // ── Shared routes (all roles) ──
        GoRoute(
          path: '/conversations',
          name: 'conversations',
          builder: (context, state) => const ConversationsScreen(),
        ),
        GoRoute(
          path: '/chat/:conversationId',
          name: 'chat',
          builder: (context, state) => ChatScreen(
            conversationId: state.pathParameters['conversationId']!,
          ),
        ),
        GoRoute(
          path: '/notifications',
          name: 'notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/delivery/track/:assignmentId',
          name: 'deliveryTracking',
          builder: (context, state) {
            final extra =
                state.extra as Map<String, dynamic>? ?? {};
            return DeliveryTrackingScreen(
              assignmentId: state.pathParameters['assignmentId']!,
              riderName: extra['riderName'] as String? ?? 'Delivery Rider',
              status: extra['status'] as String? ?? 'in_transit',
              pickupLat: extra['pickupLat'] as double?,
              pickupLng: extra['pickupLng'] as double?,
              deliveryLat: extra['deliveryLat'] as double?,
              deliveryLng: extra['deliveryLng'] as double?,
            );
          },
        ),

        // ── Dashboard routes ──
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

        // ── Customer shopping routes ──
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

        // ── Pharmacy management routes ──
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

        // ── Delivery provider routes ──
        GoRoute(
          path: '/delivery/register',
          name: 'deliveryRegistration',
          builder: (context, state) => const DeliveryRegistrationScreen(),
        ),
        GoRoute(
          path: '/delivery/assignments',
          name: 'deliveryAssignments',
          builder: (context, state) => const DeliveryAssignmentsScreen(),
        ),
        GoRoute(
          path: '/delivery/navigate/:id',
          name: 'deliveryNavigation',
          builder: (context, state) => DeliveryNavigationScreen(
            orderId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/delivery/verify-code/:id',
          name: 'deliveryVerification',
          builder: (context, state) => DeliveryVerificationScreen(
            orderId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(
          path: '/delivery/earnings',
          name: 'deliveryEarnings',
          builder: (context, state) => const DeliveryEarningsScreen(),
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
  // Chat & notifications
  static const String conversations = '/conversations';
  static const String notifications = '/notifications';
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
  // Delivery routes
  static const String deliveryRegistration = '/delivery/register';
  static const String deliveryAssignments = '/delivery/assignments';
  static const String deliveryEarnings = '/delivery/earnings';
}
