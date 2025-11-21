'use client';

import { useState } from 'react';
import { Users, UserPlus, Search, Star } from 'lucide-react';
import { AIAnalysisButton } from '@/components/AIAnalysisButton';

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const customers = [
    { id: 1, name: 'คุณสมชาย', email: 'somchai@email.com', phone: '081-xxx-xxxx', orders: 15, totalSpent: 45000, type: 'returning' },
    { id: 2, name: 'คุณสมหญิง', email: 'somying@email.com', phone: '082-xxx-xxxx', orders: 3, totalSpent: 8500, type: 'new' },
    { id: 3, name: 'คุณวิชัย', email: 'wichai@email.com', phone: '083-xxx-xxxx', orders: 28, totalSpent: 125000, type: 'vip' },
    { id: 4, name: 'คุณนารี', email: 'naree@email.com', phone: '084-xxx-xxxx', orders: 8, totalSpent: 22000, type: 'returning' },
    { id: 5, name: 'คุณประสิทธิ์', email: 'prasit@email.com', phone: '085-xxx-xxxx', orders: 1, totalSpent: 2500, type: 'new' },
  ];

  const customerData = {
    totalCustomers: customers.length,
    newCustomers: customers.filter(c => c.type === 'new').length,
    returningCustomers: customers.filter(c => c.type === 'returning').length,
    vipCustomers: customers.filter(c => c.type === 'vip').length,
    averageOrderValue: Math.round(customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.reduce((acc, c) => acc + c.orders, 0)),
    topCustomers: customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3).map(c => ({ name: c.name, spent: c.totalSpent }))
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ลูกค้า</h1>
          <p className="mt-2 text-gray-600">จัดการข้อมูลลูกค้าของคุณ</p>
        </div>
        <div className="flex gap-4">
          <AIAnalysisButton
            page="customers"
            action="analyze_behavior"
            data={customerData}
            buttonText="ให้ AI วิเคราะห์พฤติกรรมลูกค้า"
          />
          <button className="flex items-center gap-2 rounded-lg bg-sakura-500 px-4 py-2 text-white hover:bg-sakura-600">
            <UserPlus className="h-4 w-4" />
            เพิ่มลูกค้า
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <Users className="h-8 w-8 text-blue-500" />
          <p className="mt-4 text-2xl font-bold">{customers.length}</p>
          <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <UserPlus className="h-8 w-8 text-green-500" />
          <p className="mt-4 text-2xl font-bold">{customerData.newCustomers}</p>
          <p className="text-sm text-gray-600">ลูกค้าใหม่</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <Users className="h-8 w-8 text-purple-500" />
          <p className="mt-4 text-2xl font-bold">{customerData.returningCustomers}</p>
          <p className="text-sm text-gray-600">ลูกค้าประจำ</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <Star className="h-8 w-8 text-yellow-500" />
          <p className="mt-4 text-2xl font-bold">{customerData.vipCustomers}</p>
          <p className="text-sm text-gray-600">ลูกค้า VIP</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาลูกค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ชื่อ</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">อีเมล</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">โทรศัพท์</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">จำนวนออเดอร์</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ยอดซื้อรวม</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ประเภท</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{customer.name}</td>
                <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                <td className="px-6 py-4">{customer.orders}</td>
                <td className="px-6 py-4">฿{customer.totalSpent.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    customer.type === 'vip' ? 'bg-yellow-100 text-yellow-700' :
                    customer.type === 'returning' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {customer.type === 'vip' ? 'VIP' : customer.type === 'returning' ? 'ลูกค้าประจำ' : 'ลูกค้าใหม่'}
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
