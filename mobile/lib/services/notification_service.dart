import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pharmaconnect/models/notification_model.dart';

/// Handle background messages — must be a top-level function
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Background message: ${message.messageId}');
}

/// Service handling push notifications via FCM and in-app notifications via Firestore
class NotificationService extends ChangeNotifier {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  StreamSubscription<QuerySnapshot>? _notificationSub;
  StreamSubscription<RemoteMessage>? _foregroundSub;

  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _initialized = false;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get initialized => _initialized;

  /// Initialize FCM and listen for notifications
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Request permission
      final settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        debugPrint('NotificationService: Permission granted');

        // Get FCM token and store it
        final token = await _messaging.getToken();
        if (token != null) {
          await _saveFcmToken(token);
        }

        // Listen for token refresh
        _messaging.onTokenRefresh.listen(_saveFcmToken);

        // Handle foreground messages
        _foregroundSub = FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

        // Handle notification tap when app is in background
        FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

        // Check for initial message (app opened via notification)
        final initialMessage = await _messaging.getInitialMessage();
        if (initialMessage != null) {
          _handleNotificationTap(initialMessage);
        }
      }

      // Listen for Firestore notifications
      _listenToFirestoreNotifications();

      _initialized = true;
    } catch (e) {
      debugPrint('NotificationService: Init error: $e');
    }
  }

  /// Save FCM token to the user's Firestore document
  Future<void> _saveFcmToken(String token) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      await _firestore.collection('users').doc(user.uid).set({
        'fcmToken': token,
        'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      debugPrint('NotificationService: FCM token saved');
    } catch (e) {
      debugPrint('NotificationService: Failed to save FCM token: $e');
    }
  }

  /// Handle foreground push messages
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message: ${message.notification?.title}');

    final notification = NotificationModel(
      id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      userId: FirebaseAuth.instance.currentUser?.uid ?? '',
      type: message.data['type'] ?? 'system',
      title: message.notification?.title ?? 'New Notification',
      body: message.notification?.body ?? '',
      data: message.data,
      isRead: false,
      createdAt: DateTime.now(),
    );

    _notifications.insert(0, notification);
    _unreadCount++;
    notifyListeners();

    // Notify any registered callback
    _onNotificationCallback?.call(notification);
  }

  /// Handle notification tap (opens specific screen)
  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    _onNotificationTapCallback?.call(data);
  }

  /// Listen to Firestore notifications collection for the current user
  void _listenToFirestoreNotifications() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    _notificationSub?.cancel();
    _notificationSub = _firestore
        .collection('notifications')
        .where('userId', isEqualTo: user.uid)
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .listen(
      (snapshot) {
        _notifications = snapshot.docs.map((doc) {
          final data = doc.data();
          data['id'] = doc.id;
          return NotificationModel.fromJson(data);
        }).toList();

        _unreadCount = _notifications.where((n) => !n.isRead).length;
        notifyListeners();
      },
      onError: (e) {
        debugPrint('NotificationService: Firestore listen error: $e');
      },
    );
  }

  /// Mark a notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _firestore
          .collection('notifications')
          .doc(notificationId)
          .update({'isRead': true});
    } catch (e) {
      debugPrint('NotificationService: Mark read error: $e');
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      final batch = _firestore.batch();
      final unread = await _firestore
          .collection('notifications')
          .where('userId', isEqualTo: user.uid)
          .where('isRead', isEqualTo: false)
          .get();

      for (final doc in unread.docs) {
        batch.update(doc.reference, {'isRead': true});
      }

      await batch.commit();
    } catch (e) {
      debugPrint('NotificationService: Mark all read error: $e');
    }
  }

  // ── Callbacks ──

  Function(NotificationModel)? _onNotificationCallback;
  Function(Map<String, dynamic>)? _onNotificationTapCallback;

  void onNotification(Function(NotificationModel) callback) {
    _onNotificationCallback = callback;
  }

  void onNotificationTap(Function(Map<String, dynamic>) callback) {
    _onNotificationTapCallback = callback;
  }

  // ── Cleanup ──

  void reset() {
    _notificationSub?.cancel();
    _foregroundSub?.cancel();
    _notifications = [];
    _unreadCount = 0;
    _initialized = false;
    notifyListeners();
  }

  @override
  void dispose() {
    reset();
    super.dispose();
  }
}
