'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, X, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import AIButton from '@/components/AIButton';

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
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    location: '',
    priceCost: '',
    priceSell: '',
    quantity: '',
    minThreshold: '10',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        location: formData.location || undefined,
        priceCost: parseFloat(formData.priceCost),
        priceSell: parseFloat(formData.priceSell),
        quantity: parseInt(formData.quantity),
        minThreshold: parseInt(formData.minThreshold),
      };

      if (editingItem) {
        // Update
        await api.put(`/stock/items/${editingItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create
        await api.post('/stock/items', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        location: '',
        priceCost: '',
        priceSell: '',
        quantity: '',
        minThreshold: '10',
      });
      fetchStock();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      location: item.location || '',
      priceCost: item.priceCost.toString(),
      priceSell: item.priceSell.toString(),
      quantity: item.quantity.toString(),
      minThreshold: item.minThreshold.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) return;

    try {
      await api.delete(`/stock/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStock();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
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
  const totalValue = items.reduce((sum, item) => sum + Number(item.priceCost) * item.quantity, 0);
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการสต๊อกสินค้า</h1>
          <p className="mt-2 text-gray-600">ดูแลและจัดการสินค้าคงคลังของคุณ</p>
        </div>
        <div className="flex gap-3">
          <AIButton
            page="stock"
            action="analyze_stock"
            payload={{ items }}
            buttonText="ให้ AI วิเคราะห์"
            variant="success"
          />
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                name: '',
                code: '',
                description: '',
                location: '',
                priceCost: '',
                priceSell: '',
                quantity: '',
                minThreshold: '10',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600"
          >
            <Plus size={20} />
            เพิ่มสินค้าใหม่
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">จำนวนสินค้า</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">{totalItems}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">จำนวนชิ้นทั้งหมด</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {totalQuantity.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Package className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">มูลค่ารวม</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                ฿{totalValue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">สินค้าใกล้หมด</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{lowStockItems.length}</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
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
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ชื่อสินค้า *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                    placeholder="เช่น สินค้า A"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    รหัสสินค้า *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={!!editingItem}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200 disabled:bg-gray-100"
                    placeholder="เช่น PROD001"
                  />
                  {editingItem && (
                    <p className="mt-1 text-xs text-gray-500">รหัสสินค้าไม่สามารถแก้ไขได้</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ที่เก็บ / คลัง
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  placeholder="เช่น คลัง A, ชั้น 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ราคาต้นทุน (฿) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.priceCost}
                    onChange={(e) => setFormData({ ...formData, priceCost: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ราคาขาย (฿) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.priceSell}
                    onChange={(e) => setFormData({ ...formData, priceSell: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    จำนวนคงเหลือ *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    จำนวนขั้นต่ำ *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                    placeholder="10"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    แจ้งเตือนเมื่อสินค้าเหลือน้อยกว่าจำนวนนี้
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sakura-500 px-8 py-3 font-semibold text-white transition hover:bg-sakura-600"
                >
                  {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
