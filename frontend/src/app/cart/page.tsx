'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  pharmacyId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface CartGroup {
  pharmacyId: string;
  pharmacyName: string;
  items: CartItem[];
  subtotal: number;
}

export default function PublicCartPage() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [groupedCart, setGroupedCart] = useState<CartGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    groupCartByPharmacy(cart);
    setLoading(false);
  }, []);

  const groupCartByPharmacy = (items: CartItem[]) => {
    const pharmacies: Record<string, CartGroup> = {};

    items.forEach((item) => {
      if (!pharmacies[item.pharmacyId]) {
        pharmacies[item.pharmacyId] = {
          pharmacyId: item.pharmacyId,
          pharmacyName: `Pharmacy`,
          items: [],
          subtotal: 0,
        };
      }

      pharmacies[item.pharmacyId].items.push(item);
      pharmacies[item.pharmacyId].subtotal += item.price * item.quantity;
    });

    setGroupedCart(Object.values(pharmacies));
  };

  const handleQuantityChange = (productId: string, change: number) => {
    const updatedItems = cartItems
      .map((item) => {
        if (item.productId === productId) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    groupCartByPharmacy(updatedItems);
  };

  const handleRemoveItem = (productId: string) => {
    const updatedItems = cartItems.filter((item) => item.productId !== productId);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
    groupCartByPharmacy(updatedItems);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getEstimatedDeliveryFee = () => {
    return groupedCart.length * 500 + 500;
  };

  // Choose checkout path based on auth state
  const checkoutHref = user ? '/dashboard/customer/checkout' : '/checkout';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        <p className="text-gray-600 mt-1">Review your items and proceed to checkout</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
          <Link
            href="/browse"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Browse Pharmacies
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {groupedCart.map((group) => (
              <div key={group.pharmacyId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-green-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-900">
                  {group.pharmacyName}
                </div>
                <div className="p-6 space-y-4">
                  {group.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 line-clamp-1">{item.productName}</h3>
                        <p className="text-sm text-gray-600">&#8358;{item.price.toLocaleString()} each</p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <button
                          onClick={() => handleQuantityChange(item.productId, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-medium text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 text-gray-600"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right min-w-fit">
                        <p className="font-bold text-gray-900">&#8358;{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-gray-600">Subtotal</span>
                  <span className="font-bold text-gray-900">&#8358;{group.subtotal.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>&#8358;{getTotalPrice().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Est. Delivery Fee</span>
                  <span>&#8358;{getEstimatedDeliveryFee().toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-green-600">
                  &#8358;{(getTotalPrice() + getEstimatedDeliveryFee()).toLocaleString()}
                </span>
              </div>

              <Link
                href={checkoutHref}
                className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Proceed to Checkout
              </Link>

              {!user && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  You can checkout as a guest or{' '}
                  <Link href="/login" className="text-green-600 hover:underline">
                    sign in
                  </Link>{' '}
                  for faster checkout
                </p>
              )}

              <Link
                href="/browse"
                className="block w-full mt-3 text-center py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
