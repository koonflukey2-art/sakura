'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Sparkles, AlertCircle, TestTube } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<'openai' | 'gemini' | null>(null);

  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [hasOpenai, setHasOpenai] = useState(false);
  const [hasGemini, setHasGemini] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setOpenaiKey(data.openai || '');
      setGeminiKey(data.gemini || '');
      setHasOpenai(data.hasOpenai);
      setHasGemini(data.hasGemini);
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      toast.error('ไม่สามารถโหลด API keys ได้');
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          openaiKey: openaiKey && !openaiKey.includes('...') ? openaiKey : undefined,
          geminiKey: geminiKey && !geminiKey.includes('...') ? geminiKey : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save API keys');
      }

      const data = await response.json();
      toast.success(data.message || 'บันทึก API Keys สำเร็จ!');

      // Reload the keys to show masked versions
      await fetchApiKeys();
    } catch (error: any) {
      console.error('Error saving API keys:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (provider: 'openai' | 'gemini') => {
    const apiKey = provider === 'openai' ? openaiKey : geminiKey;

    // Check if key is empty or masked
    if (!apiKey || apiKey.includes('...')) {
      toast.error(`กรุณาใส่ ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API Key ที่ถูกต้อง`);
      return;
    }

    setTesting(provider);

    try {
      const response = await fetch('http://localhost:3001/api/settings/test-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          apiKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'ทดสอบการเชื่อมต่อสำเร็จ!');
      } else {
        toast.error(data.message || 'ทดสอบการเชื่อมต่อล้มเหลว');
      }
    } catch (error: any) {
      console.error('Error testing API key:', error);
      toast.error('เกิดข้อผิดพลาดในการทดสอบ');
    } finally {
      setTesting(null);
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

      {/* Info Box */}
      <div className="mb-6 rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-500 p-3">
            <Key className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900">เกี่ยวกับ API Keys</h3>
            <p className="mt-2 text-sm text-blue-800">
              API Keys จะถูกเก็บไว้ในไฟล์ .env ของ server และจะถูกใช้งานเมื่อเรียกใช้ AI
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

      {/* Warning if no keys set */}
      {!hasOpenai && !hasGemini && (
        <div className="mb-6 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div className="text-yellow-800">
            <strong>คำเตือน:</strong> ยังไม่มี API keys ถูกตั้งค่า AI features จะไม่สามารถใช้งานได้
          </div>
        </div>
      )}

      {/* OpenAI Settings */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-3">
            <Sparkles className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">OpenAI (ChatGPT)</h2>
            <p className="text-sm text-gray-600">GPT-4 และ GPT-3.5 Turbo</p>
          </div>
          {hasOpenai && (
            <div className="ml-auto">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ ตั้งค่าแล้ว
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              API Key
            </label>
            <input
              type="text"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
            />
            {openaiKey.includes('...') && (
              <p className="mt-1 text-xs text-gray-500">
                💡 API key ถูก mask เพื่อความปลอดภัย ใส่ key ใหม่เพื่ออัปเดต
              </p>
            )}
          </div>

          <button
            onClick={() => handleTest('openai')}
            disabled={loading || testing !== null || !openaiKey || openaiKey.includes('...')}
            className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <TestTube size={18} />
            {testing === 'openai' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </button>
        </div>
      </div>

      {/* Gemini Settings */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3">
            <Sparkles className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Google Gemini</h2>
            <p className="text-sm text-gray-600">Gemini Pro</p>
          </div>
          {hasGemini && (
            <div className="ml-auto">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                ✓ ตั้งค่าแล้ว
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              API Key
            </label>
            <input
              type="text"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AI..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
            />
            {geminiKey.includes('...') && (
              <p className="mt-1 text-xs text-gray-500">
                💡 API key ถูก mask เพื่อความปลอดภัย ใส่ key ใหม่เพื่อออัปเดต
              </p>
            )}
          </div>

          <button
            onClick={() => handleTest('gemini')}
            disabled={loading || testing !== null || !geminiKey || geminiKey.includes('...')}
            className="flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <TestTube size={18} />
            {testing === 'gemini' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || testing !== null}
          className="flex items-center gap-2 rounded-lg bg-sakura-500 px-8 py-3 font-semibold text-white transition hover:bg-sakura-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}
