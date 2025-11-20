'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, ArrowUp, Sparkles, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState(false);

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

  const handleAIAnalysis = async () => {
    if (!analytics) return;

    // Check for API keys in localStorage
    const openaiKey = localStorage.getItem('openai_api_key');
    const geminiKey = localStorage.getItem('gemini_api_key');

    if (!openaiKey && !geminiKey) {
      toast.error('กรุณาตั้งค่า API Keys ที่หน้า Settings ก่อนใช้งาน AI');
      return;
    }

    setAiAnalyzing(true);
    setShowAiModal(true);

    try {
      const headers: any = {};
      const provider = geminiKey ? 'gemini' : 'gpt';

      // Add API key to headers
      if (provider === 'gpt' && openaiKey) {
        headers['x-openai-key'] = openaiKey;
      } else if (provider === 'gemini' && geminiKey) {
        headers['x-gemini-key'] = geminiKey;
      }

      const response = await api.post(
        '/ai/execute',
        {
          provider,
          page: 'analytics',
          action: 'explain_profit_trend',
          payload: {
            period,
            revenue: analytics.revenue,
            orders: analytics.orders,
            customers: analytics.customers,
            campaigns: analytics.campaigns,
            stock: analytics.stock,
          },
          customPrompt: `วิเคราะห์ข้อมูลธุรกิจของฉันในช่วง ${period === 'day' ? 'วันนี้' : period === 'week' ? 'สัปดาห์นี้' : period === 'month' ? 'เดือนนี้' : 'ปีนี้'} และให้คำแนะนำที่เป็นประโยชน์ในการปรับปรุงธุรกิจ โดยเฉพาะ:
1. วิเคราะห์สถานะกำไร/ขาดทุน และสาเหตุ
2. แนะนำวิธีเพิ่มรายได้หรือลดต้นทุน
3. ประเมิน ROI ของแคมเปญโฆษณา
4. แนะนำกลยุทธ์สำหรับลูกค้าใหม่และลูกค้าเก่า
5. ข้อเสนอแนะอื่นๆ ที่เป็นประโยชน์`,
        },
        { headers }
      );

      setAiAnalysis(response.data.response);
      toast.success('AI วิเคราะห์เสร็จแล้ว!');
    } catch (error: any) {
      console.error('Error analyzing with AI:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการวิเคราะห์');
      setShowAiModal(false);
    } finally {
      setAiAnalyzing(false);
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
        <div className="flex gap-3">
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
          <button
            onClick={handleAIAnalysis}
            disabled={aiAnalyzing}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                กำลังวิเคราะห์...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                ให้ AI วิเคราะห์
              </>
            )}
          </button>
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

      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-800">📊 แนวโน้มรายได้</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={generateTrendData(period)}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="รายได้"
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorCost)"
                name="ต้นทุน"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Performance Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-800">🎯 ประสิทธิภาพแคมเปญ</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { platform: 'Facebook', roi: 125, spent: 15000 },
                { platform: 'Google', roi: 98, spent: 12000 },
                { platform: 'TikTok', roi: 156, spent: 8000 },
                { platform: 'Instagram', roi: 87, spent: 10000 },
              ]}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="platform" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="roi" fill="#8b5cf6" name="ROI (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Distribution */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-800">👥 กลุ่มลูกค้า</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'ลูกค้าใหม่', value: analytics.customers.new },
                  { name: 'ลูกค้าเก่า', value: analytics.customers.returning },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#3b82f6" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Profit Trend */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-800">💰 กำไรรายวัน (7 วันล่าสุด)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={generateDailyProfitData()}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                name="กำไร (฿)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Sparkles size={24} />
                <h2 className="text-2xl font-bold">การวิเคราะห์จาก AI</h2>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="rounded-lg p-2 transition hover:bg-white/20"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {aiAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="mb-4 animate-spin text-purple-600" size={48} />
                  <p className="text-lg text-gray-600">AI กำลังวิเคราะห์ข้อมูลของคุณ...</p>
                  <p className="mt-2 text-sm text-gray-500">อาจใช้เวลาสักครู่</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800">{aiAnalysis}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!aiAnalyzing && (
              <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="rounded-lg bg-gray-200 px-6 py-2 font-semibold text-gray-800 transition hover:bg-gray-300"
                >
                  ปิด
                </button>
                <button
                  onClick={handleAIAnalysis}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 font-semibold text-white transition hover:scale-105"
                >
                  <Sparkles size={18} />
                  วิเคราะห์อีกครั้ง
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for generating chart data
function generateTrendData(period: string) {
  const baseData = {
    day: [
      { name: '00:00', revenue: 0, cost: 0 },
      { name: '04:00', revenue: 2000, cost: 1200 },
      { name: '08:00', revenue: 5000, cost: 3000 },
      { name: '12:00', revenue: 12000, cost: 7000 },
      { name: '16:00', revenue: 18000, cost: 10000 },
      { name: '20:00', revenue: 24000, cost: 14000 },
      { name: '23:59', revenue: 28000, cost: 16000 },
    ],
    week: [
      { name: 'จันทร์', revenue: 25000, cost: 15000 },
      { name: 'อังคาร', revenue: 32000, cost: 19000 },
      { name: 'พุธ', revenue: 28000, cost: 17000 },
      { name: 'พฤหัส', revenue: 35000, cost: 20000 },
      { name: 'ศุกร์', revenue: 42000, cost: 24000 },
      { name: 'เสาร์', revenue: 48000, cost: 27000 },
      { name: 'อาทิตย์', revenue: 45000, cost: 26000 },
    ],
    month: [
      { name: 'สัปดาห์ 1', revenue: 120000, cost: 70000 },
      { name: 'สัปดาห์ 2', revenue: 145000, cost: 85000 },
      { name: 'สัปดาห์ 3', revenue: 132000, cost: 78000 },
      { name: 'สัปดาห์ 4', revenue: 158000, cost: 92000 },
    ],
    year: [
      { name: 'ม.ค.', revenue: 480000, cost: 280000 },
      { name: 'ก.พ.', revenue: 520000, cost: 305000 },
      { name: 'มี.ค.', revenue: 545000, cost: 320000 },
      { name: 'เม.ย.', revenue: 498000, cost: 295000 },
      { name: 'พ.ค.', revenue: 580000, cost: 340000 },
      { name: 'มิ.ย.', revenue: 620000, cost: 365000 },
      { name: 'ก.ค.', revenue: 595000, cost: 350000 },
      { name: 'ส.ค.', revenue: 640000, cost: 375000 },
      { name: 'ก.ย.', revenue: 615000, cost: 360000 },
      { name: 'ต.ค.', revenue: 670000, cost: 390000 },
      { name: 'พ.ย.', revenue: 690000, cost: 405000 },
      { name: 'ธ.ค.', revenue: 720000, cost: 420000 },
    ],
  };

  return baseData[period as keyof typeof baseData] || baseData.month;
}

function generateDailyProfitData() {
  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  return days.map((day) => ({
    day,
    profit: Math.floor(Math.random() * 20000) + 5000,
  }));
}
