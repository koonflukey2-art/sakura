'use client';

import { useState } from 'react';
import { Package, AlertTriangle, Plus, Search } from 'lucide-react';
import { AIAnalysisButton } from '@/components/AIAnalysisButton';

export default function StockPage() {
  const [search, setSearch] = useState('');

  const products = [
    { id: 1, name: 'สินค้า A', sku: 'SKU-001', quantity: 5, minStock: 10, price: 250, status: 'low' },
    { id: 2, name: 'สินค้า B', sku: 'SKU-002', quantity: 150, minStock: 20, price: 450, status: 'ok' },
    { id: 3, name: 'สินค้า C', sku: 'SKU-003', quantity: 8, minStock: 15, price: 180, status: 'low' },
    { id: 4, name: 'สินค้า D', sku: 'SKU-004', quantity: 200, minStock: 30, price: 320, status: 'ok' },
    { id: 5, name: 'สินค้า E', sku: 'SKU-005', quantity: 0, minStock: 25, price: 550, status: 'out' },
  ];

  const lowStockProducts = products.filter(p => p.status === 'low' || p.status === 'out');

  const stockData = {
    totalProducts: products.length,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: products.filter(p => p.status === 'out').length,
    lowStockProducts: lowStockProducts.map(p => ({
      name: p.name,
      currentQty: p.quantity,
      minStock: p.minStock,
      suggestedOrder: Math.max(p.minStock * 2 - p.quantity, 0)
    }))
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">สต๊อกสินค้า</h1>
          <p className="mt-2 text-gray-600">จัดการคลังสินค้าของคุณ</p>
        </div>
        <div className="flex gap-4">
          <AIAnalysisButton
            page="stock"
            action="suggest_reorder"
            data={stockData}
            buttonText="ให้ AI แนะนำ Reorder"
          />
          <button className="flex items-center gap-2 rounded-lg bg-sakura-500 px-4 py-2 text-white hover:bg-sakura-600">
            <Plus className="h-4 w-4" />
            เพิ่มสินค้า
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">แจ้งเตือน: มี {lowStockProducts.length} สินค้าที่ต้องสั่งซื้อเพิ่ม</span>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">จำนวน</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ขั้นต่ำ</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ราคา</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{product.name}</td>
                <td className="px-6 py-4 text-gray-600">{product.sku}</td>
                <td className="px-6 py-4">{product.quantity}</td>
                <td className="px-6 py-4 text-gray-600">{product.minStock}</td>
                <td className="px-6 py-4">฿{product.price}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'ok' ? 'bg-green-100 text-green-700' :
                    product.status === 'low' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {product.status === 'ok' ? 'ปกติ' : product.status === 'low' ? 'ใกล้หมด' : 'หมด'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
