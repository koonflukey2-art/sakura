'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, User, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const { token } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search },
      });
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c) => c.totalOrders === 1).length;
  const totalRevenue = customers.reduce((sum, c) => sum + Number(c.totalSpent), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ลูกค้า</h1>
          <p className="mt-2 text-gray-600">จัดการข้อมูลลูกค้าและประวัติการซื้อ</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600">
          <Plus size={20} />
          เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">{totalCustomers}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <User className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ลูกค้าใหม่</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{newCustomers}</p>
              <p className="text-sm text-gray-500">
                {totalCustomers > 0 ? ((newCustomers / totalCustomers) * 100).toFixed(1) : 0}% ของทั้งหมด
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">มูลค่าสะสมทั้งหมด</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                ฿{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาลูกค้า (ชื่อ, อีเมล, เบอร์โทร)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchCustomers()}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
              />
            </div>
          </div>
          <button
            onClick={fetchCustomers}
            className="rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ติดต่อ</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  จำนวนออเดอร์
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  ยอดซื้อสะสม
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  ประเภท
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  วันที่สมัคร
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    ไม่พบข้อมูลลูกค้า
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isNew = customer.totalOrders === 1;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {customer.email && (
                            <div className="text-gray-700">{customer.email}</div>
                          )}
                          {customer.phone && (
                            <div className="text-gray-500">{customer.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                          {customer.totalOrders} ครั้ง
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">
                        ฿{Number(customer.totalSpent).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            isNew
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {isNew ? '🆕 ลูกค้าใหม่' : '⭐ ลูกค้าประจำ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {new Date(customer.createdAt).toLocaleDateString('th-TH')}
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
