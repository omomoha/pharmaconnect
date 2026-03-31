'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import StatsCard from '@/components/ui/StatsCard';

interface InventoryItem {
  id: string;
  productName: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}

// Sample inventory data
const SAMPLE_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    productName: 'Paracetamol 500mg',
    category: 'Pain Relief',
    currentStock: 150,
    reorderLevel: 50,
    status: 'In Stock',
    lastUpdated: '2026-03-26 10:30',
  },
  {
    id: '2',
    productName: 'Ibuprofen 400mg',
    category: 'Pain Relief',
    currentStock: 35,
    reorderLevel: 50,
    status: 'Low Stock',
    lastUpdated: '2026-03-26 09:15',
  },
  {
    id: '3',
    productName: 'Aspirin 100mg',
    category: 'Pain Relief',
    currentStock: 200,
    reorderLevel: 50,
    status: 'In Stock',
    lastUpdated: '2026-03-25 14:45',
  },
  {
    id: '4',
    productName: 'Vitamin C 1000mg',
    category: 'Vitamins',
    currentStock: 300,
    reorderLevel: 100,
    status: 'In Stock',
    lastUpdated: '2026-03-26 08:00',
  },
  {
    id: '5',
    productName: 'Vitamin D3 400IU',
    category: 'Vitamins',
    currentStock: 15,
    reorderLevel: 100,
    status: 'Low Stock',
    lastUpdated: '2026-03-26 11:20',
  },
  {
    id: '6',
    productName: 'Multivitamin',
    category: 'Vitamins',
    currentStock: 0,
    reorderLevel: 75,
    status: 'Out of Stock',
    lastUpdated: '2026-03-25 16:00',
  },
  {
    id: '7',
    productName: 'First Aid Kit',
    category: 'First Aid',
    currentStock: 45,
    reorderLevel: 30,
    status: 'In Stock',
    lastUpdated: '2026-03-26 09:30',
  },
  {
    id: '8',
    productName: 'Antiseptic Cream',
    category: 'First Aid',
    currentStock: 200,
    reorderLevel: 80,
    status: 'In Stock',
    lastUpdated: '2026-03-26 07:45',
  },
  {
    id: '9',
    productName: 'Bandages (Box)',
    category: 'First Aid',
    currentStock: 12,
    reorderLevel: 100,
    status: 'Low Stock',
    lastUpdated: '2026-03-26 10:15',
  },
  {
    id: '10',
    productName: 'Antacid Tablets',
    category: 'Digestive',
    currentStock: 180,
    reorderLevel: 75,
    status: 'In Stock',
    lastUpdated: '2026-03-26 06:30',
  },
  {
    id: '11',
    productName: 'Ginger Tea',
    category: 'Digestive',
    currentStock: 0,
    reorderLevel: 50,
    status: 'Out of Stock',
    lastUpdated: '2026-03-24 12:00',
  },
  {
    id: '12',
    productName: 'Cough Syrup',
    category: 'Respiratory',
    currentStock: 120,
    reorderLevel: 60,
    status: 'In Stock',
    lastUpdated: '2026-03-26 11:00',
  },
];

export default function InventoryPage() {
  const [inventory, _setInventory] = useState(SAMPLE_INVENTORY);
  const [restockModal, setRestockModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [restockQuantities, setRestockQuantities] = useState<Record<string, string>>({});

  const inStockCount = inventory.filter(i => i.status === 'In Stock').length;
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'Out of Stock').length;

  const handleBulkRestock = () => {
    console.log('Restocking items:', selectedItems, restockQuantities);
    setRestockModal(false);
    setSelectedItems([]);
    setRestockQuantities({});
    alert('Items restocked successfully!');
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="Track stock levels and manage product restocking"
      />

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatsCard
          label="Total Products"
          value={String(inventory.length)}
          change="Active"
        />
        <StatsCard
          label="In Stock"
          value={String(inStockCount)}
          change={`${Math.round((inStockCount / inventory.length) * 100)}%`}
          icon="✓"
        />
        <StatsCard
          label="Low Stock Items"
          value={String(lowStockCount)}
          change="Needs attention"
          icon="⚠"
        />
        <StatsCard
          label="Out of Stock"
          value={String(outOfStockCount)}
          change="Needs immediate restock"
          icon="✕"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Inventory List</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedItems([]);
                setRestockQuantities({});
                setRestockModal(true);
              }}
            >
              Bulk Restock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                      item.status === 'Low Stock'
                        ? 'border-l-4 border-l-yellow-400 bg-yellow-50'
                        : item.status === 'Out of Stock'
                        ? 'border-l-4 border-l-red-400 bg-red-50'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">{item.productName}</td>
                    <td className="py-4 px-4 text-gray-600">{item.category}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold">{item.currentStock}</span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">{item.reorderLevel}</td>
                    <td className="py-4 px-4 text-center">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-gray-600">{item.lastUpdated}</td>
                    <td className="py-4 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIndividualRestock(item.id)}
                      >
                        Restock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Restock Modal */}
      <Modal
        isOpen={restockModal}
        onClose={() => {
          setRestockModal(false);
          setSelectedItems([]);
          setRestockQuantities({});
        }}
        title="Restock Products"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {inventory
              .filter(item => item.status !== 'In Stock' || item.currentStock < item.reorderLevel * 1.5)
              .map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="w-4 h-4 mt-1 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-600">Current: {item.currentStock} | Reorder: {item.reorderLevel}</p>
                    {selectedItems.includes(item.id) && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          placeholder="Quantity to add"
                          value={restockQuantities[item.id] || ''}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                </label>
              ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setRestockModal(false);
                setSelectedItems([]);
                setRestockQuantities({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleBulkRestock}
              disabled={selectedItems.length === 0}
            >
              Confirm Restock ({selectedItems.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
