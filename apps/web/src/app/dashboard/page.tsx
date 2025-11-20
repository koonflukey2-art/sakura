'use client';

import { useAuthStore } from '@/store/auth';
import {
  Package,
  Wallet,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  AlertCircle,
  TrendingDown,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AIButton from '@/components/AIButton';

interface AISuggestion {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action?: string;
  actionLink?: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const stats = [
    {
      title: 'ยอดขายวันนี้',
      value: '฿46,730',
      change: '+12.5%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'กำไรสุทธิ',
      value: '฿12,340',
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'สต๊อกใกล้หมด',
      value: '5 รายการ',
      change: '-2',
      trend: 'down',
      icon: Package,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      title: 'งบคงเหลือ',
      value: '฿450,000',
      change: '-฿50,000',
      trend: 'neutral',
      icon: Wallet,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  // Load AI suggestions on mount
  useEffect(() => {
    loadAISuggestions();
  }, []);

  const loadAISuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      // Try to get AI suggestions from API
      const response = await api.post('/ai/execute', {
        provider: 'gemini',
        page: 'dashboard',
        action: 'get_suggestions',
        payload: {
          stats: stats,
          userRole: user?.role,
        },
      });

      // Parse AI response and create suggestions
      const suggestions: AISuggestion[] = [
        {
          type: 'warning',
          title: '⚠️ สินค้าใกล้หมด',
          message:
            'มีสินค้า 5 รายการที่ใกล้หมดสต๊อก ควรสั่งซื้อเพิ่มเพื่อไม่ให้เกิดการขาดสต๊อก',
          action: 'ดูรายการ',
          actionLink: '/dashboard/stock',
        },
        {
          type: 'success',
          title: '🎯 โอกาสทางการตลาด',
          message:
            'ยอดขายเพิ่มขึ้น 12.5% แนะนำให้เพิ่มงบโฆษณาเพื่อผลักดันยอดขายให้สูงขึ้น',
          action: 'ดูแคมเปญ',
          actionLink: '/dashboard/campaigns',
        },
        {
          type: 'info',
          title: '💡 คำแนะนำ',
          message:
            'กำไรเพิ่มขึ้น 8.2% ควรพิจารณาลงทุนในสินค้าขายดีเพื่อเพิ่มผลกำไร',
          action: 'ดูรายงาน',
          actionLink: '/dashboard/analytics',
        },
      ];

      setAiSuggestions(suggestions);
    } catch (error) {
      // Fallback to static suggestions if AI fails
      const fallbackSuggestions: AISuggestion[] = [
        {
          type: 'warning',
          title: '⚠️ สินค้าใกล้หมด',
          message:
            'มีสินค้า 5 รายการที่ใกล้หมดสต๊อก ควรสั่งซื้อเพิ่มเพื่อไม่ให้เกิดการขาดสต๊อก',
          action: 'ดูรายการ',
          actionLink: '/dashboard/stock',
        },
        {
          type: 'success',
          title: '🎯 โอกาสทางการตลาด',
          message:
            'ยอดขายเพิ่มขึ้น 12.5% แนะนำให้เพิ่มงบโฆษณาเพื่อผลักดันยอดขายให้สูงขึ้น',
          action: 'ดูแคมเปญ',
          actionLink: '/dashboard/campaigns',
        },
        {
          type: 'info',
          title: '💡 คำแนะนำ',
          message: 'กำไรเพิ่มขึ้น 8.2% ควรพิจารณาลงทุนในสินค้าขายดีเพื่อเพิ่มผลกำไร',
          action: 'ดูรายงาน',
          actionLink: '/dashboard/analytics',
        },
      ];
      setAiSuggestions(fallbackSuggestions);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getSuggestionStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-red-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          button: 'bg-orange-500 hover:bg-orange-600',
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          button: 'bg-green-500 hover:bg-green-600',
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          button: 'bg-blue-500 hover:bg-blue-600',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          button: 'bg-gray-500 hover:bg-gray-600',
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with AI Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
            สวัสดี, {user?.name}
          </h1>
          <p className="mt-2 text-lg text-gray-600">ภาพรวมธุรกิจของคุณวันนี้</p>
        </div>
        <AIButton
          page="dashboard"
          action="analyze_overview"
          buttonText="ให้ AI วิเคราะห์"
          variant="primary"
          size="lg"
          className="shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
        />
      </div>

      {/* AI Suggestions Section */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 p-1 shadow-xl">
        <div className="rounded-xl bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                <Sparkles className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">คำแนะนำจาก AI</h2>
            </div>
            <button
              onClick={loadAISuggestions}
              disabled={loadingSuggestions}
              className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50"
            >
              <Zap
                size={18}
                className={`${loadingSuggestions ? 'animate-spin' : 'group-hover:animate-pulse'}`}
              />
              รีเฟรช
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {aiSuggestions.map((suggestion, index) => {
              const styles = getSuggestionStyles(suggestion.type);
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-xl border-2 ${styles.border} ${styles.bg} p-5 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                >
                  <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-white opacity-20"></div>
                  <h3 className="mb-2 text-lg font-bold text-gray-800">{suggestion.title}</h3>
                  <p className="mb-4 text-sm text-gray-700">{suggestion.message}</p>
                  {suggestion.action && suggestion.actionLink && (
                    <button
                      onClick={() => router.push(suggestion.actionLink!)}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg ${styles.button} px-4 py-2 font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                    >
                      {suggestion.action}
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid with Modern Design */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background Gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 transition-opacity duration-300 group-hover:opacity-10`}
            ></div>

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="mt-2 flex items-center gap-2">
                  {stat.trend === 'up' && (
                    <TrendingUp size={16} className="text-green-600" />
                  )}
                  {stat.trend === 'down' && (
                    <TrendingDown size={16} className="text-red-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      stat.trend === 'up'
                        ? 'text-green-600'
                        : stat.trend === 'down'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>

              <div
                className={`rounded-2xl bg-gradient-to-br ${stat.color} p-4 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
              >
                <stat.icon className="text-white" size={28} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions with Modern Design */}
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-2">
            <Target className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">การดำเนินการด่วน</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="group relative overflow-hidden rounded-xl border-2 border-sakura-200 bg-gradient-to-br from-sakura-50 to-pink-50 p-6 text-left shadow-md transition-all duration-300 hover:scale-105 hover:border-sakura-400 hover:shadow-2xl"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-sakura-300 opacity-20 transition-transform duration-500 group-hover:scale-150"></div>
            <ShoppingCart className="mb-3 text-sakura-600" size={32} />
            <h3 className="mb-2 text-xl font-bold text-sakura-700">เพิ่มคำสั่งซื้อใหม่</h3>
            <p className="text-sm text-sakura-600">สร้างคำสั่งซื้อใหม่อย่างรวดเร็ว</p>
            <ArrowRight className="mt-3 text-sakura-500 transition-transform duration-300 group-hover:translate-x-2" />
          </button>

          <button
            onClick={() => router.push('/dashboard/stock')}
            className="group relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 text-left shadow-md transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:shadow-2xl"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-300 opacity-20 transition-transform duration-500 group-hover:scale-150"></div>
            <Package className="mb-3 text-blue-600" size={32} />
            <h3 className="mb-2 text-xl font-bold text-blue-700">ตรวจสอบสต๊อก</h3>
            <p className="text-sm text-blue-600">ดูสินค้าคงคลังและสต๊อกที่ใกล้หมด</p>
            <ArrowRight className="mt-3 text-blue-500 transition-transform duration-300 group-hover:translate-x-2" />
          </button>

          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="group relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-left shadow-md transition-all duration-300 hover:scale-105 hover:border-green-400 hover:shadow-2xl"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-green-300 opacity-20 transition-transform duration-500 group-hover:scale-150"></div>
            <TrendingUp className="mb-3 text-green-600" size={32} />
            <h3 className="mb-2 text-xl font-bold text-green-700">ดูรายงาน</h3>
            <p className="text-sm text-green-600">วิเคราะห์ยอดขายและกำไร</p>
            <ArrowRight className="mt-3 text-green-500 transition-transform duration-300 group-hover:translate-x-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
