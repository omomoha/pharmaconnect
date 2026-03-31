import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { orderService } from '../src/services';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress?: { address: string };
  deliveryCode?: string;
  riderName?: string;
  riderPhone?: string;
  createdAt: any;
  updatedAt: any;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  preparing: { bg: '#E0E7FF', text: '#3730A3' },
  ready_for_pickup: { bg: '#D1FAE5', text: '#065F46' },
  out_for_delivery: { bg: '#CFFAFE', text: '#155E75' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  refunded: { bg: '#F3E8FF', text: '#6B21A8' },
};

const statusSteps = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrder(id!);
      if (res.success) setOrder(res.data);
    } catch {
      Alert.alert('Error', 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const res = await orderService.cancelOrder(id!);
            if (res.success) {
              Alert.alert('Cancelled', 'Your order has been cancelled.');
              loadOrder();
            } else {
              Alert.alert('Error', res.error?.message || 'Could not cancel order.');
            }
          } catch {
            Alert.alert('Error', 'Something went wrong.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatus = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = statusColors[order.status] || statusColors.pending;
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancellable = ['pending', 'confirmed'].includes(order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {formatStatus(order.status)}
          </Text>
        </View>
      </View>

      {/* Progress Tracker */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <View style={styles.tracker}>
          {statusSteps.map((step, i) => {
            const isComplete = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <View key={step} style={styles.trackerStep}>
                <View
                  style={[
                    styles.trackerDot,
                    isComplete && styles.trackerDotActive,
                    isCurrent && styles.trackerDotCurrent,
                  ]}
                />
                {i < statusSteps.length - 1 && (
                  <View
                    style={[
                      styles.trackerLine,
                      isComplete && i < currentStepIndex && styles.trackerLineActive,
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.trackerLabel,
                    isComplete && styles.trackerLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {formatStatus(step)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Pharmacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pharmacy</Text>
        <Text style={styles.pharmacyName}>{order.pharmacyName}</Text>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              ₦{(item.price * item.quantity).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>₦{(order.subtotal || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery Fee</Text>
          <Text style={styles.totalValue}>₦{(order.deliveryFee || 0).toLocaleString()}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>₦{(order.total || 0).toLocaleString()}</Text>
        </View>
      </View>

      {/* Delivery Info */}
      {order.deliveryAddress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <Text style={styles.detailText}>📍 {order.deliveryAddress.address}</Text>
          {order.riderName && (
            <Text style={styles.detailText}>🏍 Rider: {order.riderName}</Text>
          )}
          {order.riderPhone && (
            <Text style={styles.detailText}>📞 {order.riderPhone}</Text>
          )}
          {order.deliveryCode && (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your Delivery Code</Text>
              <Text style={styles.codeValue}>{order.deliveryCode}</Text>
              <Text style={styles.codeHint}>
                Share this code with the rider to confirm delivery
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <Text style={styles.detailText}>📅 Ordered: {formatDate(order.createdAt)}</Text>
        <Text style={styles.detailText}>🔄 Updated: {formatDate(order.updatedAt)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isCancellable && (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() =>
            router.push(
              `/chat?pharmacyId=${order.pharmacyId}&pharmacyName=${encodeURIComponent(order.pharmacyName)}`
            )
          }
        >
          <Text style={styles.messageBtnText}>💬 Contact Pharmacy</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#6B7280', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#059669', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  orderId: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 13, fontWeight: '600' },
  tracker: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 4 },
  trackerStep: { alignItems: 'center', flex: 1 },
  trackerDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB', marginBottom: 4 },
  trackerDotActive: { backgroundColor: '#059669' },
  trackerDotCurrent: { backgroundColor: '#059669', borderWidth: 3, borderColor: '#D1FAE5', width: 20, height: 20, borderRadius: 10 },
  trackerLine: { position: 'absolute', top: 7, left: '50%', right: '-50%', height: 2, backgroundColor: '#E5E7EB' },
  trackerLineActive: { backgroundColor: '#059669' },
  trackerLabel: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  trackerLabelActive: { color: '#059669', fontWeight: '600' },
  section: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 8 },
  pharmacyName: { fontSize: 16, color: '#111827' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemInfo: { flexDirection: 'row', flex: 1, gap: 8 },
  itemName: { fontSize: 14, color: '#111827', flex: 1 },
  itemQty: { fontSize: 14, color: '#6B7280' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#111827' },
  totalsSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 14, color: '#111827' },
  grandTotal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: '#059669' },
  detailText: { fontSize: 14, color: '#4B5563', marginBottom: 6 },
  codeBox: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginTop: 12, alignItems: 'center' },
  codeLabel: { fontSize: 12, color: '#92400E', marginBottom: 4 },
  codeValue: { fontSize: 28, fontWeight: 'bold', color: '#92400E', letterSpacing: 4 },
  codeHint: { fontSize: 11, color: '#B45309', marginTop: 4, textAlign: 'center' },
  actions: { gap: 12, marginTop: 8 },
  cancelBtn: { borderWidth: 2, borderColor: '#FCA5A5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#DC2626', fontSize: 16, fontWeight: '600' },
  messageBtn: { borderWidth: 2, borderColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  messageBtnText: { color: '#059669', fontSize: 16, fontWeight: '600' },
});
