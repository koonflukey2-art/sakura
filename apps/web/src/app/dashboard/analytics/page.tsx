'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { AIAnalysisButton } from '@/components/AIAnalysisButton';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('week');

  const metrics = [
    { label: 'รายได้รวม', value: '฿1,250,000', change: '+15.3%', trend: 'up', icon: DollarSign },
    { label: 'กำไรสุทธิ', value: '฿320,000', change: '+8.7%', trend: 'up', icon: TrendingUp },
    { label: 'จำนวนลูกค้า', value: '1,234', change: '+12.1%', trend: 'up', icon: Users },
    { label: 'ยอดขายเฉลี่ย', value: '฿1,013', change: '-2.4%', trend: 'down', icon: TrendingDown },
  ];

  const analyticsData = {
    revenue: 1250000,
    profit: 320000,
    customers: 1234,
    averageOrder: 1013,
    profitMargin: 25.6,
    topSellingDays: ['เสาร์', 'อาทิตย์', 'ศุกร์'],
    growthRate: 15.3,
    period: period
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">วิเคราะห์ข้อมูล</h1>
          <p className="mt-2 text-gray-600">ภาพรวมประสิทธิภาพธุรกิจ</p>
        </div>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border px-4 py-2"
          >
            <option value="day">วันนี้</option>
            <option value="week">สัปดาห์นี้</option>
            <option value="month">เดือนนี้</option>
            <option value="year">ปีนี้</option>
          </select>
          <AIAnalysisButton
            page="analytics"
            action="analyze_trends"
            data={analyticsData}
            buttonText="ให้ AI วิเคราะห์แนวโน้ม"
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <metric.icon className={`h-8 w-8 ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-800">{metric.value}</p>
            <p className="text-sm text-gray-600">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">กราฟรายได้</h3>
          <div className="flex h-64 items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">กราฟรายได้รายวัน</p>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">กราฟกำไร</h3>
          <div className="flex h-64 items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">กราฟกำไรรายวัน</p>
          </div>
        </div>
      </div>
    </div>
  );
}
