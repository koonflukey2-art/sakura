'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function SettingsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    // Load existing keys from localStorage
    const savedOpenAI = localStorage.getItem('openai_api_key') || '';
    const savedGemini = localStorage.getItem('gemini_api_key') || '';
    setOpenaiKey(savedOpenAI);
    setGeminiKey(savedGemini);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      // Save to localStorage
      if (openaiKey) {
        localStorage.setItem('openai_api_key', openaiKey);
      } else {
        localStorage.removeItem('openai_api_key');
      }

      if (geminiKey) {
        localStorage.setItem('gemini_api_key', geminiKey);
      } else {
        localStorage.removeItem('gemini_api_key');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOpenAI = async () => {
    if (!openaiKey) {
      alert('กรุณาใส่ OpenAI API Key');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        '/ai/execute',
        {
          provider: 'gpt',
          page: 'settings',
          action: 'test',
          customPrompt: 'ทดสอบการเชื่อมต่อ กรุณาตอบกลับว่า "ระบบทำงานปกติ" เป็นภาษาไทย',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-OpenAI-Key': openaiKey,
          },
        }
      );

      alert('✅ ทดสอบสำเร็จ!\n\n' + response.data.response);
    } catch (err: any) {
      alert('❌ ทดสอบล้มเหลว: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTestGemini = async () => {
    if (!geminiKey) {
      alert('กรุณาใส่ Gemini API Key');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        '/ai/execute',
        {
          provider: 'gemini',
          page: 'settings',
          action: 'test',
          customPrompt: 'ทดสอบการเชื่อมต่อ กรุณาตอบกลับว่า "ระบบทำงานปกติ" เป็นภาษาไทย',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Gemini-Key': geminiKey,
          },
        }
      );

      alert('✅ ทดสอบสำเร็จ!\n\n' + response.data.response);
    } catch (err: any) {
      alert('❌ ทดสอบล้มเหลว: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ตั้งค่า AI</h1>
        <p className="mt-2 text-gray-600">
          กำหนดค่า API keys สำหรับ AI providers ต่างๆ
        </p>
      </div>

      {/* Alert Messages */}
      {saved && (
        <div className="mb-6 rounded-xl border-2 border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <Sparkles className="text-green-600" size={24} />
          <div className="text-green-800 font-semibold">บันทึกการตั้งค่าสำเร็จ!</div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-500 p-3">
            <Key className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">เกี่ยวกับ API Keys</h3>
            <p className="mt-2 text-sm text-blue-800">
              API Keys จะถูกเก็บไว้ในเครื่องของคุณ (localStorage) และจะถูกส่งไปยัง server
              เมื่อเรียกใช้ AI เท่านั้น
            </p>
            <div className="mt-3 space-y-2 text-sm text-blue-800">
              <div>
                • <strong>OpenAI (ChatGPT):</strong>{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  รับ API key ที่นี่
                </a>
              </div>
              <div>
                • <strong>Google Gemini:</strong>{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  รับ API key ที่นี่
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OpenAI Settings */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-3">
            <Sparkles className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">OpenAI (ChatGPT)</h2>
            <p className="text-sm text-gray-600">GPT-4 และ GPT-3.5 Turbo</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              API Key
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
            />
          </div>

          <button
            onClick={handleTestOpenAI}
            disabled={loading || !openaiKey}
            className="rounded-lg bg-green-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:bg-gray-300"
          >
            ทดสอบการเชื่อมต่อ
          </button>
        </div>
      </div>

      {/* Gemini Settings */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3">
            <Sparkles className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Google Gemini</h2>
            <p className="text-sm text-gray-600">Gemini Pro</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              API Key
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AI..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
            />
          </div>

          <button
            onClick={handleTestGemini}
            disabled={loading || !geminiKey}
            className="rounded-lg bg-purple-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-600 disabled:bg-gray-300"
          >
            ทดสอบการเชื่อมต่อ
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-sakura-500 px-8 py-3 font-semibold text-white transition hover:bg-sakura-600 disabled:bg-gray-400"
        >
          <Save size={20} />
          {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}
