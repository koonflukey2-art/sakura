'use client';

import { useAuthStore } from '@/store/auth';
import { Package, Wallet, ShoppingCart, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'ยอดขายวันนี้',
      value: '฿46,730',
      change: '+12.5%',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'กำไรสุทธิ',
      value: '฿12,340',
      change: '+8.2%',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'สต๊อกใกล้หมด',
      value: '5 รายการ',
      change: '-2',
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      title: 'งบคงเหลือ',
      value: '฿450,000',
      change: '-฿50,000',
      icon: Wallet,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">สวัสดี, {user?.name}</h1>
        <p className="mt-2 text-gray-600">ภาพรวมธุรกิจของคุณวันนี้</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.change}</p>
              </div>
              <div className={`rounded-full ${stat.color} p-3`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-800">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button className="rounded-lg border-2 border-sakura-200 bg-sakura-50 px-6 py-4 text-left transition hover:border-sakura-400">
            <h3 className="font-semibold text-sakura-700">เพิ่มคำสั่งซื้อใหม่</h3>
            <p className="mt-1 text-sm text-sakura-600">สร้างคำสั่งซื้อใหม่อย่างรวดเร็ว</p>
          </button>

          <button className="rounded-lg border-2 border-blue-200 bg-blue-50 px-6 py-4 text-left transition hover:border-blue-400">
            <h3 className="font-semibold text-blue-700">ตรวจสอบสต๊อก</h3>
            <p className="mt-1 text-sm text-blue-600">ดูสินค้าคงคลังและสต๊อกที่ใกล้หมด</p>
          </button>

          <button className="rounded-lg border-2 border-green-200 bg-green-50 px-6 py-4 text-left transition hover:border-green-400">
            <h3 className="font-semibold text-green-700">ดูรายงาน</h3>
            <p className="mt-1 text-sm text-green-600">วิเคราะห์ยอดขายและกำไร</p>
          </button>
        </div>
      </div>
    </div>
  );
}
