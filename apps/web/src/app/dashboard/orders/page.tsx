'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { AIAnalysisButton } from '@/components/AIAnalysisButton';

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const orders = [
    { id: 'ORD-001', customer: 'คุณสมชาย', items: 3, total: 4500, status: 'completed', date: '2024-01-15', time: '14:30' },
    { id: 'ORD-002', customer: 'คุณสมหญิง', items: 1, total: 1200, status: 'pending', date: '2024-01-15', time: '15:45' },
    { id: 'ORD-003', customer: 'คุณวิชัย', items: 5, total: 8900, status: 'completed', date: '2024-01-15', time: '10:20' },
    { id: 'ORD-004', customer: 'คุณนารี', items: 2, total: 3200, status: 'cancelled', date: '2024-01-14', time: '16:00' },
    { id: 'ORD-005', customer: 'คุณประสิทธิ์', items: 4, total: 6700, status: 'pending', date: '2024-01-15', time: '11:15' },
  ];

  const ordersData = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0),
    averageOrderValue: Math.round(orders.reduce((acc, o) => acc + o.total, 0) / orders.length),
    peakHours: ['10:00-12:00', '14:00-16:00']
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">คำสั่งซื้อ</h1>
          <p className="mt-2 text-gray-600">จัดการคำสั่งซื้อของคุณ</p>
        </div>
        <div className="flex gap-4">
          <AIAnalysisButton
            page="orders"
            action="analyze_sales"
            data={ordersData}
            buttonText="ให้ AI วิเคราะห์การขาย"
          />
          <button className="flex items-center gap-2 rounded-lg bg-sakura-500 px-4 py-2 text-white hover:bg-sakura-600">
            <Plus className="h-4 w-4" />
            สร้างออเดอร์
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <ShoppingCart className="h-8 w-8 text-blue-500" />
          <p className="mt-4 text-2xl font-bold">{orders.length}</p>
          <p className="text-sm text-gray-600">ออเดอร์ทั้งหมด</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <p className="mt-4 text-2xl font-bold">{ordersData.completedOrders}</p>
          <p className="text-sm text-gray-600">สำเร็จ</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <Clock className="h-8 w-8 text-orange-500" />
          <p className="mt-4 text-2xl font-bold">{ordersData.pendingOrders}</p>
          <p className="text-sm text-gray-600">รอดำเนินการ</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <XCircle className="h-8 w-8 text-red-500" />
          <p className="mt-4 text-2xl font-bold">{ordersData.cancelledOrders}</p>
          <p className="text-sm text-gray-600">ยกเลิก</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาออเดอร์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-4 py-2"
        >
          <option value="all">ทั้งหมด</option>
          <option value="completed">สำเร็จ</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">รหัสออเดอร์</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ลูกค้า</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">รายการ</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ยอดรวม</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">วันที่</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-blue-600">{order.id}</td>
                <td className="px-6 py-4">{order.customer}</td>
                <td className="px-6 py-4 text-gray-600">{order.items} รายการ</td>
                <td className="px-6 py-4 font-medium">฿{order.total.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-600">{order.date} {order.time}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {getStatusIcon(order.status)}
                    {order.status === 'completed' ? 'สำเร็จ' : order.status === 'pending' ? 'รอดำเนินการ' : 'ยกเลิก'}
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
