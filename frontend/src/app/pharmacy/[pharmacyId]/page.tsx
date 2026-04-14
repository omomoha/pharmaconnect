'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  rating: number;
  totalReviews: number;
  approvalStatus: string;
  isActive: boolean;
  operatingHours?: Record<string, { open: string; close: string; closed: boolean }>;
}

interface PharmacyProduct {
  id: string;
  pharmacyId: string;
  drugCatalogItemId: string;
  sku: string;
  quantity: number;
  price: number;
  discount?: number;
  expiryDate: string;
  batchNumber: string;
  isActive: boolean;
  // Populated from drug catalog if available
  drugName?: string;
  description?: string;
  category?: string;
  strength?: string;
  form?: string;
}

interface CartItem {
  pharmacyId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export default function PharmacyDetailPage() {
  const params = useParams();
  const pharmacyId = params?.pharmacyId as string;

  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('products');
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [cartCount, setCartCount] = useState(0);

  // Load initial cart count
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    } catch {
      setCartCount(0);
    }
  }, []);

  const fetchPharmacyData = useCallback(async () => {
    if (!pharmacyId) return;
    setLoading(true);
    setError(null);
    try {
      const [pharmacyRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/pharmacies/${pharmacyId}`),
        fetch(`${API_URL}/pharmacies/${pharmacyId}/products`),
      ]);

      const pharmacyResult = await pharmacyRes.json();
      const productsResult = await productsRes.json();

      if (pharmacyResult.success && pharmacyResult.data?.pharmacy) {
        setPharmacy(pharmacyResult.data.pharmacy);
      } else {
        setError('Pharmacy not found.');
        return;
      }

      if (productsResult.success && productsResult.data?.products) {
        setProducts(productsResult.data.products);
      }
    } catch {
      setError('Unable to load pharmacy details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pharmacyId]);

  useEffect(() => {
    fetchPharmacyData();
  }, [fetchPharmacyData]);

  const tabs = [
    { id: 'products', label: 'Products', count: products.length },
    { id: 'about', label: 'About' },
  ];

  const handleAddToCart = (product: PharmacyProduct) => {
    if (!pharmacy) return;
    const quantity = productQuantities[product.id] || 1;
    const displayName = product.drugName || product.sku || `Product ${product.id.slice(0, 6)}`;

    const cartItem: CartItem = {
      pharmacyId: pharmacy.id,
      productId: product.id,
      productName: displayName,
      quantity,
      price: product.price,
    };

    const existingCart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = existingCart.find((item) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    setCartCount(existingCart.length);
    setProductQuantities({ ...productQuantities, [product.id]: 1 });

    toast.success(`${displayName} added to cart!`);
  };

  const handleQuantityChange = (productId: string, change: number) => {
    const current = productQuantities[productId] || 1;
    const newQuantity = Math.max(1, current + change);
    setProductQuantities({ ...productQuantities, [productId]: newQuantity });
  };

  const getCartTotal = () => {
    try {
      const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
      return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    } catch {
      return 0;
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  );

  const getProductEmoji = (product: PharmacyProduct): string => {
    const form = product.form?.toLowerCase() || '';
    if (form.includes('tablet') || form.includes('capsule')) return '💊';
    if (form.includes('liquid') || form.includes('syrup')) return '🧪';
    if (form.includes('cream') || form.includes('ointment')) return '🧴';
    if (form.includes('injection')) return '💉';
    // Fallback: deterministic from SKU
    const emojis = ['💊', '🧪', '🧴', '🩹', '🌡️', '📊'];
    const code = (product.sku || product.id).charCodeAt(0) || 0;
    return emojis[code % emojis.length];
  };

  const formatOperatingHours = (hours: Record<string, { open: string; close: string; closed: boolean }>) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map((day) => {
      const h = hours[day];
      if (!h) return { day, display: 'Not available' };
      return {
        day,
        display: h.closed ? 'Closed' : `${h.open} - ${h.close}`,
      };
    });
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading pharmacy details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Error state
  if (error || !pharmacy) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{error || 'Pharmacy not found'}</h2>
            <div className="space-y-2">
              <Button variant="primary" size="sm" onClick={fetchPharmacyData}>Retry</Button>
              <Link href="/browse" className="block">
                <Button variant="ghost" size="sm">Back to Browse</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Pharmacy Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Pharmacy Icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-5xl">💊</span>
              </div>
            </div>

            {/* Pharmacy Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{pharmacy.name}</h1>
                  {pharmacy.approvalStatus === 'approved' && (
                    <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                      <span>✓</span>
                      <span>Verified Pharmacy</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  {renderStars(pharmacy.rating || 0)}
                  <span className="font-bold text-gray-900">{pharmacy.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-600">({pharmacy.totalReviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📍</span>
                  <span>{pharmacy.address}</span>
                </div>
              </div>
            </div>

            {/* Floating Cart */}
            {cartCount > 0 && (
              <div className="bg-primary-50 border-l-4 border-primary-600 p-4 rounded-lg self-center md:self-auto">
                <p className="text-sm text-gray-600 mb-2">Your Cart</p>
                <div className="font-bold text-lg text-primary-600 mb-3">
                  {cartCount} items - ₦{getCartTotal().toLocaleString()}
                </div>
                <Link href="/cart">
                  <Button size="sm" variant="primary" className="w-full">View Cart</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="container-custom">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </section>

      {/* Tab Content */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Products ({products.length})
              </h2>
              {products.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => {
                    const displayName = product.drugName || product.sku || `Product ${product.id.slice(0, 6)}`;
                    const displayDesc = product.description || (product.strength ? `${product.form || 'Medicine'} - ${product.strength}` : product.form || '');
                    const discountedPrice = product.discount
                      ? product.price * (1 - product.discount / 100)
                      : product.price;

                    return (
                      <Card key={product.id}>
                        <CardContent className="p-0">
                          <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-b border-gray-200">
                            <span className="text-5xl">{getProductEmoji(product)}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <h3 className="font-bold text-gray-900 line-clamp-2">{displayName}</h3>
                              {displayDesc && (
                                <p className="text-sm text-gray-600 mt-1">{displayDesc}</p>
                              )}
                              {product.quantity <= 5 && product.quantity > 0 && (
                                <p className="text-xs text-orange-600 mt-1">Only {product.quantity} left in stock</p>
                              )}
                              {product.quantity === 0 && (
                                <p className="text-xs text-red-600 mt-1">Out of stock</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary-600">
                                ₦{discountedPrice.toLocaleString()}
                              </span>
                              {product.discount ? (
                                <span className="text-sm text-gray-400 line-through">
                                  ₦{product.price.toLocaleString()}
                                </span>
                              ) : null}
                              {product.discount ? (
                                <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                                  -{product.discount}%
                                </span>
                              ) : null}
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2 bg-gray-50 w-fit rounded-lg p-1">
                              <button
                                onClick={() => handleQuantityChange(product.id, -1)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                              >
                                −
                              </button>
                              <span className="w-6 text-center font-medium">
                                {productQuantities[product.id] || 1}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(product.id, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                              >
                                +
                              </button>
                            </div>

                            <Button
                              variant="primary"
                              className="w-full"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.quantity === 0}
                            >
                              {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-gray-600">This pharmacy hasn&apos;t listed any products yet.</p>
                  <Link href="/browse">
                    <Button variant="outline" size="sm">Browse Other Pharmacies</Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About {pharmacy.name}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Operating Hours */}
                {pharmacy.operatingHours && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">Operating Hours</h3>
                    <div className="space-y-1.5">
                      {formatOperatingHours(pharmacy.operatingHours).map(({ day, display }) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize text-gray-600">{day}</span>
                          <span className={display === 'Closed' ? 'text-red-500' : 'text-gray-900'}>
                            {display}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Address</h3>
                    <p className="text-gray-600">{pharmacy.address}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Contact</h3>
                    <div className="space-y-1 text-gray-600">
                      {pharmacy.phoneNumber && <p>Phone: {pharmacy.phoneNumber}</p>}
                      {pharmacy.email && <p>Email: {pharmacy.email}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Why Choose Us */}
              <div className="bg-primary-50 p-6 rounded-lg space-y-4">
                <h3 className="font-bold text-gray-900">Why Choose Us?</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 font-bold">✓</span>
                    <span>Licensed and verified pharmacy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 font-bold">✓</span>
                    <span>Authentic medications from certified suppliers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 font-bold">✓</span>
                    <span>Fast and reliable delivery service</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary-600 font-bold">✓</span>
                    <span>Professional customer support</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
