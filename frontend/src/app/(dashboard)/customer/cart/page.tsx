'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

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

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [groupedCart, setGroupedCart] = useState<CartGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    groupCartByPharmacy(cart);
    setLoading(false);
  }, []);

  const groupCartByPharmacy = (items: CartItem[]) => {
    const pharmacies: Record<string, CartGroup> = {};

    items.forEach((item) => {
      if (!pharmacies[item.pharmacyId]) {
        // Get pharmacy name from dummy data
        const pharmacyNames: Record<string, string> = {
          '1': 'HealthCare Plus Pharmacy',
          '2': 'MediCare Solutions',
          '3': 'WellnessHub Pharmacy',
        };

        pharmacies[item.pharmacyId] = {
          pharmacyId: item.pharmacyId,
          pharmacyName: pharmacyNames[item.pharmacyId] || 'Pharmacy',
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
    toast.success('Item removed from cart');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getEstimatedDeliveryFee = () => {
    // Estimate: ₦500 per pharmacy + ₦100 per km (assuming 5km average)
    return groupedCart.length * 500 + 500;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Cart"
        description="Review your items and proceed to checkout"
      />

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start shopping to add items to your cart
            </p>
            <Link href="/browse">
              <Button variant="primary" size="lg">
                Browse Pharmacies
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {groupedCart.map((group) => (
              <Card key={group.pharmacyId}>
                {/* Pharmacy Header */}
                <div className="bg-primary-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-900">
                  {group.pharmacyName}
                </div>

                {/* Items List */}
                <CardContent className="space-y-4">
                  {group.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 line-clamp-1">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ₦{item.price.toLocaleString()} each
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        <button
                          onClick={() =>
                            handleQuantityChange(item.productId, -1)
                          }
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-600"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(item.productId, 1)
                          }
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-600"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-fit">
                        <p className="font-bold text-gray-900">
                          ₦
                          {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </CardContent>

                {/* Pharmacy Subtotal */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-gray-600">
                    Subtotal
                  </span>
                  <span className="font-bold text-gray-900">
                    ₦{group.subtotal.toLocaleString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <div className="bg-primary-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Order Summary</h3>
              </div>

              <CardContent className="space-y-4">
                {/* Summary Details */}
                <div className="space-y-3 border-b border-gray-200 pb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{getTotalPrice().toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Est. Delivery Fee</span>
                    <span>₦{getEstimatedDeliveryFee().toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Taxes & Charges</span>
                    <span>₦0</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ₦
                    {(
                      getTotalPrice() + getEstimatedDeliveryFee()
                    ).toLocaleString()}
                  </span>
                </div>

                {/* Checkout Button */}
                <Link href="/customer/checkout" className="block">
                  <Button variant="primary" className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>

                {/* Continue Shopping Link */}
                <Link href="/browse" className="block">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>

                {/* Info Text */}
                <p className="text-xs text-gray-500 text-center">
                  Delivery fee estimated. Final price calculated at checkout.
                </p>
              </CardContent>
            </Card>

            {/* Cart Info */}
            <Card className="mt-4">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📦</span>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {cartItems.length} item
                      {cartItems.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-gray-600">
                      from {groupedCart.length} pharmacies
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">🚚</span>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      Fast Delivery
                    </p>
                    <p className="text-gray-600">
                      Usually within 1-2 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">✓</span>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      Verified Sellers
                    </p>
                    <p className="text-gray-600">
                      All authentic products
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
