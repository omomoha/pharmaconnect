'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';

interface FormData {
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  unit: string;
  active: boolean;
}

const CATEGORIES = [
  'Pain Relief',
  'Vitamins',
  'First Aid',
  'Digestive',
  'Respiratory',
  'Skin Care',
  'Baby Care',
  'Other',
];

const UNITS = [
  'tablets',
  'capsules',
  'bottles',
  'sachets',
  'tubes',
  'boxes',
  'strips',
  'pieces',
];

export default function AddProductPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'Pain Relief',
    description: '',
    price: '',
    stock: '',
    unit: 'tablets',
    active: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Submit product:', formData);
      alert('Product added successfully!');
      setFormData({
        name: '',
        category: 'Pain Relief',
        description: '',
        price: '',
        stock: '',
        unit: 'tablets',
        active: true,
      });
      setImagePreview(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pharmacy/products">
          <Button variant="ghost" size="sm">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Products
          </Button>
        </Link>
        <PageHeader
          title="Add New Product"
          description="Fill in the details below to add a new OTC medication to your catalog"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Product Name"
              name="name"
              type="text"
              placeholder="e.g., Paracetamol 500mg"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              required
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  {UNITS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Describe the product, usage, benefits, etc."
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  errors.description ? 'border-red-500' : ''
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing and Stock */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Pricing & Stock</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Price (₦)"
                name="price"
                type="number"
                placeholder="e.g., 500"
                value={formData.price}
                onChange={handleInputChange}
                error={errors.price}
                step="0.01"
                min="0"
                required
              />

              <Input
                label="Stock Quantity"
                name="stock"
                type="number"
                placeholder="e.g., 100"
                value={formData.stock}
                onChange={handleInputChange}
                error={errors.stock}
                min="0"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Image */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Product Image</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              {imagePreview ? (
                <div className="text-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-xs mx-auto rounded-lg mb-4"
                  />
                  <label className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-600 mb-2">Click to upload product image</p>
                  <label className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Product Status</h2>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="w-4 h-4 rounded"
              />
              <span className="text-gray-700">
                {formData.active ? 'Active' : 'Inactive'} - Product is available for sale
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3">
          <Link href="/dashboard/pharmacy/products" className="flex-1">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <button type="submit" className="flex-1">
            <Button variant="primary" className="w-full">
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
          </button>
        </div>
      </form>
    </div>
  );
}
