'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface CartItem {
  pharmacyId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// Dummy pharmacy data
const pharmacyData = {
  id: '1',
  name: 'HealthCare Plus Pharmacy',
  location: 'Lekki, Lagos',
  rating: 4.8,
  reviews: 342,
  verified: true,
  description: 'Your trusted healthcare partner for over 15 years. We provide quality medications and health products delivered to your doorstep.',
  operatingHours: '9:00 AM - 9:00 PM',
  address: '123 Lekki Expressway, Lekki, Lagos',
  phone: '+234 (0)705 1234 567',
  email: 'hello@healthcarepluspharmacy.com',
  image: '💊',
};

const dummyProducts: Product[] = [
  {
    id: 'p1',
    name: 'Paracetamol 500mg',
    price: 500,
    description: 'Relief for fever and pain',
    image: '💊',
  },
  {
    id: 'p2',
    name: 'Vitamin C 1000mg',
    price: 2500,
    description: 'Immune system booster',
    image: '🟡',
  },
  {
    id: 'p3',
    name: 'Cough Syrup',
    price: 1800,
    description: 'Effective cough relief',
    image: '🧪',
  },
  {
    id: 'p4',
    name: 'Antacid Tablets',
    price: 1200,
    description: 'Stomach acid relief',
    image: '💊',
  },
  {
    id: 'p5',
    name: 'First Aid Kit',
    price: 5500,
    description: 'Complete home first aid kit',
    image: '🩹',
  },
  {
    id: 'p6',
    name: 'Digital Thermometer',
    price: 3500,
    description: 'Fast and accurate temperature reading',
    image: '🌡️',
  },
  {
    id: 'p7',
    name: 'Hand Sanitizer 500ml',
    price: 800,
    description: 'Kills 99.9% germs',
    image: '🧴',
  },
  {
    id: 'p8',
    name: 'Blood Pressure Monitor',
    price: 8500,
    description: 'Digital BP measurement device',
    image: '📊',
  },
];

const dummyReviews: Review[] = [
  {
    id: 'r1',
    customerName: 'John Okafor',
    rating: 5,
    comment: 'Excellent service and fast delivery. Highly recommended!',
    date: '2026-03-20',
  },
  {
    id: 'r2',
    customerName: 'Chioma Adeyemi',
    rating: 4,
    comment: 'Great pharmacy with quality products. Delivery was quick.',
    date: '2026-03-18',
  },
  {
    id: 'r3',
    customerName: 'Ahmed Hassan',
    rating: 5,
    comment: 'Outstanding customer service. Very professional.',
    date: '2026-03-15',
  },
  {
    id: 'r4',
    customerName: 'Grace Okoro',
    rating: 4,
    comment: 'Good selection of products. Prices are reasonable.',
    date: '2026-03-12',
  },
  {
    id: 'r5',
    customerName: 'Tunde Balogun',
    rating: 5,
    comment: 'Always my first choice for medications. Never disappointed.',
    date: '2026-03-10',
  },
];

export default function PharmacyDetailPage({
  params: _params,
}: {
  params: { pharmacyId: string };
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [productQuantities, setProductQuantities] = useState<
    Record<string, number>
  >({});
  const [cartCount, setCartCount] = useState(0);

  const tabs = [
    { id: 'products', label: 'Products', count: dummyProducts.length },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews', count: dummyReviews.length },
  ];

  const handleAddToCart = (product: Product) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }

    const quantity = productQuantities[product.id] || 1;
    const cart: CartItem = {
      pharmacyId: pharmacyData.id,
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
    };

    // Store in localStorage (in real app, would be in state management)
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = existingCart.find(
      (item: CartItem) => item.productId === product.id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      existingCart.push(cart);
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    setCartCount(existingCart.length);
    setProductQuantities({ ...productQuantities, [product.id]: 1 });

    toast.success(`${product.name} added to cart!`);
  };

  const handleQuantityChange = (productId: string, change: number) => {
    const current = productQuantities[productId] || 1;
    const newQuantity = Math.max(1, current + change);
    setProductQuantities({
      ...productQuantities,
      [productId]: newQuantity,
    });
  };

  const getCartTotal = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce((sum: number, item: CartItem) => {
      return sum + item.price * item.quantity;
    }, 0);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar />

      {/* Pharmacy Header */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Pharmacy Icon/Image */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                <span className="text-5xl">{pharmacyData.image}</span>
              </div>
            </div>

            {/* Pharmacy Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {pharmacyData.name}
                  </h1>
                  {pharmacyData.verified && (
                    <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                      <span>✓</span>
                      <span>Verified Pharmacy</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  {renderStars(pharmacyData.rating)}
                  <span className="font-bold text-gray-900">
                    {pharmacyData.rating}
                  </span>
                  <span className="text-gray-600">
                    ({pharmacyData.reviews} reviews)
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📍</span>
                  <span>{pharmacyData.location}</span>
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
                <Link href="/customer/cart">
                  <Button size="sm" variant="primary" className="w-full">
                    View Cart
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="bg-white border-b border-gray-200 sticky top-40 z-30">
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
                Featured Products
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dummyProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-b border-gray-200">
                        <span className="text-5xl">{product.image}</span>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-gray-900 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {product.description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-2xl font-bold text-primary-600">
                          ₦{product.price.toLocaleString()}
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

                        {/* Add to Cart Button */}
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About {pharmacyData.name}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {pharmacyData.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Operating Hours */}
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900">Operating Hours</h3>
                  <p className="text-gray-600">{pharmacyData.operatingHours}</p>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Address</h3>
                    <p className="text-gray-600">{pharmacyData.address}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Contact</h3>
                    <div className="space-y-1 text-gray-600">
                      <p>Phone: {pharmacyData.phone}</p>
                      <p>Email: {pharmacyData.email}</p>
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

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Customer Reviews
                </h2>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">
                    {pharmacyData.rating}
                  </div>
                  <div className="flex justify-center gap-1">
                    {renderStars(pharmacyData.rating)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {pharmacyData.reviews} reviews
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {dummyReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="space-y-3">
                      {/* Review Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {review.customerName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>{renderStars(review.rating)}</div>
                      </div>

                      {/* Review Comment */}
                      <p className="text-gray-600">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
