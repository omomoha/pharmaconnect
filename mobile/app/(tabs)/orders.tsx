import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { orderService } from '../../src/services';

interface Order {
  id: string;
  status: string;
  total: number;
  pharmacyName: string;
  itemCount: number;
  createdAt: string;
  deliveryAddress?: string;
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Active' },
  { key: 'delivered', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#B45309' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  preparing: { bg: '#DBEAFE', text: '#1D4ED8' },
  ready_for_pickup: { bg: '#E0E7FF', text: '#4338CA' },
  out_for_delivery: { bg: '#ECFDF5', text: '#059669' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C' },
};

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchOrders = async () => {
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : undefined;
      const res = await orderService.getOrders(params);
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch {
      // Keep empty
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusStyle = (status: string) =>
    STATUS_COLORS[status] || STATUS_COLORS.pending;

  const formatStatus = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const renderOrder = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/order-detail', params: { id: item.id } })}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
            <Text style={styles.pharmacy}>{item.pharmacyName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {formatStatus(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardMid}>
          <Text style={styles.detail}>
            {item.itemCount || 0} item{(item.itemCount || 0) !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.detail}>{item.createdAt}</Text>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.total}>₦{item.total?.toLocaleString() || '0'}</Text>
          {(item.status === 'pending' || item.status === 'confirmed') && (
            <TouchableOpacity style={styles.trackButton} onPress={() => router.push({ pathname: '/order-detail', params: { id: item.id } })}>
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status tabs */}
      <View style={styles.tabs}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item: tab }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders list */}
      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'all'
                  ? 'Start by browsing pharmacies nearby'
                  : `No ${activeTab} orders`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabs: { paddingVertical: 12 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  tabActive: { backgroundColor: '#059669' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  pharmacy: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detail: { fontSize: 13, color: '#6B7280' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  total: { fontSize: 18, fontWeight: '700', color: '#111827' },
  trackButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});
