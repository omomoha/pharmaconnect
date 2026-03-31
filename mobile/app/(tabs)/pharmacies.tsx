import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { pharmacyService } from '../../src/services';
import { useLocation } from '../../src/hooks';

interface Pharmacy {
  id: string;
  name: string;
  location: string;
  distance: number;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: string;
  description: string;
}

const SORT_OPTIONS = [
  { key: 'distance', label: 'Nearest' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'delivery', label: 'Fastest' },
] as const;

export default function PharmaciesTab() {
  const { latitude, longitude, loading: geoLoading } = useLocation();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'delivery'>('distance');

  const fetchPharmacies = async () => {
    if (!latitude || !longitude) return;

    try {
      const res = await pharmacyService.getNearbyPharmacies({
        lat: latitude,
        lng: longitude,
        radius: 50,
      });

      if (res.success && res.data) {
        setPharmacies(
          res.data.map((p: any) => ({
            id: p.id,
            name: p.businessName || p.name || 'Pharmacy',
            location: p.address || '',
            distance: p.distance ?? 0,
            rating: p.rating ?? 4.5,
            reviewCount: p.reviewCount ?? 0,
            deliveryTime: p.deliveryTime || '30-60 min',
            deliveryFee: p.deliveryFee ? `₦${p.deliveryFee}` : '₦300',
            description: p.description || 'Quality pharmacy products',
          }))
        );
      }
    } catch {
      // Keep empty list
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!geoLoading) {
      fetchPharmacies();
    }
  }, [geoLoading, latitude, longitude]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPharmacies();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let result = [...pharmacies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'rating') return b.rating - a.rating;
      return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
    });

    return result;
  }, [pharmacies, searchQuery, sortBy]);

  const renderPharmacy = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/pharmacy-detail', params: { id: item.id } })}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardLocation}>{item.location}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
        </View>
      </View>

      <View style={styles.cardRating}>
        <Text style={styles.ratingStars}>
          {'★'.repeat(Math.floor(item.rating))}
          {'☆'.repeat(5 - Math.floor(item.rating))}
        </Text>
        <Text style={styles.ratingText}>
          {item.rating} ({item.reviewCount})
        </Text>
      </View>

      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.infoChip}>
          <Text style={styles.infoLabel}>Delivery</Text>
          <Text style={styles.infoValue}>{item.deliveryTime}</Text>
        </View>
        <View style={styles.infoChip}>
          <Text style={styles.infoLabel}>Fee</Text>
          <Text style={styles.infoValue}>{item.deliveryFee}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewButton} onPress={() => router.push({ pathname: '/pharmacy-detail', params: { id: item.id } })}>
        <Text style={styles.viewButtonText}>View Pharmacy</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pharmacies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Sort Pills */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortPill, sortBy === opt.key && styles.sortPillActive]}
            onPress={() => setSortBy(opt.key)}
          >
            <Text
              style={[
                styles.sortPillText,
                sortBy === opt.key && styles.sortPillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {loading ? 'Loading...' : `${filtered.length} pharmacies found`}
      </Text>

      {/* List */}
      {loading || geoLoading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPharmacy}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No pharmacies found</Text>
              <Text style={styles.emptySubtext}>Try a different search or location</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  searchSection: { padding: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  sortPillActive: { backgroundColor: '#059669' },
  sortPillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  sortPillTextActive: { color: '#fff' },
  resultCount: { paddingHorizontal: 16, fontSize: 13, color: '#6B7280', marginBottom: 8 },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cardLocation: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  distanceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  distanceText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ratingStars: { color: '#FBBF24', fontSize: 14 },
  ratingText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  cardDescription: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoChip: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10 },
  infoLabel: { fontSize: 11, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  viewButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});
