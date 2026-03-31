import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { pharmacyService, orderService } from '../../src/services';
import { useLocation } from '../../src/hooks';
import { apiClient } from '../../src/lib/api';

interface PharmacyItem {
  id: string;
  name: string;
  distance: string;
  rating: number;
  deliveryTime: string;
}

interface OrderItem {
  id: string;
  status: string;
  total: number;
  pharmacyName: string;
  createdAt: string;
}

export default function HomeTab() {
  const { profile } = useAuth();
  const { latitude, longitude, loading: geoLoading, isUsingDefaults } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role-specific state
  const [pharmacyInfo, setPharmacyInfo] = useState<any>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<any>(null);
  const [adminDashboard, setAdminDashboard] = useState<any>(null);
  const [loadingRoleData, setLoadingRoleData] = useState(true);

  const userRole = profile?.role;

  const fetchPharmacyData = async () => {
    try {
      const [infoRes, ordersRes] = await Promise.all([
        apiClient.get('/pharmacies/my-pharmacy'),
        orderService.getOrders({ limit: 5 }),
      ]);
      if (infoRes.success && infoRes.data) {
        setPharmacyInfo(infoRes.data);
      }
      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    }
    setLoadingRoleData(false);
  };

  const fetchDeliveryData = async () => {
    try {
      const res = await apiClient.get('/delivery/providers/my-provider');
      if (res.success && res.data) {
        setDeliveryInfo(res.data);
      }
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    }
    setLoadingRoleData(false);
  };

  const fetchAdminData = async () => {
    try {
      const res = await apiClient.get('/admin/dashboard');
      if (res.success && res.data) {
        setAdminDashboard(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
    setLoadingRoleData(false);
  };

  const fetchCustomerData = async () => {
    // Fetch nearby pharmacies
    if (latitude && longitude) {
      try {
        const res = await pharmacyService.getNearbyPharmacies({
          lat: latitude,
          lng: longitude,
          radius: 10,
        });
        if (res.success && res.data) {
          setPharmacies(
            res.data.slice(0, 4).map((p: any) => ({
              id: p.id,
              name: p.businessName || p.name || 'Pharmacy',
              distance: p.distance ? `${p.distance.toFixed(1)} km` : 'Nearby',
              rating: p.rating ?? 4.5,
              deliveryTime: p.deliveryTime || '30-60 min',
            }))
          );
        }
      } catch {
        // Fallback sample data
        setPharmacies([
          { id: '1', name: 'HealthPlus Pharmacy', distance: '0.5 km', rating: 4.8, deliveryTime: '30-45 min' },
          { id: '2', name: 'MediCare Pharmacy', distance: '1.2 km', rating: 4.6, deliveryTime: '45-60 min' },
        ]);
      }
      setLoadingPharmacies(false);
    }

    // Fetch recent orders
    try {
      const res = await orderService.getOrders({ limit: 3 });
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch {
      // No fallback needed
    }
    setLoadingOrders(false);
  };

  const fetchData = async () => {
    if (userRole === 'pharmacy' || userRole === 'pharmacy_admin') {
      await fetchPharmacyData();
    } else if (userRole === 'delivery_provider' || userRole === 'delivery_admin') {
      await fetchDeliveryData();
    } else if (userRole === 'platform_admin' || userRole === 'admin' || userRole === 'support_admin') {
      await fetchAdminData();
    } else {
      // Default customer behavior
      await fetchCustomerData();
    }
  };

  useEffect(() => {
    if (userRole && (userRole === 'pharmacy' || userRole === 'pharmacy_admin' || userRole === 'delivery_provider' || userRole === 'delivery_admin' || userRole === 'platform_admin' || userRole === 'admin' || userRole === 'support_admin')) {
      fetchData();
    } else if (!geoLoading) {
      fetchData();
    }
  }, [userRole, geoLoading, latitude, longitude]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Pharmacy Dashboard
  if (userRole === 'pharmacy' || userRole === 'pharmacy_admin') {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            Welcome, {profile?.name || 'Pharmacy'}!
          </Text>
          <Text style={styles.subGreeting}>{pharmacyInfo?.businessName || 'Manage your pharmacy'}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orders.filter((o) => o.status === 'pending').length || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pharmacyInfo?.productCount || 0}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orders.length || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/manage-products')}>
              <Text style={styles.actionButtonText}>Manage Products</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.actionButtonText}>View Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingRoleData ? (
            <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
          ) : orders.length > 0 ? (
            orders.slice(0, 5).map((order) => (
              <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push({ pathname: '/order-detail', params: { id: order.id } })}>
                <View>
                  <Text style={styles.orderPharmacy}>{order.pharmacyName}</Text>
                  <Text style={styles.orderDate}>{order.createdAt}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                  <Text style={styles.orderTotal}>₦{order.total?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No orders yet</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // Delivery Provider Dashboard
  if (userRole === 'delivery_provider' || userRole === 'delivery_admin') {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            Welcome, {profile?.name || 'Driver'}!
          </Text>
          <Text style={styles.subGreeting}>{deliveryInfo?.businessName || 'Manage your deliveries'}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{deliveryInfo?.activeDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{deliveryInfo?.completedToday || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₦{deliveryInfo?.todayEarnings?.toLocaleString() || 0}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/active-deliveries')}>
              <Text style={styles.actionButtonText}>Active Deliveries</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/delivery-history')}>
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadingRoleData && (
          <View style={styles.section}>
            <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // Admin Dashboard
  if (userRole === 'platform_admin' || userRole === 'admin' || userRole === 'support_admin') {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            Admin Dashboard
          </Text>
          <Text style={styles.subGreeting}>Manage platform operations</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{adminDashboard?.pendingApprovals || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{adminDashboard?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{adminDashboard?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>

        {/* Alerts */}
        {adminDashboard?.flaggedItems > 0 && (
          <View style={[styles.section, styles.alertBox]}>
            <Text style={styles.alertTitle}>
              {adminDashboard.flaggedItems} flagged item(s) need review
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/admin/approvals')}>
              <Text style={styles.actionButtonText}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/admin/flagged')}>
              <Text style={styles.actionButtonText}>Flagged</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadingRoleData && (
          <View style={styles.section}>
            <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // Default Customer Dashboard
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
    >
      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>
          Welcome back, {profile?.name || 'there'}!
        </Text>
        <Text style={styles.subGreeting}>Find and order medications below</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications, pharmacies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length || 0}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pharmacies.length}</Text>
          <Text style={styles.statLabel}>Nearby</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Nearby Pharmacies */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/pharmacies')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {isUsingDefaults && (
          <Text style={styles.locationNote}>
            Showing pharmacies near Lagos (default). Enable location for personalized results.
          </Text>
        )}

        {loadingPharmacies || geoLoading ? (
          <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
        ) : pharmacies.length > 0 ? (
          pharmacies.map((pharmacy) => (
            <TouchableOpacity key={pharmacy.id} style={styles.pharmacyCard} onPress={() => router.push({ pathname: '/pharmacy-detail', params: { id: pharmacy.id } })}>
              <View style={styles.pharmacyInfo}>
                <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                <Text style={styles.pharmacyDistance}>{pharmacy.distance} away</Text>
              </View>
              <View style={styles.pharmacyMeta}>
                <Text style={styles.rating}>★ {pharmacy.rating}</Text>
                <Text style={styles.deliveryTime}>{pharmacy.deliveryTime}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No nearby pharmacies found</Text>
        )}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loadingOrders ? (
          <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 20 }} />
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push({ pathname: '/order-detail', params: { id: order.id } })}>
              <View>
                <Text style={styles.orderPharmacy}>{order.pharmacyName}</Text>
                <Text style={styles.orderDate}>{order.createdAt}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderStatus}>{order.status}</Text>
                <Text style={styles.orderTotal}>₦{order.total?.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/pharmacies')}
            >
              <Text style={styles.browseButtonText}>Browse Pharmacies</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  welcomeSection: { padding: 20, paddingBottom: 0 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subGreeting: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  searchContainer: { padding: 20, paddingTop: 16 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#059669' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  seeAll: { color: '#059669', fontSize: 14, fontWeight: '600' },
  locationNote: {
    fontSize: 12,
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  pharmacyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pharmacyInfo: { flex: 1 },
  pharmacyName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  pharmacyDistance: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  pharmacyMeta: { alignItems: 'flex-end' },
  rating: { fontSize: 14, fontWeight: '600', color: '#111827' },
  deliveryTime: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderPharmacy: { fontSize: 15, fontWeight: '600', color: '#111827' },
  orderDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderTotal: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  browseButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  browseButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  quickActionsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  alertBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B45309',
  },
});
