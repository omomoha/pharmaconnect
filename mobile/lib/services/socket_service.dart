import 'dart:async';
import 'dart:math';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:pharmaconnect/config/constants.dart';
import 'package:pharmaconnect/services/logging_service.dart';

/// Socket event names — must match backend SOCKET_EVENTS constants
class SocketEvents {
  static const String connect = 'connection';
  static const String disconnect = 'disconnect';
  static const String error = 'error';
  static const String authSuccess = 'auth_success';
  static const String authError = 'auth_error';

  // Chat
  static const String chatRoomJoin = 'chat_room_join';
  static const String chatRoomLeave = 'chat_room_leave';
  static const String chatMessageSend = 'chat_message_send';
  static const String chatMessageReceive = 'chat_message_receive';
  static const String chatMessageRead = 'chat_message_read';
  static const String chatTyping = 'chat_typing';
  static const String chatStoppedTyping = 'chat_stopped_typing';

  // Delivery
  static const String deliveryLocationUpdate = 'delivery_location_update';
  static const String deliveryStatusChange = 'delivery_status_change';

  // Notifications
  static const String notificationReceived = 'notification_received';
}

/// Singleton service managing the Socket.IO connection
class SocketService extends ChangeNotifier {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool _isConnected = false;
  String? _currentUserId;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  final Random _random = Random();

  bool get isConnected => _isConnected;
  io.Socket? get socket => _socket;

  /// Connect to the Socket.IO server with Firebase auth token
  Future<void> connect() async {
    if (_isConnected && _socket != null) return;

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        LoggingService.warning('No authenticated user, skipping connect', tag: 'SocketService');
        return;
      }

      _currentUserId = user.uid;
      final token = await user.getIdToken();

      // Extract base URL (remove /api/v1 suffix)
      String socketUrl = AppConstants.baseApiUrl;
      final apiPathIndex = socketUrl.indexOf('/api/');
      if (apiPathIndex != -1) {
        socketUrl = socketUrl.substring(0, apiPathIndex);
      }

      _socket = io.io(
        socketUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': token})
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionAttempts(5)
            .build(),
      );

      _setupListeners();
      _socket!.connect();
    } catch (e) {
      LoggingService.error('Connection error', tag: 'SocketService', error: e);
    }
  }

  void _setupListeners() {
    _socket!.onConnect((_) {
      LoggingService.info('Connected', tag: 'SocketService');
      _isConnected = true;
      _reconnectAttempts = 0;
      notifyListeners();

      // Join personal notification room
      if (_currentUserId != null) {
        _socket!.emit(SocketEvents.chatRoomJoin, {
          'conversationId': 'notifications:$_currentUserId',
        });
      }
    });

    _socket!.onDisconnect((_) {
      LoggingService.info('Disconnected', tag: 'SocketService');
      _isConnected = false;
      notifyListeners();
    });

    _socket!.onConnectError((data) {
      LoggingService.error('Connection error: $data', tag: 'SocketService');
      _isConnected = false;
      notifyListeners();
      _scheduleReconnect();
    });

    _socket!.on(SocketEvents.authSuccess, (data) {
      LoggingService.info('Auth success: $data', tag: 'SocketService');
    });

    _socket!.on(SocketEvents.authError, (data) {
      LoggingService.error('Auth error: $data', tag: 'SocketService');
      _isConnected = false;
      notifyListeners();
    });

    _socket!.on(SocketEvents.error, (data) {
      LoggingService.error('Socket error: $data', tag: 'SocketService');
    });
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) return;
    _reconnectTimer?.cancel();

    // Exponential backoff with jitter: base delay increases exponentially, then add 0-1000ms jitter
    final baseDelayMs = (1000 * pow(2, _reconnectAttempts)).toInt().clamp(1000, 60000);
    final jitterMs = _random.nextInt(1001); // 0-1000ms
    final totalDelayMs = baseDelayMs + jitterMs;

    LoggingService.info(
      'Scheduling reconnect attempt ${_reconnectAttempts + 1}/$_maxReconnectAttempts in ${totalDelayMs}ms',
      tag: 'SocketService',
    );

    _reconnectTimer = Timer(
      Duration(milliseconds: totalDelayMs),
      () {
        _reconnectAttempts++;
        connect();
      },
    );
  }

  // ── Chat Room Management ──

  void joinChatRoom(String conversationId) {
    _socket?.emit(SocketEvents.chatRoomJoin, {
      'conversationId': conversationId,
    });
  }

  void leaveChatRoom(String conversationId) {
    _socket?.emit(SocketEvents.chatRoomLeave, {
      'conversationId': conversationId,
    });
  }

  // ── Chat Messages ──

  void sendMessage(String conversationId, String content) {
    _socket?.emit(SocketEvents.chatMessageSend, {
      'conversationId': conversationId,
      'content': content,
    });
  }

  void markMessageRead(String conversationId, String messageId) {
    _socket?.emit(SocketEvents.chatMessageRead, {
      'conversationId': conversationId,
      'messageId': messageId,
    });
  }

  void sendTyping(String conversationId) {
    _socket?.emit(SocketEvents.chatTyping, {
      'conversationId': conversationId,
    });
  }

  void sendStoppedTyping(String conversationId) {
    _socket?.emit(SocketEvents.chatStoppedTyping, {
      'conversationId': conversationId,
    });
  }

  // ── Delivery Tracking ──

  void joinDeliveryRoom(String assignmentId) {
    _socket?.emit(SocketEvents.chatRoomJoin, {
      'conversationId': 'delivery:$assignmentId',
    });
  }

  void leaveDeliveryRoom(String assignmentId) {
    _socket?.emit(SocketEvents.chatRoomLeave, {
      'conversationId': 'delivery:$assignmentId',
    });
  }

  void emitLocationUpdate({
    required String assignmentId,
    required double latitude,
    required double longitude,
    required String riderId,
  }) {
    _socket?.emit(SocketEvents.deliveryLocationUpdate, {
      'assignmentId': assignmentId,
      'latitude': latitude,
      'longitude': longitude,
      'riderId': riderId,
    });
  }

  void emitDeliveryStatusChange(String assignmentId, String status) {
    _socket?.emit(SocketEvents.deliveryStatusChange, {
      'assignmentId': assignmentId,
      'status': status,
    });
  }

  // ── Event Listeners ──

  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  void off(String event, [Function(dynamic)? callback]) {
    _socket?.off(event, callback);
  }

  // ── Cleanup ──

  void disconnect() {
    _reconnectTimer?.cancel();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _currentUserId = null;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}
