'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

export default function CampaignSettingsPage() {
  const { user } = useAuthStore();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState({
    facebook: {
      appId: '',
      appSecret: '',
      accessToken: '',
    },
    google: {
      clientId: '',
      clientSecret: '',
      developerToken: '',
      refreshToken: '',
    },
    tiktok: {
      appId: '',
      secret: '',
      accessToken: '',
    },
    line: {
      channelId: '',
      channelSecret: '',
      accessToken: '',
    },
  });

  const [testResults, setTestResults] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    facebook: 'idle',
    google: 'idle',
    tiktok: 'idle',
    line: 'idle',
  });

  useEffect(() => {
    // โหลดค่าจาก localStorage (ในการใช้งานจริงควรเก็บใน backend ที่เข้ารหัส)
    const savedKeys = localStorage.getItem('adPlatformKeys');
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
        toast.info('โหลดการตั้งค่าที่บันทึกไว้');
      } catch (error) {
        console.error('Error loading saved keys:', error);
      }
    }
  }, []);

  const handleSave = (platform: string) => {
    localStorage.setItem('adPlatformKeys', JSON.stringify(apiKeys));
    toast.success(`บันทึกการตั้งค่า ${platform} สำเร็จ`);
  };

  const handleTest = async (platform: string) => {
    setTestResults({ ...testResults, [platform]: 'testing' });

    // จำลองการทดสอบ API (ในการใช้งานจริงควรเรียก backend เพื่อทดสอบ)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // สุ่มผลลัพธ์ (ในการใช้งานจริงจะได้ผลจริงจาก API)
    const isSuccess = Math.random() > 0.3;
    setTestResults({ ...testResults, [platform]: isSuccess ? 'success' : 'error' });

    if (isSuccess) {
      toast.success(`${platform} เชื่อมต่อสำเร็จ`);
    } else {
      toast.error(`${platform} เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบ API Keys`);
    }
  };

  const toggleShowSecret = (platform: string) => {
    setShowSecrets({ ...showSecrets, [platform]: !showSecrets[platform] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      case 'success':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ตั้งค่า API แพลตฟอร์มโฆษณา</h1>
        <p className="mt-2 text-gray-600">
          กำหนดค่า API Keys สำหรับการยิงโฆษณาแบบอัตโนมัติ
        </p>
      </div>

      {/* Warning */}
      <div className="mb-8 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 flex-shrink-0 text-orange-600" size={24} />
          <div>
            <h3 className="font-bold text-orange-800">คำเตือนความปลอดภัย</h3>
            <p className="mt-1 text-sm text-orange-700">
              API Keys มีความสำคัญและต้องรักษาเป็นความลับ ในสภาพแวดล้อมจริง ควรเก็บข้อมูลเหล่านี้ใน backend ที่เข้ารหัส
              ไม่ควรเก็บใน localStorage หรือ frontend
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Facebook Ads */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Facebook Ads</h2>
                <p className="text-sm text-gray-600">Meta Business API</p>
              </div>
            </div>
            {getStatusIcon(testResults.facebook)}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">App ID</label>
              <input
                type="text"
                value={apiKeys.facebook.appId}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, facebook: { ...apiKeys.facebook, appId: e.target.value } })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="123456789012345"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">App Secret</label>
              <div className="relative">
                <input
                  type={showSecrets.facebook ? 'text' : 'password'}
                  value={apiKeys.facebook.appSecret}
                  onChange={(e) =>
                    setApiKeys({
                      ...apiKeys,
                      facebook: { ...apiKeys.facebook, appSecret: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('facebook')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showSecrets.facebook ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Access Token</label>
              <div className="relative">
                <input
                  type={showSecrets.facebook ? 'text' : 'password'}
                  value={apiKeys.facebook.accessToken}
                  onChange={(e) =>
                    setApiKeys({
                      ...apiKeys,
                      facebook: { ...apiKeys.facebook, accessToken: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="EAAxxxxxxxxxx..."
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('facebook')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showSecrets.facebook ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSave('Facebook')}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white transition hover:bg-blue-600"
              >
                <Save size={18} />
                บันทึก
              </button>
              <button
                onClick={() => handleTest('facebook')}
                disabled={testResults.facebook === 'testing'}
                className="rounded-lg border-2 border-blue-500 px-6 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
              >
                {testResults.facebook === 'testing' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
              </button>
            </div>
          </div>
        </div>

        {/* Google Ads */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-3">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Google Ads</h2>
                <p className="text-sm text-gray-600">Google Ads API</p>
              </div>
            </div>
            {getStatusIcon(testResults.google)}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Client ID</label>
              <input
                type="text"
                value={apiKeys.google.clientId}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, google: { ...apiKeys.google, clientId: e.target.value } })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Client Secret</label>
              <div className="relative">
                <input
                  type={showSecrets.google ? 'text' : 'password'}
                  value={apiKeys.google.clientSecret}
                  onChange={(e) =>
                    setApiKeys({
                      ...apiKeys,
                      google: { ...apiKeys.google, clientSecret: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('google')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showSecrets.google ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Developer Token</label>
              <input
                type="text"
                value={apiKeys.google.developerToken}
                onChange={(e) =>
                  setApiKeys({
                    ...apiKeys,
                    google: { ...apiKeys.google, developerToken: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                placeholder="xxxxxxxxxxxxxxxx"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSave('Google')}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2 font-semibold text-white transition hover:bg-red-600"
              >
                <Save size={18} />
                บันทึก
              </button>
              <button
                onClick={() => handleTest('google')}
                disabled={testResults.google === 'testing'}
                className="rounded-lg border-2 border-red-500 px-6 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {testResults.google === 'testing' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
              </button>
            </div>
          </div>
        </div>

        {/* TikTok Ads */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-pink-100 p-3">
                <svg className="h-6 w-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">TikTok Ads</h2>
                <p className="text-sm text-gray-600">TikTok for Business API</p>
              </div>
            </div>
            {getStatusIcon(testResults.tiktok)}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">App ID</label>
              <input
                type="text"
                value={apiKeys.tiktok.appId}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, tiktok: { ...apiKeys.tiktok, appId: e.target.value } })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="1234567890123456"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Secret</label>
              <div className="relative">
                <input
                  type={showSecrets.tiktok ? 'text' : 'password'}
                  value={apiKeys.tiktok.secret}
                  onChange={(e) =>
                    setApiKeys({ ...apiKeys, tiktok: { ...apiKeys.tiktok, secret: e.target.value } })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSecret('tiktok')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showSecrets.tiktok ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSave('TikTok')}
                className="flex items-center gap-2 rounded-lg bg-pink-500 px-6 py-2 font-semibold text-white transition hover:bg-pink-600"
              >
                <Save size={18} />
                บันทึก
              </button>
              <button
                onClick={() => handleTest('tiktok')}
                disabled={testResults.tiktok === 'testing'}
                className="rounded-lg border-2 border-pink-500 px-6 py-2 font-semibold text-pink-600 transition hover:bg-pink-50 disabled:opacity-50"
              >
                {testResults.tiktok === 'testing' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
