import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:pharmaconnect/config/theme.dart';
import 'package:pharmaconnect/services/socket_service.dart';

class DeliveryTrackingScreen extends StatefulWidget {
  final String assignmentId;
  final String riderName;
  final String status;
  final double? pickupLat;
  final double? pickupLng;
  final double? deliveryLat;
  final double? deliveryLng;

  const DeliveryTrackingScreen({
    super.key,
    required this.assignmentId,
    this.riderName = 'Delivery Rider',
    this.status = 'in_transit',
    this.pickupLat,
    this.pickupLng,
    this.deliveryLat,
    this.deliveryLng,
  });

  @override
  State<DeliveryTrackingScreen> createState() =>
      _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends State<DeliveryTrackingScreen> {
  final SocketService _socketService = SocketService();
  final MapController _mapController = MapController();

  LatLng? _riderLocation;
  String _currentStatus = '';
  final List<LatLng> _routePoints = [];
  Timer? _locationEmitTimer;

  // Default center — Lagos, Nigeria
  static const LatLng _defaultCenter = LatLng(6.5244, 3.3792);

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.status;

    // Join delivery tracking room
    _socketService.joinDeliveryRoom(widget.assignmentId);

    // Listen for location updates
    _socketService.on(
        SocketEvents.deliveryLocationUpdate, _onLocationUpdate);
    _socketService.on(
        SocketEvents.deliveryStatusChange, _onStatusChange);
  }

  void _onLocationUpdate(dynamic data) {
    if (!mounted) return;
    final lat = (data['latitude'] as num?)?.toDouble();
    final lng = (data['longitude'] as num?)?.toDouble();

    if (lat != null && lng != null) {
      final newLocation = LatLng(lat, lng);
      setState(() {
        _riderLocation = newLocation;
        _routePoints.add(newLocation);
      });

      // Animate map to follow rider
      _mapController.move(newLocation, _mapController.camera.zoom);
    }
  }

  void _onStatusChange(dynamic data) {
    if (!mounted) return;
    final status = data['status'] as String?;
    if (status != null) {
      setState(() {
        _currentStatus = status;
      });

      if (status == 'delivered') {
        _showDeliveredDialog();
      }
    }
  }

  void _showDeliveredDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.check_circle, color: AppColors.success, size: 48),
        title: const Text('Delivery Complete!'),
        content: const Text('Your order has been delivered successfully.'),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _socketService.leaveDeliveryRoom(widget.assignmentId);
    _socketService.off(SocketEvents.deliveryLocationUpdate);
    _socketService.off(SocketEvents.deliveryStatusChange);
    _locationEmitTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _riderLocation ?? _deliveryCenter,
              initialZoom: 14.0,
            ),
            children: [
              TileLayer(
                urlTemplate:
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.pharmaconnect.app',
              ),
              MarkerLayer(
                markers: _buildMarkers(),
              ),
              if (_routePoints.length > 1)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 3.0,
                      color: AppColors.primary600,
                    ),
                  ],
                ),
            ],
          ),

          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 12,
            child: CircleAvatar(
              backgroundColor: AppColors.neutralWhite,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.neutral900),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ),

          // Bottom panel
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _buildBottomPanel(),
          ),
        ],
      ),
    );
  }

  LatLng get _deliveryCenter {
    if (widget.deliveryLat != null && widget.deliveryLng != null) {
      return LatLng(widget.deliveryLat!, widget.deliveryLng!);
    }
    return _defaultCenter;
  }

  List<Marker> _buildMarkers() {
    final markers = <Marker>[];

    // Rider marker
    if (_riderLocation != null) {
      markers.add(
        Marker(
          point: _riderLocation!,
          width: 40,
          height: 40,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.primary600,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary600.withValues(alpha: 0.4),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: const Icon(
              Icons.delivery_dining,
              color: Colors.white,
              size: 20,
            ),
          ),
        ),
      );
    }

    // Pickup marker
    if (widget.pickupLat != null && widget.pickupLng != null) {
      markers.add(
        Marker(
          point: LatLng(widget.pickupLat!, widget.pickupLng!),
          width: 36,
          height: 36,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.secondary600,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: const Icon(
              Icons.local_pharmacy,
              color: Colors.white,
              size: 18,
            ),
          ),
        ),
      );
    }

    // Delivery destination marker
    if (widget.deliveryLat != null && widget.deliveryLng != null) {
      markers.add(
        Marker(
          point: LatLng(widget.deliveryLat!, widget.deliveryLng!),
          width: 36,
          height: 36,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.success,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: const Icon(
              Icons.flag,
              color: Colors.white,
              size: 18,
            ),
          ),
        ),
      );
    }

    return markers;
  }

  Widget _buildBottomPanel() {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: BoxDecoration(
        color: AppColors.neutralWhite,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.neutral300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Status indicator
          _buildStatusProgress(),

          const SizedBox(height: 16),

          // Rider info
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.primary50,
                child: const Icon(Icons.person, color: AppColors.primary600),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.riderName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      _statusLabel(_currentStatus),
                      style: TextStyle(
                        color: _statusColor(_currentStatus),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              // Call button
              IconButton(
                onPressed: () {},
                icon: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primary50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.phone,
                      color: AppColors.primary600, size: 20),
                ),
              ),
              // Chat button
              IconButton(
                onPressed: () {},
                icon: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.secondary50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.chat_bubble_outline,
                      color: AppColors.secondary600, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusProgress() {
    final steps = ['accepted', 'picked_up', 'in_transit', 'arrived', 'delivered'];
    final currentIdx = steps.indexOf(_currentStatus);

    return Row(
      children: List.generate(steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          // Connector line
          final stepIdx = i ~/ 2;
          return Expanded(
            child: Container(
              height: 3,
              color: stepIdx < currentIdx
                  ? AppColors.primary600
                  : AppColors.neutral200,
            ),
          );
        }
        // Dot
        final stepIdx = i ~/ 2;
        final isActive = stepIdx <= currentIdx;
        final isCurrent = stepIdx == currentIdx;

        return Container(
          width: isCurrent ? 14 : 10,
          height: isCurrent ? 14 : 10,
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary600 : AppColors.neutral300,
            shape: BoxShape.circle,
            border: isCurrent
                ? Border.all(color: AppColors.primary600, width: 2)
                : null,
          ),
        );
      }),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Waiting for rider';
      case 'accepted':
        return 'Rider accepted';
      case 'picked_up':
        return 'Order picked up';
      case 'in_transit':
        return 'On the way';
      case 'arrived':
        return 'Rider arrived';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'delivered':
        return AppColors.success;
      case 'in_transit':
      case 'arrived':
        return AppColors.primary600;
      default:
        return AppColors.neutral600;
    }
  }
}
