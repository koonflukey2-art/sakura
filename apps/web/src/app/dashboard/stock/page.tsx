'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface StockItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  priceCost: number;
  priceSell: number;
  quantity: number;
  minThreshold: number;
  status: string;
  createdAt: string;
}

export default function StockPage() {
  const { token } = useAuthStore();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const response = await api.get('/stock/items', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockItems = () => {
    return items.filter((item) => item.quantity <= item.minThreshold);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  const lowStockItems = getLowStockItems();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการสต๊อกสินค้า</h1>
          <p className="mt-2 text-gray-600">ดูแลและจัดการสินค้าคงคลังของคุณ</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600"
        >
          <Plus size={20} />
          เพิ่มสินค้าใหม่
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-orange-500 p-3">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-800">
                ⚠️ สินค้าใกล้หมด {lowStockItems.length} รายการ
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                มีสินค้าที่ปริมาณต่ำกว่าเกณฑ์ขั้นต่ำ กรุณาเติมสต๊อก
              </p>
              <div className="mt-3 space-y-1">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm text-orange-700">
                    • {item.name} (เหลือ {item.quantity} ชิ้น)
                  </div>
                ))}
                {lowStockItems.length > 3 && (
                  <div className="text-sm text-orange-700">
                    และอีก {lowStockItems.length - 3} รายการ...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาสินค้า (ชื่อ, รหัส)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchStock()}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
              />
            </div>
          </div>
          <button
            onClick={fetchStock}
            className="rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">รหัส</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อสินค้า</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ที่อยู่</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">ต้นทุน</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">ราคาขาย</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">คงเหลือ</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">สถานะ</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    ไม่พบข้อมูลสินค้า
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLowStock = item.quantity <= item.minThreshold;
                  return (
                    <tr key={item.id} className={isLowStock ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{item.code}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-800">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.location || '-'}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        ฿{Number(item.priceCost).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                        ฿{Number(item.priceSell).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            isLowStock
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {item.quantity} ชิ้น
                          {isLowStock && ' ⚠️'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.status === 'ACTIVE' ? 'พร้อมขาย' : 'ไม่พร้อม'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                            <Edit size={18} />
                          </button>
                          <button className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
