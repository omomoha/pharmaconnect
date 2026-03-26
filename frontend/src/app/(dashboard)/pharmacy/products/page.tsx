'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}

// Sample products data
const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Pain Relief', price: 500, stock: 150, active: true },
  { id: '2', name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 650, stock: 120, active: true },
  { id: '3', name: 'Aspirin 100mg', category: 'Pain Relief', price: 450, stock: 200, active: true },
  { id: '4', name: 'Vitamin C 1000mg', category: 'Vitamins', price: 1200, stock: 300, active: true },
  { id: '5', name: 'Vitamin D3 400IU', category: 'Vitamins', price: 2500, stock: 80, active: true },
  { id: '6', name: 'Multivitamin', category: 'Vitamins', price: 3500, stock: 150, active: true },
  { id: '7', name: 'First Aid Kit', category: 'First Aid', price: 5000, stock: 45, active: true },
  { id: '8', name: 'Antiseptic Cream', category: 'First Aid', price: 800, stock: 200, active: true },
  { id: '9', name: 'Bandages (Box)', category: 'First Aid', price: 1500, stock: 100, active: true },
  { id: '10', name: 'Antacid Tablets', category: 'Digestive', price: 900, stock: 180, active: true },
  { id: '11', name: 'Ginger Tea', category: 'Digestive', price: 1800, stock: 75, active: true },
  { id: '12', name: 'Cough Syrup', category: 'Respiratory', price: 1200, stock: 120, active: true },
];

const CATEGORIES = [
  'All',
  'Pain Relief',
  'Vitamins',
  'First Aid',
  'Digestive',
  'Respiratory',
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = SAMPLE_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    console.log('Delete product:', selectedProduct?.id);
    setDeleteModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        description="Manage your pharmacy's OTC medications and products"
        actions={
          <Link href="/dashboard/pharmacy/products/new">
            <Button variant="primary">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Product
            </Button>
          </Link>
        }
      />

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-600">No products found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Product Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {product.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`w-3 h-3 rounded-full ${product.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                  </div>

                  {/* Price and Stock */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Price</span>
                      <span className="font-bold text-lg text-primary-600">₦{product.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Stock</span>
                      <span className={`font-semibold ${product.stock > 50 ? 'text-green-600' : product.stock > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {product.stock} units
                      </span>
                    </div>
                  </div>

                  {/* Stock Status Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        product.stock > 100
                          ? 'bg-green-500'
                          : product.stock > 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((product.stock / 200) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/pharmacy/products/${product.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(product)}
                    >
                      Delete
                    </Button>
                  </div>

                  {/* Status Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.active}
                      className="w-4 h-4 rounded"
                      readOnly
                    />
                    <span className="text-sm text-gray-700">
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
