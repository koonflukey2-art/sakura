'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface AIButtonProps {
  page: string;
  action: string;
  payload?: any;
  defaultPrompt?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AIButton({
  page,
  action,
  payload,
  defaultPrompt,
  buttonText = 'ถาม AI',
  variant = 'primary',
  size = 'md',
  className = '',
}: AIButtonProps) {
  const { token } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(defaultPrompt || '');
  const [response, setResponse] = useState('');
  const [provider, setProvider] = useState<'gpt' | 'gemini'>('gpt');
  const [error, setError] = useState('');

  const variantClasses = {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white',
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const handleExecuteAI = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      // Get API keys from localStorage
      const openaiKey = localStorage.getItem('openai_api_key');
      const geminiKey = localStorage.getItem('gemini_api_key');

      // Check if selected provider has API key
      if (provider === 'gpt' && !openaiKey) {
        setError('❌ ไม่พบ OpenAI API Key กรุณาตั้งค่าใน Settings');
        setLoading(false);
        return;
      }

      if (provider === 'gemini' && !geminiKey) {
        setError('❌ ไม่พบ Gemini API Key กรุณาตั้งค่าใน Settings');
        setLoading(false);
        return;
      }

      const headers: any = {
        Authorization: `Bearer ${token}`,
      };

      // Add API key to request header
      if (provider === 'gpt' && openaiKey) {
        headers['X-OpenAI-Key'] = openaiKey;
      } else if (provider === 'gemini' && geminiKey) {
        headers['X-Gemini-Key'] = geminiKey;
      }

      const res = await api.post(
        '/ai/execute',
        {
          provider,
          page,
          action,
          payload,
          customPrompt: customPrompt || undefined,
        },
        { headers }
      );

      setResponse(res.data.response);
    } catch (err: any) {
      console.error('AI execution error:', err);
      setError(
        err.response?.data?.message ||
          'เกิดข้อผิดพลาดในการเรียกใช้ AI กรุณาตรวจสอบ API Key และลองใหม่อีกครั้ง'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* AI Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 rounded-lg font-semibold transition ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        <Sparkles size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        {buttonText}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-white" size={28} />
                <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-white transition hover:bg-white hover:bg-opacity-20"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
              {/* Provider Selection */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  เลือก AI Provider
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setProvider('gpt')}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 font-semibold transition ${
                      provider === 'gpt'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-green-300'
                    }`}
                  >
                    OpenAI (GPT)
                  </button>
                  <button
                    onClick={() => setProvider('gemini')}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 font-semibold transition ${
                      provider === 'gemini'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300'
                    }`}
                  >
                    Google Gemini
                  </button>
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  คำสั่ง / คำถามสำหรับ AI
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="พิมพ์คำถามหรือคำสั่งให้ AI ช่วยวิเคราะห์..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <p className="mt-2 text-xs text-gray-500">
                  หากไม่ระบุ ระบบจะใช้คำถามเริ่มต้นสำหรับหน้านี้
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Response */}
              {response && (
                <div className="mb-6 rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={20} />
                    <h3 className="font-bold text-purple-900">คำตอบจาก AI:</h3>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-gray-800">{response}</div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="mb-6 flex items-center justify-center gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <p className="text-lg font-semibold text-blue-800">AI กำลังประมวลผล...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg px-6 py-2 font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                ปิด
              </button>
              <button
                onClick={handleExecuteAI}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-2 font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    กำลังประมวลผล...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    ถาม AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
