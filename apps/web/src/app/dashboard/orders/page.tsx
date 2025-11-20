'use client';

import { useState, useEffect } from 'react';
import { Plus, Package, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Order {
  id: string;
  totalAmount: number;
  totalCost: number;
  profit: number;
  status: string;
  createdAt: string;
  customer: {
    name: string;
    email?: string;
  };
  orderItems: Array<{
    quantity: number;
    priceSell: number;
    stockItem: {
      name: string;
      code: string;
    };
  }>;
}

export default function OrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PAID: 'bg-green-100 text-green-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-orange-100 text-orange-700',
    };

    const labels: Record<string, string> = {
      PENDING: 'รอชำระ',
      PAID: 'ชำระแล้ว',
      PROCESSING: 'กำลังดำเนินการ',
      SHIPPED: 'จัดส่งแล้ว',
      DELIVERED: 'ส่งถึงแล้ว',
      CANCELLED: 'ยกเลิก',
      REFUNDED: 'คืนเงิน',
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalProfit = orders.reduce((sum, o) => sum + Number(o.profit), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">คำสั่งซื้อ</h1>
          <p className="mt-2 text-gray-600">จัดการและติดตามคำสั่งซื้อทั้งหมด</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600">
          <Plus size={20} />
          สร้างออเดอร์ใหม่
        </button>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยอดออเดอร์ทั้งหมด</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">{orders.length}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยอดขายรวม</p>
              <p className="mt-2 text-3xl font-bold text-gray-800">
                ฿{totalRevenue.toLocaleString()}
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
              <p className="text-sm text-gray-600">กำไรรวม</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                ฿{totalProfit.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  วันที่
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  ลูกค้า
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  สินค้า
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  ยอดรวม
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  กำไร
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    ยังไม่มีคำสั่งซื้อ
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-800">{order.customer.name}</div>
                        {order.customer.email && (
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.orderItems.length} รายการ
                      <div className="text-xs text-gray-500 mt-1">
                        {order.orderItems.slice(0, 2).map((item, i) => (
                          <div key={i}>
                            {item.stockItem.name} x{item.quantity}
                          </div>
                        ))}
                        {order.orderItems.length > 2 && (
                          <div>และอีก {order.orderItems.length - 2} รายการ...</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      ฿{Number(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">
                      ฿{Number(order.profit).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
