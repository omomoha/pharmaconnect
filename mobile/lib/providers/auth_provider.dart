import 'package:flutter/foundation.dart';
import 'package:pharmaconnect/models/user_model.dart';
import 'package:pharmaconnect/services/auth_service.dart';
import 'package:pharmaconnect/services/malpay_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService authService;

  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  String? _verificationId;

  AuthProvider({required this.authService}) {
    _initialize();
  }

  // Getters
  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isCustomer => _user?.role == UserRole.customer;
  bool get isPharmacyAdmin => _user?.role == UserRole.pharmacyAdmin;
  bool get isDeliveryAdmin => _user?.role == UserRole.deliveryAdmin;
  bool get isPlatformAdmin => _user?.role == UserRole.platformAdmin;
  bool get isSupportAdmin => _user?.role == UserRole.supportAdmin;

  void _initialize() {
    authService.authStateChanges.listen((firebaseUser) async {
      if (firebaseUser != null) {
        await _loadUserProfile();
      } else {
        _user = null;
        notifyListeners();
      }
    });
  }

  Future<void> _loadUserProfile() async {
    try {
      _user = await authService.getUserProfile();
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      _user = null;
      notifyListeners();
    }
  }

  /// Sanitize error messages for user display
  String _sanitizeErrorMessage(dynamic error) {
    if (error is Exception) {
      final message = error.toString();
      // Remove "Exception: " prefix if present
      if (message.startsWith('Exception: ')) {
        return message.substring(10);
      }
      return message;
    }
    return 'An error occurred. Please try again.';
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await authService.signInWithEmail(
        email: email,
        password: password,
      );
      await _loadUserProfile();
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      _user = null;
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
    required String phoneNumber,
    required UserRole role,
    bool registerOnMalPay = false,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await authService.registerWithEmail(
        email: email,
        password: password,
        displayName: displayName,
        phoneNumber: phoneNumber,
        role: role,
      );
      await _loadUserProfile();

      // Register on MalPay if opted in (fire-and-forget)
      if (registerOnMalPay) {
        try {
          final malpayService = MalPayService();
          await malpayService.registerOnMalPay();
        } catch (e) {
          // MalPay registration failed — non-blocking, silently continue
        }
      }
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      _user = null;
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signInWithPhone({
    required String phoneNumber,
    required void Function(String, int?) onCodeSent,
    required void Function(String) onCodeAutoRetrievalTimeout,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await authService.signInWithPhone(
        phoneNumber: phoneNumber,
        onVerificationCompleted: (credential) async {
          await authService.firebaseAuth.signInWithCredential(credential);
          await _loadUserProfile();
        },
        onVerificationFailed: (e) {
          _error = e.message ?? 'Phone verification failed';
          _isLoading = false;
          notifyListeners();
        },
        onCodeSent: (verificationId, resendToken) {
          _verificationId = verificationId;
          onCodeSent(verificationId, resendToken);
          _isLoading = false;
          notifyListeners();
        },
        onCodeAutoRetrievalTimeout: (verificationId) {
          _verificationId = verificationId;
          onCodeAutoRetrievalTimeout(verificationId);
          _isLoading = false;
          notifyListeners();
        },
      );
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> verifyPhoneOTP(String otp) async {
    if (_verificationId == null) {
      throw Exception('Verification ID not set');
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await authService.verifyPhoneOTP(
        verificationId: _verificationId!,
        otp: otp,
      );
      await _loadUserProfile();
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      notifyListeners();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await authService.signOut();
      _user = null;
      _error = null;
      _verificationId = null;
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateProfile({
    String? displayName,
    String? phoneNumber,
    String? photoUrl,
  }) async {
    if (_user == null) {
      throw Exception('User not authenticated');
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updates = <String, dynamic>{};
      if (displayName != null) updates['displayName'] = displayName;
      if (phoneNumber != null) updates['phoneNumber'] = phoneNumber;
      if (photoUrl != null) updates['photoUrl'] = photoUrl;

      await authService.updateUserProfile(
        userId: _user!.id,
        updates: updates,
      );

      _user = _user!.copyWith(
        displayName: displayName ?? _user!.displayName,
        phoneNumber: phoneNumber ?? _user!.phoneNumber,
        photoUrl: photoUrl ?? _user!.photoUrl,
      );
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await authService.sendPasswordResetEmail(email);
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await authService.updatePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendEmailVerification() async {
    try {
      await authService.sendEmailVerification();
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> deleteAccount(String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await authService.deleteAccount(password);
      _user = null;
    } catch (e) {
      _error = _sanitizeErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  String getDashboardRoute() {
    if (!isAuthenticated) return '/login';

    switch (_user?.role) {
      case UserRole.customer:
        return '/dashboard/customer';
      case UserRole.pharmacyAdmin:
        return '/dashboard/pharmacy';
      case UserRole.deliveryAdmin:
        return '/dashboard/delivery';
      case UserRole.platformAdmin:
      case UserRole.supportAdmin:
        return '/dashboard/admin';
      default:
        return '/login';
    }
  }
}
