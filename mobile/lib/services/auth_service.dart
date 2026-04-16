import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pharmaconnect/models/user_model.dart';

class AuthService {
  final FirebaseAuth firebaseAuth;
  final FirebaseFirestore firebaseFirestore;

  AuthService({
    FirebaseAuth? firebaseAuth,
    FirebaseFirestore? firebaseFirestore,
  })  : firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
        firebaseFirestore = firebaseFirestore ?? FirebaseFirestore.instance;

  Stream<User?> get authStateChanges => firebaseAuth.authStateChanges();

  User? get currentFirebaseUser => firebaseAuth.currentUser;

  bool get isAuthenticated => currentFirebaseUser != null;

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      await firebaseAuth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> registerWithEmail({
    required String email,
    required String password,
    required String displayName,
    required String phoneNumber,
    required UserRole role,
  }) async {
    try {
      final userCredential = await firebaseAuth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      await userCredential.user?.updateDisplayName(displayName);
      await userCredential.user?.updatePhotoURL(null);

      final newUser = UserModel(
        id: userCredential.user!.uid,
        email: email.trim(),
        displayName: displayName,
        phoneNumber: phoneNumber,
        role: role,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        isEmailVerified: false,
        isPhoneVerified: false,
      );

      await firebaseFirestore
          .collection('users')
          .doc(userCredential.user!.uid)
          .set(newUser.toFirestore());

      await userCredential.user?.sendEmailVerification();
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> signInWithPhone({
    required String phoneNumber,
    required void Function(PhoneAuthCredential) onVerificationCompleted,
    required void Function(FirebaseAuthException) onVerificationFailed,
    required void Function(String, int?) onCodeSent,
    required void Function(String) onCodeAutoRetrievalTimeout,
  }) async {
    try {
      await firebaseAuth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        verificationCompleted: onVerificationCompleted,
        verificationFailed: onVerificationFailed,
        codeSent: onCodeSent,
        codeAutoRetrievalTimeout: onCodeAutoRetrievalTimeout,
        timeout: const Duration(seconds: 120),
      );
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> verifyPhoneOTP({
    required String verificationId,
    required String otp,
  }) async {
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: otp,
      );
      await firebaseAuth.signInWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<UserModel?> getUserProfile() async {
    try {
      final user = currentFirebaseUser;
      if (user == null) return null;

      final doc = await firebaseFirestore
          .collection('users')
          .doc(user.uid)
          .get();

      if (doc.exists) {
        return UserModel.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateUserProfile({
    required String userId,
    required Map<String, dynamic> updates,
  }) async {
    try {
      updates['updatedAt'] = DateTime.now();
      await firebaseFirestore
          .collection('users')
          .doc(userId)
          .update(updates);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await firebaseAuth.sendPasswordResetEmail(email: email.trim());
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final user = currentFirebaseUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );

      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> sendEmailVerification() async {
    try {
      await currentFirebaseUser?.sendEmailVerification();
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> signOut() async {
    try {
      await firebaseAuth.signOut();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteAccount(String password) async {
    try {
      final user = currentFirebaseUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: password,
      );

      await user.reauthenticateWithCredential(credential);
      await firebaseFirestore.collection('users').doc(user.uid).delete();
      await user.delete();
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  String _handleAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'No user found with this email.';
      case 'wrong-password':
        return 'Incorrect password.';
      case 'email-already-in-use':
        return 'Email is already in use.';
      case 'weak-password':
        return 'Password is too weak.';
      case 'invalid-email':
        return 'Invalid email address.';
      case 'user-disabled':
        return 'User account has been disabled.';
      case 'too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'operation-not-allowed':
        return 'This operation is not allowed.';
      case 'credential-already-in-use':
        return 'This credential is already in use.';
      case 'invalid-phone-number':
        return 'Invalid phone number.';
      case 'missing-phone-number':
        return 'Phone number is required.';
      case 'session-expired':
        return 'Session has expired. Please try again.';
      default:
        return e.message ?? 'An authentication error occurred.';
    }
  }
}
