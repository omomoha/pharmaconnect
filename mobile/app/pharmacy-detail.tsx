import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { pharmacyService } from '../src/services';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  inStock: boolean;
  requiresPrescription?: boolean;
}

interface PharmacyDetail {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  operatingHours?: { open: string; close: string; days: string };
  deliveryTime?: string;
  deliveryFee?: number;
  approvalStatus?: string;
}

export default function PharmacyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pharmacy, setPharmacy] = useState<PharmacyDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id) loadPharmacy();
  }, [id]);

  const loadPharmacy = async () => {
    setLoading(true);
    try {
      const [pharmaRes, productsRes] = await Promise.all([
        pharmacyService.getPharmacy(id!),
        pharmacyService.getPharmacyProducts(id!),
      ]);
      if (pharmaRes.success) setPharmacy(pharmaRes.data);
      if (productsRes.success) setProducts(productsRes.data?.products || productsRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load pharmacy details.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string) => {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const count = (prev[productId] || 0) - 1;
      if (count <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: count };
    });
  };

  const cartTotal = products.reduce(
    (sum, p) => sum + (cart[p.id] || 0) * p.price,
    0
  );
  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!pharmacy) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Pharmacy not found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
          {pharmacy.description && (
            <Text style={styles.description}>{pharmacy.description}</Text>
          )}

          <View style={styles.infoRow}>
            {pharmacy.rating !== undefined && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>
                  ★ {pharmacy.rating.toFixed(1)} ({pharmacy.reviewCount || 0})
                </Text>
              </View>
            )}
            {pharmacy.deliveryTime && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>🚚 {pharmacy.deliveryTime}</Text>
              </View>
            )}
            {pharmacy.deliveryFee !== undefined && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>
                  ₦{pharmacy.deliveryFee.toLocaleString()} delivery
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact & Hours */}
        <View style={styles.section}>
          {pharmacy.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>
                {pharmacy.address}
                {pharmacy.city ? `, ${pharmacy.city}` : ''}
                {pharmacy.state ? `, ${pharmacy.state}` : ''}
              </Text>
            </View>
          )}
          {pharmacy.phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📞</Text>
              <Text style={styles.detailText}>{pharmacy.phone}</Text>
            </View>
          )}
          {pharmacy.operatingHours && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🕐</Text>
              <Text style={styles.detailText}>
                {pharmacy.operatingHours.days}: {pharmacy.operatingHours.open} - {pharmacy.operatingHours.close}
              </Text>
            </View>
          )}
        </View>

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Products ({products.length})
          </Text>
          {products.length === 0 ? (
            <Text style={styles.emptyText}>No products available yet.</Text>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {product.description && (
                    <Text style={styles.productDesc} numberOfLines={2}>
                      {product.description}
                    </Text>
                  )}
                  <View style={styles.productMeta}>
                    <Text style={styles.productPrice}>
                      ₦{product.price.toLocaleString()}
                    </Text>
                    {product.category && (
                      <Text style={styles.productCategory}>{product.category}</Text>
                    )}
                    {!product.inStock && (
                      <Text style={styles.outOfStock}>Out of Stock</Text>
                    )}
                  </View>
                </View>
                {product.inStock && !product.requiresPrescription && (
                  <View style={styles.cartControls}>
                    {cart[product.id] ? (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => removeFromCart(product.id)}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{cart[product.id]}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => addToCart(product.id)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addToCart(product.id)}
                      >
                        <Text style={styles.addBtnText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Message Pharmacy Button */}
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => router.push(`/chat?pharmacyId=${id}&pharmacyName=${encodeURIComponent(pharmacy.name)}`)}
        >
          <Text style={styles.messageBtnText}>💬 Message Pharmacy</Text>
        </TouchableOpacity>

        <View style={{ height: cartItemCount > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCount}>
              {cartItemCount} item{cartItemCount > 1 ? 's' : ''}
            </Text>
            <Text style={styles.cartTotal}>₦{cartTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => {
              const items = Object.entries(cart).map(([productId, quantity]) => ({
                productId,
                quantity,
              }));
              router.push({
                pathname: '/checkout',
                params: { pharmacyId: id, items: JSON.stringify(items) },
              });
            }}
          >
            <Text style={styles.checkoutBtnText}>Checkout →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#6B7280', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#059669', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  header: { marginBottom: 20 },
  pharmacyName: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  infoBadgeText: { fontSize: 13, color: '#374151' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  detailIcon: { fontSize: 16, marginRight: 8, marginTop: 1 },
  detailText: { fontSize: 14, color: '#4B5563', flex: 1 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  productDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#059669' },
  productCategory: { fontSize: 12, color: '#9CA3AF', backgroundColor: '#F9FAFB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  outOfStock: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  cartControls: { alignItems: 'center' },
  addBtn: { backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#059669' },
  qtyText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  messageBtn: { borderWidth: 2, borderColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  messageBtnText: { color: '#059669', fontSize: 16, fontWeight: '600' },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
  },
  cartCount: { color: '#D1FAE5', fontSize: 13 },
  cartTotal: { color: '#fff', fontSize: 18, fontWeight: '700' },
  checkoutBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  checkoutBtnText: { color: '#059669', fontWeight: '700', fontSize: 15 },
});
