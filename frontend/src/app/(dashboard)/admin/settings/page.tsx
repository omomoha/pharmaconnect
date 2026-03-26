'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface DrugItem {
  id: string;
  name: string;
  category: string;
  status: 'Approved' | 'Under Review';
}

interface ModificationKeyword {
  id: string;
  keyword: string;
}

const sampleDrugs: DrugItem[] = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Pain Relief', status: 'Approved' },
  { id: '2', name: 'Ibuprofen 200mg', category: 'Anti-inflammatory', status: 'Approved' },
  { id: '3', name: 'Cetirizine 10mg', category: 'Antihistamine', status: 'Approved' },
  { id: '4', name: 'Omeprazole 20mg', category: 'Antacid', status: 'Approved' },
  { id: '5', name: 'Vitamin C 500mg', category: 'Supplements', status: 'Approved' },
  { id: '6', name: 'Vitamin B Complex', category: 'Supplements', status: 'Approved' },
  { id: '7', name: 'Calcium Carbonate', category: 'Supplements', status: 'Approved' },
  { id: '8', name: 'Multivitamin', category: 'Supplements', status: 'Under Review' },
  { id: '9', name: 'Loratadine 10mg', category: 'Antihistamine', status: 'Approved' },
  { id: '10', name: 'Diclofenac 50mg', category: 'Anti-inflammatory', status: 'Approved' },
];

const sampleKeywords = [
  { id: '1', keyword: 'Amoxicillin' },
  { id: '2', keyword: 'Codeine' },
  { id: '3', keyword: 'Prescription' },
  { id: '4', keyword: 'Doctor Order' },
  { id: '5', keyword: 'Controlled' },
];

export default function SettingsPage() {
  // Commission Settings
  const [pharmacyCommission, setPharmacyCommission] = useState('8');
  const [deliveryCommission, setDeliveryCommission] = useState('12');

  // Platform Config
  const [maxDeliveryRadius, setMaxDeliveryRadius] = useState('25');
  const [minOrderAmount, setMinOrderAmount] = useState('2500');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('15000');

  // OTC Drug Catalog
  const [drugs, setDrugs] = useState(sampleDrugs);
  const [newDrugName, setNewDrugName] = useState('');
  const [newDrugCategory, setNewDrugCategory] = useState('');
  const [drugSearchTerm, setDrugSearchTerm] = useState('');

  // Moderation Keywords
  const [keywords, setKeywords] = useState(sampleKeywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [autoFlagThreshold, setAutoFlagThreshold] = useState('3');

  // Save state
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveCommissions = () => {
    setSaveMessage('Commission settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSavePlatformConfig = () => {
    setSaveMessage('Platform configuration saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleAddDrug = () => {
    if (newDrugName.trim() && newDrugCategory.trim()) {
      const newDrug: DrugItem = {
        id: (drugs.length + 1).toString(),
        name: newDrugName,
        category: newDrugCategory,
        status: 'Under Review',
      };
      setDrugs([...drugs, newDrug]);
      setNewDrugName('');
      setNewDrugCategory('');
      setSaveMessage('Drug added to catalog!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleRemoveDrug = (id: string) => {
    setDrugs(drugs.filter((drug) => drug.id !== id));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      const keyword: ModificationKeyword = {
        id: (keywords.length + 1).toString(),
        keyword: newKeyword,
      };
      setKeywords([...keywords, keyword]);
      setNewKeyword('');
      setSaveMessage('Keyword added to moderation list!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleRemoveKeyword = (id: string) => {
    setKeywords(keywords.filter((kw) => kw.id !== id));
  };

  const handleSaveModeration = () => {
    setSaveMessage('Moderation settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const filteredDrugs = drugs.filter((drug) =>
    drug.name.toLowerCase().includes(drugSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure platform policies, commission rates, and moderation rules"
      />

      {/* Success Message */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full" />
          <p className="text-sm font-medium">{saveMessage}</p>
        </div>
      )}

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Commission Settings</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Pharmacy Commission (%)"
              type="number"
              value={pharmacyCommission}
              onChange={(e) => setPharmacyCommission(e.target.value)}
              helper="Commission percentage charged to pharmacies per order"
            />
            <Input
              label="Delivery Commission (%)"
              type="number"
              value={deliveryCommission}
              onChange={(e) => setDeliveryCommission(e.target.value)}
              helper="Commission percentage charged to delivery providers per delivery"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleSaveCommissions}
            className="w-full md:w-auto"
          >
            💾 Save Commissions
          </Button>
        </CardContent>
      </Card>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Platform Configuration</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Input
              label="Max Delivery Radius (km)"
              type="number"
              value={maxDeliveryRadius}
              onChange={(e) => setMaxDeliveryRadius(e.target.value)}
              helper="Maximum delivery distance from pharmacy"
            />
            <Input
              label="Minimum Order Amount (₦)"
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              helper="Minimum order value allowed on platform"
            />
            <Input
              label="Free Delivery Threshold (₦)"
              type="number"
              value={freeDeliveryThreshold}
              onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
              helper="Order value for free delivery"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleSavePlatformConfig}
            className="w-full md:w-auto"
          >
            💾 Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* OTC Drug Catalog Management */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">OTC Drug Catalog Management</h3>
          <p className="text-sm text-gray-600 mt-2">
            Manage approved over-the-counter medications available on the platform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Drug */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Add New Drug</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <Input
                placeholder="Drug name (e.g., Paracetamol 500mg)"
                value={newDrugName}
                onChange={(e) => setNewDrugName(e.target.value)}
              />
              <Input
                placeholder="Category (e.g., Pain Relief)"
                value={newDrugCategory}
                onChange={(e) => setNewDrugCategory(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={handleAddDrug}
                className="h-11"
              >
                ➕ Add Drug
              </Button>
            </div>
          </div>

          {/* Search Drugs */}
          <Input
            placeholder="Search approved drugs..."
            value={drugSearchTerm}
            onChange={(e) => setDrugSearchTerm(e.target.value)}
          />

          {/* Drug List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                      Drug Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrugs.map((drug) => (
                    <tr
                      key={drug.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {drug.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {drug.category}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            drug.status === 'Approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {drug.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleRemoveDrug(drug.id)}
                          className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors text-lg"
                          title="Remove from catalog"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredDrugs.length === 0 && (
              <div className="text-center py-6 text-gray-600">
                No drugs found matching your search
              </div>
            )}
          </div>

          <p className="text-xs text-gray-600">
            Total drugs in catalog: {drugs.length}
          </p>
        </CardContent>
      </Card>

      {/* Moderation Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Moderation Settings</h3>
          <p className="text-sm text-gray-600 mt-2">
            Configure keywords and thresholds for automatic chat moderation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-Flag Threshold */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <Input
              label="Auto-Flag Threshold"
              type="number"
              value={autoFlagThreshold}
              onChange={(e) => setAutoFlagThreshold(e.target.value)}
              helper="Number of flagged keywords to auto-escalate a conversation"
            />
          </div>

          {/* Add New Keyword */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">
              Add Prescription Drug Detection Keyword
            </h4>
            <div className="flex gap-3">
              <Input
                placeholder="Enter keyword to monitor (e.g., Amoxicillin)"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="primary"
                onClick={handleAddKeyword}
                className="h-11 flex-shrink-0"
              >
                ➕
              </Button>
            </div>
          </div>

          {/* Keywords List */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Monitored Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <div
                  key={kw.id}
                  className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm"
                >
                  <span>{kw.keyword}</span>
                  <button
                    onClick={() => handleRemoveKeyword(kw.id)}
                    className="text-blue-600 hover:text-blue-800 text-lg"
                    title="Remove keyword"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Total keywords monitored: {keywords.length}
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleSaveModeration}
            className="w-full md:w-auto"
          >
            💾 Save Moderation Settings
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Notification Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-primary-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900">
                Email alerts for flagged conversations
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-primary-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900">
                Daily summary of platform activity
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-primary-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900">
                Notify on high-value disputes
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900">
                Weekly revenue report
              </span>
            </label>
          </div>

          <Button variant="primary" className="w-full md:w-auto">
            💾 Save Notification Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
