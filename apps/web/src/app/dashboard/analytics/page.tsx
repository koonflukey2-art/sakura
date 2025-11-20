'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, ArrowUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Analytics {
  revenue: {
    total: number;
    cost: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    campaignSpent: number;
  };
  orders: {
    total: number;
    avgOrderValue: number;
  };
  customers: {
    new: number;
    returning: number;
    total: number;
  };
  campaigns: {
    total: number;
    spent: number;
    revenue: number;
    roi: number;
  };
  stock: {
    lowStockItems: number;
  };
}

export default function AnalyticsPage() {
  const { token } = useAuthStore();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/overview', {
        headers: { Authorization: `Bearer ${token}` },
        params: { period },
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  const isProfit = analytics.revenue.netProfit >= 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">วิเคราะห์ธุรกิจ</h1>
          <p className="mt-2 text-gray-600">ภาพรวมผลกำไรและประสิทธิภาพ</p>
        </div>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 font-semibold transition ${
                period === p
                  ? 'bg-sakura-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p === 'day' ? 'วันนี้' : p === 'week' ? 'สัปดาห์นี้' : p === 'month' ? 'เดือนนี้' : 'ปีนี้'}
            </button>
          ))}
        </div>
      </div>

      {/* Profit/Loss Card */}
      <div className={`mb-8 rounded-2xl p-8 ${isProfit ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white shadow-xl`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold opacity-90">กำไรสุทธิ (หักค่าโฆษณา)</h2>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-bold">
                ฿{analytics.revenue.netProfit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
              {isProfit ? (
                <TrendingUp size={32} className="text-green-200" />
              ) : (
                <TrendingDown size={32} className="text-red-200" />
              )}
            </div>
            <p className="mt-3 text-white/80">
              {isProfit ? '🎉 ทำกำไร!' : '⚠️ ขาดทุน - ต้องปรับแผน'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">อัตรากำไร</div>
            <div className="mt-1 text-3xl font-bold">
              {analytics.revenue.profitMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยอดขายรวม</p>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                ฿{analytics.revenue.total.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยอดออเดอร์</p>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {analytics.orders.total} รายการ
              </p>
              <p className="mt-1 text-xs text-gray-500">
                เฉลี่ย ฿{analytics.orders.avgOrderValue.toLocaleString()}/รายการ
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <ShoppingBag className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {analytics.customers.total} คน
              </p>
              <p className="mt-1 text-xs text-green-600">
                +{analytics.customers.new} ลูกค้าใหม่
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ROI แคมเปญ</p>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {analytics.campaigns.roi.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-gray-500">
                ใช้ไป ฿{analytics.campaigns.spent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <ArrowUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Breakdown */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-800">รายละเอียดรายได้</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ยอดขายรวม</span>
              <span className="font-semibold text-gray-800">
                ฿{analytics.revenue.total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ต้นทุนสินค้า</span>
              <span className="font-semibold text-red-600">
                -฿{analytics.revenue.cost.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-gray-600">กำไรจากการขาย</span>
              <span className="font-semibold text-green-600">
                ฿{analytics.revenue.grossProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ค่าโฆษณา</span>
              <span className="font-semibold text-red-600">
                -฿{analytics.revenue.campaignSpent.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-2 pt-4">
              <span className="font-bold text-gray-800">กำไรสุทธิ</span>
              <span className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                ฿{analytics.revenue.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-800">ข้อมูลลูกค้า</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">ลูกค้าใหม่</span>
                <span className="font-semibold text-gray-800">
                  {analytics.customers.new} คน ({((analytics.customers.new / analytics.customers.total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(analytics.customers.new / analytics.customers.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">ลูกค้าเก่า (กลับมาซื้อ)</span>
                <span className="font-semibold text-gray-800">
                  {analytics.customers.returning} คน ({((analytics.customers.returning / analytics.customers.total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(analytics.customers.returning / analytics.customers.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600">📊 Insights</p>
              <p className="mt-2 text-sm text-gray-700">
                {analytics.customers.returning > analytics.customers.new
                  ? '✅ ลูกค้าประจำกลับมาซื้อเยอะ - แสดงถึงความพึงพอใจสูง'
                  : '💡 ลูกค้าใหม่มาก - ควรมีกลยุทธ์รักษาลูกค้า'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions (Placeholder) */}
      <div className="mt-6 rounded-xl border-2 border-sakura-200 bg-sakura-50 p-6">
        <h3 className="mb-4 text-lg font-bold text-sakura-800">🤖 คำแนะนำจาก AI</h3>
        <div className="space-y-2 text-sm text-sakura-700">
          {isProfit ? (
            <>
              <p>✅ ธุรกิจทำกำไร! แนะนำให้ขยายงบโฆษณาเพิ่ม 15-20% เพื่อเพิ่มยอดขาย</p>
              <p>💡 ลูกค้ากลับมาซื้อซ้ำสูง - พิจารณาทำโปรแกรม Loyalty เพื่อรักษาฐานลูกค้า</p>
            </>
          ) : (
            <>
              <p>⚠️ กำไรติดลบ - แนะนำลดค่าโฆษณาชั่วคราว และเน้นขายสินค้าที่กำไรสูง</p>
              <p>💡 ตรวจสอบต้นทุนสินค้า - อาจมีสินค้าบางรายการที่ขายขาดทุน</p>
            </>
          )}
          <p>📈 ค่าเฉลี่ยต่อออเดอร์: ฿{analytics.orders.avgOrderValue.toLocaleString()} - ลองเพิ่ม upselling/cross-selling</p>
        </div>
      </div>
    </div>
  );
}
