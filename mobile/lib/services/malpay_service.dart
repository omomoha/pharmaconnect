import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pharmaconnect/config/constants.dart';

/// Service to handle cross-platform MalPay registration
/// from the PharmaConnect mobile app.
class MalPayService {
  final http.Client httpClient;
  final FirebaseAuth firebaseAuth;

  MalPayService({
    http.Client? httpClient,
    FirebaseAuth? firebaseAuth,
  })  : httpClient = httpClient ?? http.Client(),
        firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  /// Register the current PharmaConnect user on MalPay.
  /// This calls the PharmaConnect backend which proxies to MalPay.
  /// Returns true if successful, false otherwise.
  /// This is a best-effort operation — failures are silently handled.
  Future<bool> registerOnMalPay() async {
    try {
      final user = firebaseAuth.currentUser;
      if (user == null) {
        return false;
      }

      final token = await user.getIdToken();
      final response = await httpClient.post(
        Uri.parse('${AppConstants.baseApiUrl}/auth/register-malpay'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return true;
        }
      }

      return false;
    } catch (e) {
      // Silently fail — MalPay registration is best-effort
      return false;
    }
  }
}
