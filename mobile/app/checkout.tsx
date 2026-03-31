import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { orderService, pharmacyService, deliveryService } from '../src/services';
import { apiClient } from '../src/lib/api';

interface CartItem {
  productId: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
}

interface DeliveryProvider {
  id: string;
  name: string;
  fee: number;
  estimatedTime?: string;
  rating?: number;
  distance?: number;
}

export default function CheckoutScreen() {
  const { pharmacyId, items } = useLocalSearchParams<{
    pharmacyId: string;
    items: string;
  }>();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedDeliveryProvider, setSelectedDeliveryProvider] =
    useState<DeliveryProvider | null>(null);
  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (pharmacyId && items) {
      loadCheckoutData();
    }
  }, [pharmacyId, items]);

  const loadCheckoutData = async () => {
    setLoading(true);
    try {
      // Parse items from params
      const parsedItems: CartItem[] = JSON.parse(items!);
      setCartItems(parsedItems);

      // Fetch product details from pharmacy
      const productsRes = await pharmacyService.getPharmacyProducts(pharmacyId!);
      if (productsRes.success) {
        const productList = productsRes.data?.products || productsRes.data || [];
        const productMap: Record<string, Product> = {};
        productList.forEach((p: any) => {
          productMap[p.id] = p;
        });
        setProducts(productMap);
      } else {
        Alert.alert('Error', 'Could not load product details.');
      }

      // Fetch available delivery providers
      // Note: This requires customer location, using dummy coordinates for now
      // In production, you'd use actual device location via expo-location
      const deliveryRes = await deliveryService.getAvailableProviders({
        pharmacyId: pharmacyId!,
        customerLat: 6.5244, // Example Lagos coord
        customerLng: 3.3792,
      });
      if (deliveryRes.success) {
        const providers = deliveryRes.data?.providers || deliveryRes.data || [];
        setDeliveryProviders(providers);
        if (providers.length > 0) {
          setSelectedDeliveryProvider(providers[0]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load checkout data.');
      console.error('Checkout load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const product = products[item.productId];
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const deliveryFee = selectedDeliveryProvider?.fee || 0;
  const subtotal = calculateSubtotal();
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    // Validation
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address.');
      return;
    }

    if (!selectedDeliveryProvider) {
      Alert.alert('Error', 'Please select a delivery provider.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        pharmacyId: pharmacyId!,
        items: cartItems,
        deliveryAddress: {
          lat: 6.5244, // Example Lagos coord
          lng: 3.3792,
          address: deliveryAddress,
        },
        deliveryProviderId: selectedDeliveryProvider.id,
      };

      const res = await orderService.createOrder(orderData);

      if (res.success) {
        setOrderId(res.data?.id || '');
        setSuccess(true);
      } else {
        Alert.alert('Error', res.error?.message || 'Failed to place order.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong.');
      console.error('Order creation error:', error);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <Text style={styles.successCheckmark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successText}>
            Your order has been sent to the pharmacy and is being prepared.
          </Text>

          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>{orderId.slice(0, 12)}</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{cartItems.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₦{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>
                {selectedDeliveryProvider?.name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString()}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryDivider]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>₦{total.toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewOrderBtn}
            onPress={() => {
              router.push({
                pathname: '/order-detail',
                params: { id: orderId },
              });
            }}
          >
            <Text style={styles.viewOrderBtnText}>View Order Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueShoppingBtn}
            onPress={() => router.push('/pharmacies')}
          >
            <Text style={styles.continueShoppingBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.length === 0 ? (
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          ) : (
            <>
              {cartItems.map((item, idx) => {
                const product = products[item.productId];
                if (!product) return null;
                return (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{product.name}</Text>
                      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      ₦{(product.price * item.quantity).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.divider} />
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Subtotal</Text>
                <Text style={styles.summaryLineValue}>
                  ₦{subtotal.toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your delivery address"
            placeholderTextColor="#9CA3AF"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.helperText}>
            Be as specific as possible (street, house number, landmark)
          </Text>
        </View>

        {/* Delivery Provider Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Delivery Provider</Text>
          {deliveryProviders.length === 0 ? (
            <Text style={styles.emptyText}>No delivery providers available.</Text>
          ) : (
            deliveryProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  selectedDeliveryProvider?.id === provider.id &&
                    styles.providerCardSelected,
                ]}
                onPress={() => setSelectedDeliveryProvider(provider)}
              >
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <View style={styles.providerMeta}>
                    <Text style={styles.providerMetaText}>
                      ₦{provider.fee.toLocaleString()}
                    </Text>
                    {provider.estimatedTime && (
                      <Text style={styles.providerMetaText}>
                        {provider.estimatedTime}
                      </Text>
                    )}
                    {provider.rating !== undefined && (
                      <Text style={styles.providerMetaText}>
                        ★ {provider.rating.toFixed(1)}
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedDeliveryProvider?.id === provider.id &&
                      styles.radioButtonSelected,
                  ]}
                >
                  {selectedDeliveryProvider?.id === provider.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₦{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>
              ₦{deliveryFee.toLocaleString()}
            </Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, placing && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={placing || cartItems.length === 0}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderBtnText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Order Summary
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  summaryLineLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryLineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Delivery Address
  addressInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },

  // Delivery Providers
  providerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
  },
  providerCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  providerMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  providerMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#059669',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },

  // Price Breakdown
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  placeOrderBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Success Screen
  successContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  successContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successCheckmark: {
    fontSize: 48,
    color: '#059669',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  orderIdBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1,
  },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  viewOrderBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  viewOrderBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  continueShoppingBtn: {
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  continueShoppingBtnText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '700',
  },
});
