'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import {
  Sparkles,
  Send,
  Loader2,
  History,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Target,
  AlertCircle,
  MessageSquare,
  Settings as SettingsIcon,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface QuickPrompt {
  title: string;
  prompt: string;
  category: string;
  icon: any;
  color: string;
}

export default function AICenterPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'gpt' | 'gemini'>('gemini');
  const [context, setContext] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  const quickPrompts: QuickPrompt[] = [
    {
      title: 'วิเคราะห์ยอดขายโดยรวม',
      prompt: 'วิเคราะห์ยอดขายในช่วง 30 วันที่ผ่านมา แล้วให้คำแนะนำว่าควรปรับปรุงอะไรบ้าง',
      category: 'analytics',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'ตรวจสอบสต๊อกสินค้า',
      prompt:
        'แนะนำว่าสินค้าใดที่ควรสั่งเพิ่ม สินค้าใดที่นอนกอง และควรจัดการอย่างไร',
      category: 'stock',
      icon: Package,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'วิเคราะห์งบประมาณ',
      prompt:
        'วิเคราะห์การใช้งบประมาณปัจจุบัน และแนะนำวิธีจัดสรรงบที่เหมาะสม',
      category: 'budget',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'ปรับปรุงแคมเปญโฆษณา',
      prompt:
        'วิเคราะห์ผลลัพธ์แคมเปญโฆษณาและแนะนำวิธีปรับปรุงให้มี ROI ที่ดีขึ้น',
      category: 'campaigns',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'สรุปภาพรวมธุรกิจ',
      prompt:
        'สรุปภาพรวมธุรกิจในช่วงสัปดาห์นี้ ทั้งยอดขาย กำไร และจุดที่ควรพัฒนา',
      category: 'all',
      icon: BarChart3,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'วิเคราะห์พฤติกรรมลูกค้า',
      prompt:
        'วิเคราะห์พฤติกรรมการซื้อของลูกค้าและแนะนำกลยุทธ์การตลาดที่เหมาะสม',
      category: 'analytics',
      icon: MessageSquare,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  useEffect(() => {
    loadAIHistory();
  }, []);

  const loadAIHistory = async () => {
    try {
      const response = await api.get('/ai/logs?limit=10');
      setAiLogs(response.data);
    } catch (error) {
      console.error('Failed to load AI history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get API keys from localStorage
      const openaiKey = localStorage.getItem('openai_api_key');
      const geminiKey = localStorage.getItem('gemini_api_key');

      // Check if selected provider has API key
      if (provider === 'gpt' && !openaiKey) {
        const errorMessage: Message = {
          role: 'ai',
          content:
            '❌ ไม่พบ OpenAI API Key กรุณาตั้งค่าใน Settings ก่อนใช้งาน',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setLoading(false);
        return;
      }

      if (provider === 'gemini' && !geminiKey) {
        const errorMessage: Message = {
          role: 'ai',
          content:
            '❌ ไม่พบ Gemini API Key กรุณาตั้งค่าใน Settings ก่อนใช้งาน',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setLoading(false);
        return;
      }

      const headers: any = {};

      // Add API key to request header (lowercase as expected by backend)
      if (provider === 'gpt' && openaiKey) {
        headers['x-openai-key'] = openaiKey;
      } else if (provider === 'gemini' && geminiKey) {
        headers['x-gemini-key'] = geminiKey;
      }

      const response = await api.post(
        '/ai/execute',
        {
          provider,
          page: 'ai-center',
          action: 'general_query',
          payload: {
            context,
            previousMessages: messages.slice(-5), // Last 5 messages for context
          },
          customPrompt: input,
        },
        { headers }
      );

      const aiMessage: Message = {
        role: 'ai',
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      loadAIHistory(); // Reload history
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'ai',
        content:
          error.response?.data?.message ||
          'เกิดข้อผิดพลาดในการเรียกใช้ AI กรุณาลองใหม่อีกครั้ง',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Check if user has API keys
  const hasOpenAI = !!localStorage.getItem('openai_api_key');
  const hasGemini = !!localStorage.getItem('gemini_api_key');
  const hasAnyKey = hasOpenAI || hasGemini;

  return (
    <div className="h-[calc(100vh-8rem)] space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 p-1 shadow-2xl">
        <div className="rounded-xl bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-4 shadow-lg">
                <Sparkles className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">AI Center</h1>
                <p className="mt-1 text-gray-600">
                  ถามคำถามอะไรก็ได้เกี่ยวกับธุรกิจของคุณ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Provider Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setProvider('gpt')}
                  className={`rounded-lg px-4 py-2 font-semibold transition-all duration-300 ${
                    provider === 'gpt'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  GPT
                </button>
                <button
                  onClick={() => setProvider('gemini')}
                  className={`rounded-lg px-4 py-2 font-semibold transition-all duration-300 ${
                    provider === 'gemini'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Gemini
                </button>
              </div>

              {/* History Toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105"
              >
                <History size={20} />
                {showHistory ? 'ซ่อนประวัติ' : 'แสดงประวัติ'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Warning */}
      {!hasAnyKey && (
        <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-orange-500 p-3">
              <AlertCircle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900">
                ⚠️ ยังไม่ได้ตั้งค่า API Key
              </h3>
              <p className="mt-2 text-sm text-orange-800">
                คุณต้องตั้งค่า API Key สำหรับ OpenAI หรือ Google Gemini ก่อนที่จะใช้ AI Center
                <br />
                ไปที่หน้า <strong>ตั้งค่า AI</strong> เพื่อเพิ่ม API Key ของคุณ
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <SettingsIcon size={20} />
                ไปตั้งค่า API Key
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Specific Provider Warning */}
      {hasAnyKey && (
        <>
          {provider === 'gpt' && !hasOpenAI && (
            <div className="rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 shadow-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-yellow-900">
                    <strong>ไม่พบ OpenAI API Key</strong> - กรุณาตั้งค่าใน{' '}
                    <Link href="/dashboard/settings" className="underline font-semibold hover:text-yellow-700">
                      หน้าตั้งค่า
                    </Link>{' '}
                    หรือเปลี่ยนไปใช้ Gemini แทน
                  </p>
                </div>
              </div>
            </div>
          )}
          {provider === 'gemini' && !hasGemini && (
            <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-purple-600 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-purple-900">
                    <strong>ไม่พบ Gemini API Key</strong> - กรุณาตั้งค่าใน{' '}
                    <Link href="/dashboard/settings" className="underline font-semibold hover:text-purple-700">
                      หน้าตั้งค่า
                    </Link>{' '}
                    หรือเปลี่ยนไปใช้ GPT แทน
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Chat Area */}
        <div className="flex flex-col lg:col-span-2">
          {/* Quick Prompts */}
          {messages.length === 0 && (
            <div className="mb-4 rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
                <Zap className="text-yellow-500" size={24} />
                คำถามยอดนิยม
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 text-left shadow-md transition-all duration-300 hover:scale-105 hover:border-purple-300 hover:shadow-xl"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${prompt.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
                    ></div>
                    <div className="relative flex items-start gap-3">
                      <div
                        className={`rounded-lg bg-gradient-to-br ${prompt.color} p-2 shadow-md`}
                      >
                        <prompt.icon className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">
                          {prompt.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                          {prompt.prompt}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="mb-4 flex-1 space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-full bg-gradient-to-br from-purple-100 to-pink-100 p-8">
                  <MessageSquare className="text-purple-600" size={64} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-gray-800">
                  เริ่มต้นการสนทนากับ AI
                </h3>
                <p className="mt-2 text-gray-600">
                  เลือกคำถามด้านบน หรือพิมพ์คำถามของคุณเอง
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`group relative max-w-[80%] rounded-2xl px-6 py-4 shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white text-gray-800'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {message.role === 'ai' && (
                        <Sparkles className="text-purple-600" size={16} />
                      )}
                      <span className="text-xs font-semibold opacity-75">
                        {message.role === 'user' ? 'คุณ' : 'AI Assistant'}
                      </span>
                      <span className="text-xs opacity-50">
                        {message.timestamp.toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                    {message.role === 'ai' && (
                      <button
                        onClick={() =>
                          copyToClipboard(message.content, index)
                        }
                        className="absolute right-2 top-2 rounded-lg bg-white/10 p-2 opacity-0 transition-opacity hover:bg-white/20 group-hover:opacity-100"
                      >
                        {copiedIndex === index ? (
                          <Check size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} className="text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin text-purple-600" size={20} />
                    <span className="text-sm text-purple-800">
                      AI กำลังคิด...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="rounded-xl bg-white p-4 shadow-lg">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="พิมพ์คำถามของคุณที่นี่..."
                disabled={loading}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 transition-all duration-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send
                    size={20}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                )}
                ส่ง
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Context Selection */}
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 font-bold text-gray-800">บริบทการวิเคราะห์</h3>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 transition-all duration-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-200"
            >
              <option value="all">ทั้งหมด</option>
              <option value="stock">สต๊อกสินค้า</option>
              <option value="sales">ยอดขาย</option>
              <option value="budget">งบประมาณ</option>
              <option value="campaigns">แคมเปญโฆษณา</option>
              <option value="analytics">การวิเคราะห์</option>
            </select>
          </div>

          {/* History */}
          {showHistory && (
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-800">
                <History size={20} />
                ประวัติการใช้งาน
              </h3>
              <div className="space-y-3">
                {aiLogs.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">
                    ยังไม่มีประวัติการใช้งาน
                  </p>
                ) : (
                  aiLogs.slice(0, 5).map((log, index) => (
                    <div
                      key={index}
                      className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-300 hover:border-purple-300 hover:bg-purple-50"
                      onClick={() => setInput(log.requestPrompt)}
                    >
                      <p className="line-clamp-2 text-xs text-gray-700">
                        {log.requestPrompt}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString('th-TH')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-lg">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="text-blue-600" size={20} />
              <h3 className="font-bold text-blue-900">เคล็ดลับ</h3>
            </div>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• ถามคำถามที่ชัดเจนเพื่อผลลัพธ์ที่ดีขึ้น</li>
              <li>• เลือกบริบทที่เหมาะสมกับคำถามของคุณ</li>
              <li>• ใช้คำถามยอดนิยมเป็นแนวทาง</li>
              <li>• AI จะจำบทสนทนาล่าสุดได้ 5 ข้อความ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
