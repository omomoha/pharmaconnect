'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import StatsCard from '@/components/ui/StatsCard';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const REORDER_LEVEL = 50; // Default reorder threshold

interface InventoryItem {
  id: string;
  productName: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

function deriveInventoryStatus(quantity: number, reorderLevel: number = REORDER_LEVEL): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [restockQuantities, setRestockQuantities] = useState<Record<string, string>>({});

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  useEffect(() => {
    async function loadInventory() {
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

        const pharmacyId = pharmacyResult.data.pharmacy.id;

        // Get products (inventory is derived from products)
        const productsRes = await fetch(`${API_URL}/pharmacies/${pharmacyId}/products`, { headers });
        const productsResult = await productsRes.json();

        if (productsResult.success && productsResult.data?.products) {
          const items: InventoryItem[] = productsResult.data.products.map((p: {
            id: string;
            drugName?: string;
            sku?: string;
            category?: string;
            quantity: number;
            updatedAt?: string;
          }) => ({
            id: p.id,
            productName: p.drugName || p.sku || `Product ${p.id.slice(0, 6)}`,
            category: p.category || 'Uncategorized',
            currentStock: p.quantity,
            reorderLevel: REORDER_LEVEL,
            status: deriveInventoryStatus(p.quantity),
            lastUpdated: p.updatedAt
              ? new Date(p.updatedAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'N/A',
          }));
          setInventory(items);
        }
      } catch {
        toast.error('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, [user, getAuthHeaders]);

  const inStockCount = inventory.filter(i => i.status === 'In Stock').length;
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'Out of Stock').length;

  const handleBulkRestock = () => {
    // In a real implementation, this would call a backend endpoint to update quantities
    toast.success(`Restock request submitted for ${selectedItems.length} items`);
    setRestockModal(false);
    setSelectedItems([]);
    setRestockQuantities({});
  };

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
      const newQuantities = { ...restockQuantities };
      delete newQuantities[itemId];
      setRestockQuantities(newQuantities);
    } else {
      setSelectedItems([...selectedItems, itemId]);
      setRestockQuantities(prev => ({ ...prev, [itemId]: '50' }));
    }
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    setRestockQuantities(prev => ({ ...prev, [itemId]: value }));
  };

  const handleIndividualRestock = (itemId: string) => {
    setSelectedItems([itemId]);
    setRestockQuantities({ [itemId]: '50' });
    setRestockModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inventory Management" description="Track stock levels and manage product restocking" />
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Management" description="Track stock levels and manage product restocking" />

      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard label="Total Products" value={String(inventory.length)} change="Active" />
        <StatsCard
          label="In Stock"
          value={String(inStockCount)}
          change={inventory.length > 0 ? `${Math.round((inStockCount / inventory.length) * 100)}%` : '0%'}
          icon="✓"
        />
        <StatsCard label="Low Stock Items" value={String(lowStockCount)} change="Needs attention" icon="⚠" />
        <StatsCard label="Out of Stock" value={String(outOfStockCount)} change="Needs immediate restock" icon="✕" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Inventory List</h2>
            <Button variant="primary" size="sm" onClick={() => { setSelectedItems([]); setRestockQuantities({}); setRestockModal(true); }}>
              Bulk Restock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No products in inventory. Add products to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Reorder Level</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Updated</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        item.status === 'Low Stock' ? 'border-l-4 border-l-yellow-400 bg-yellow-50'
                        : item.status === 'Out of Stock' ? 'border-l-4 border-l-red-400 bg-red-50'
                        : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">{item.productName}</td>
                      <td className="py-4 px-4 text-gray-600">{item.category}</td>
                      <td className="py-4 px-4 text-center"><span className="font-semibold">{item.currentStock}</span></td>
                      <td className="py-4 px-4 text-center text-gray-600">{item.reorderLevel}</td>
                      <td className="py-4 px-4 text-center"><StatusBadge status={item.status} size="sm" /></td>
                      <td className="py-4 px-4 text-gray-600">{item.lastUpdated}</td>
                      <td className="py-4 px-4 text-center">
                        <Button variant="outline" size="sm" onClick={() => handleIndividualRestock(item.id)}>Restock</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={restockModal}
        onClose={() => { setRestockModal(false); setSelectedItems([]); setRestockQuantities({}); }}
        title="Restock Products"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {inventory
              .filter(item => item.status !== 'In Stock' || item.currentStock < item.reorderLevel * 1.5)
              .map((item) => (
                <label key={item.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} className="w-4 h-4 mt-1 rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-600">Current: {item.currentStock} | Reorder: {item.reorderLevel}</p>
                    {selectedItems.includes(item.id) && (
                      <div className="mt-2">
                        <Input type="number" placeholder="Quantity to add" value={restockQuantities[item.id] || ''} onChange={(e) => handleQuantityChange(item.id, e.target.value)} min="1" />
                      </div>
                    )}
                  </div>
                </label>
              ))}
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" className="flex-1" onClick={() => { setRestockModal(false); setSelectedItems([]); setRestockQuantities({}); }}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleBulkRestock} disabled={selectedItems.length === 0}>Confirm Restock ({selectedItems.length})</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
