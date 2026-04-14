'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Product {
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
  // Display fields (may come from drug catalog)
  drugName?: string;
  category?: string;
  strength?: string;
  form?: string;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ price: '', quantity: '', discount: '', batchNumber: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkDiscountModal, setBulkDiscountModal] = useState(false);
  const [bulkDiscount, setBulkDiscount] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  useEffect(() => {
    async function loadProducts() {
      if (!user) return;
      setLoading(true);
      try {
        const headers = await getAuthHeaders();

        // Get my pharmacy
        const pharmacyRes = await fetch(`${API_URL}/pharmacies/mine`, { headers });
        const pharmacyResult = await pharmacyRes.json();

        if (!pharmacyResult.success || !pharmacyResult.data?.pharmacy) {
          setLoading(false);
          return;
        }

        const myPharmacyId = pharmacyResult.data.pharmacy.id;
        setPharmacyId(myPharmacyId);

        // Get products
        const productsRes = await fetch(`${API_URL}/pharmacies/${myPharmacyId}/products`, { headers });
        const productsResult = await productsRes.json();

        if (productsResult.success && productsResult.data?.products) {
          setProducts(productsResult.data.products);
        }
      } catch {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [user, getAuthHeaders]);

  const filteredProducts = products.filter(product => {
    const name = product.drugName || product.sku || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      discount: (product.discount || 0).toString(),
      batchNumber: product.batchNumber,
    });
    setEditModal(true);
  };

  const confirmEdit = async () => {
    if (!selectedProduct || !pharmacyId) return;
    setEditLoading(true);
    try {
      const headers = await getAuthHeaders();
      const body: Record<string, unknown> = {};
      const newPrice = parseFloat(editForm.price);
      const newQty = parseInt(editForm.quantity);
      const newDiscount = parseFloat(editForm.discount);
      if (!isNaN(newPrice) && newPrice > 0) body.price = newPrice;
      if (!isNaN(newQty) && newQty >= 0) body.quantity = newQty;
      if (!isNaN(newDiscount) && newDiscount >= 0) body.discount = newDiscount;
      if (editForm.batchNumber.trim()) body.batchNumber = editForm.batchNumber.trim();

      const res = await fetch(
        `${API_URL}/pharmacies/${pharmacyId}/products/${selectedProduct.id}`,
        { method: 'PATCH', headers, body: JSON.stringify(body) }
      );
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Update failed');
      }
      setProducts(prev =>
        prev.map(p =>
          p.id === selectedProduct.id
            ? { ...p, ...body } as Product
            : p
        )
      );
      setEditModal(false);
      setSelectedProduct(null);
      toast.success('Product updated');
    } catch {
      toast.error('Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleBulkSelect = (productId: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (bulkSelected.size === filteredProducts.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const applyBulkDiscount = async () => {
    if (!pharmacyId || bulkSelected.size === 0) return;
    const discountValue = parseFloat(bulkDiscount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error('Discount must be between 0 and 100%');
      return;
    }
    setBulkLoading(true);
    try {
      const headers = await getAuthHeaders();
      let successCount = 0;
      for (const productId of bulkSelected) {
        const res = await fetch(
          `${API_URL}/pharmacies/${pharmacyId}/products/${productId}`,
          { method: 'PATCH', headers, body: JSON.stringify({ discount: discountValue }) }
        );
        const result = await res.json();
        if (res.ok && result.success) successCount++;
      }
      setProducts(prev =>
        prev.map(p =>
          bulkSelected.has(p.id) ? { ...p, discount: discountValue } : p
        )
      );
      setBulkDiscountModal(false);
      setBulkMode(false);
      setBulkSelected(new Set());
      setBulkDiscount('');
      toast.success(`Discount ${discountValue > 0 ? `of ${discountValue}%` : 'removed'} applied to ${successCount} product${successCount !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to apply bulk discount');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct || !pharmacyId) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${API_URL}/pharmacies/${pharmacyId}/products/${selectedProduct.id}`,
        { method: 'DELETE', headers }
      );
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Delete failed');
      }
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setDeleteModal(false);
      setSelectedProduct(null);
      toast.success('Product removed');
    } catch {
      toast.error('Failed to delete product');
      setDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Product Catalog" description="Manage your pharmacy's OTC medications and products" />
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!pharmacyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Product Catalog" description="Manage your pharmacy's OTC medications and products" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No pharmacy found. Please register your pharmacy first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        description={`${products.length} products in your catalog`}
        actions={
          <div className="flex gap-2 flex-wrap">
            {products.length > 0 && (
              <Button
                variant={bulkMode ? 'secondary' : 'outline'}
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setBulkSelected(new Set());
                }}
              >
                {bulkMode ? 'Cancel Bulk' : 'Bulk Discount'}
              </Button>
            )}
            <Link href="/dashboard/pharmacy/products/new">
              <Button variant="primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <Input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {bulkMode && (
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={bulkSelected.size === filteredProducts.length && filteredProducts.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded"
                />
                Select All
              </label>
              <span className="text-sm text-gray-500">
                {bulkSelected.size} of {filteredProducts.length} selected
              </span>
              <div className="ml-auto">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={bulkSelected.size === 0}
                  onClick={() => setBulkDiscountModal(true)}
                >
                  Apply Discount to Selected ({bulkSelected.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-600">
                {search ? 'No products match your search' : 'No products in your catalog yet'}
              </p>
              {!search && (
                <Link href="/dashboard/pharmacy/products/new">
                  <Button variant="primary" size="sm" className="mt-4">Add Your First Product</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredProducts.map((product) => {
            const displayName = product.drugName || product.sku || `Product ${product.id.slice(0, 6)}`;
            const displayCategory = product.category || 'Uncategorized';

            return (
              <Card key={product.id} className={bulkMode && bulkSelected.has(product.id) ? 'ring-2 ring-primary-500' : ''}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {bulkMode && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkSelected.has(product.id)}
                          onChange={() => toggleBulkSelect(product.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-500">Select</span>
                      </label>
                    )}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{displayName}</h3>
                        {product.strength && (
                          <p className="text-sm text-gray-500 mt-0.5">{product.strength}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {displayCategory}
                          </span>
                          {product.discount && product.discount > 0 ? (
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {product.discount}% OFF
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`w-3 h-3 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Price</span>
                        <div className="text-right">
                          <span className="font-bold text-lg text-primary-600">
                            ₦{(product.discount ? product.price * (1 - product.discount / 100) : product.price).toLocaleString()}
                          </span>
                          {product.discount ? (
                            <span className="text-xs text-gray-400 line-through ml-2">
                              ₦{product.price.toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Stock</span>
                        <span className={`font-semibold ${
                          product.quantity > 50 ? 'text-green-600' : product.quantity > 20 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {product.quantity} units
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Batch</span>
                        <span className="text-gray-700 text-sm font-mono">{product.batchNumber}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          product.quantity > 100 ? 'bg-green-500' : product.quantity > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((product.quantity / 200) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(product)}
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {product.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Product" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedProduct?.drugName || selectedProduct?.sku}</strong>? This will deactivate the product from your catalog.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bulkDiscountModal} onClose={() => setBulkDiscountModal(false)} title="Apply Bulk Discount" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700">
            Apply a discount to <strong>{bulkSelected.size} selected product{bulkSelected.size !== 1 ? 's' : ''}</strong>. Set to 0 to remove existing discounts.
          </p>
          <Input
            label="Discount Percentage (%)"
            type="number"
            placeholder="e.g., 15"
            value={bulkDiscount}
            onChange={(e) => setBulkDiscount(e.target.value)}
            min="0"
            max="100"
          />
          {bulkDiscount && parseFloat(bulkDiscount) > 0 && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg p-2">
              All selected products will show <strong>{bulkDiscount}% off</strong> their listed price.
            </p>
          )}
          {bulkDiscount === '0' && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
              This will remove the discount from all selected products.
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setBulkDiscountModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={applyBulkDiscount} isLoading={bulkLoading}>
              Apply Discount
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Product" size="md">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-2">
            <p className="font-semibold text-gray-900">{selectedProduct?.drugName || selectedProduct?.sku}</p>
            {selectedProduct?.strength && (
              <p className="text-sm text-gray-500">{selectedProduct.strength}</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (₦)"
              type="number"
              value={editForm.price}
              onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
            />
            <Input
              label="Stock Quantity"
              type="number"
              value={editForm.quantity}
              onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
            />
            <Input
              label="Discount (%) — 0 to remove"
              type="number"
              value={editForm.discount}
              onChange={(e) => setEditForm(prev => ({ ...prev, discount: e.target.value }))}
              min="0"
              max="100"
            />
            <Input
              label="Batch Number"
              type="text"
              value={editForm.batchNumber}
              onChange={(e) => setEditForm(prev => ({ ...prev, batchNumber: e.target.value }))}
            />
          </div>
          {editForm.price && editForm.discount && parseFloat(editForm.discount) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">Customer pays:</span>{' '}
                <span className="font-bold">
                  ₦{(parseFloat(editForm.price) * (1 - parseFloat(editForm.discount) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-green-600 ml-2 line-through">
                  ₦{parseFloat(editForm.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="ml-2 text-green-700 font-medium">({editForm.discount}% off)</span>
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={confirmEdit} isLoading={editLoading}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
