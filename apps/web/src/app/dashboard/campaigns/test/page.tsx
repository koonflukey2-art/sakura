'use client';

import { useState } from 'react';
import { Play, StopCircle, BarChart3, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignTestPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('FACEBOOK');
  const [isRunning, setIsRunning] = useState(false);
  const [testData, setTestData] = useState({
    adName: '',
    budget: '',
    duration: '3',
    targetAudience: 'all',
    objective: 'conversions',
  });

  const [testResults, setTestResults] = useState<any>(null);

  const platforms = [
    { id: 'FACEBOOK', name: 'Facebook', color: 'blue' },
    { id: 'GOOGLE', name: 'Google', color: 'red' },
    { id: 'TIKTOK', name: 'TikTok', color: 'pink' },
    { id: 'INSTAGRAM', name: 'Instagram', color: 'purple' },
  ];

  const handleStartTest = async () => {
    if (!testData.adName || !testData.budget) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsRunning(true);
    toast.info('เริ่มการทดสอบ...');

    // จำลองการทดสอบ (ในการใช้งานจริงจะเรียก API เพื่อสร้างโฆษณาจริง)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // สร้างผลลัพธ์แบบจำลอง
    const mockResults = {
      status: 'completed',
      platform: selectedPlatform,
      adId: `TEST-${Date.now()}`,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      clicks: Math.floor(Math.random() * 500) + 50,
      conversions: Math.floor(Math.random() * 50) + 5,
      spent: parseFloat(testData.budget) * 0.8 + Math.random() * parseFloat(testData.budget) * 0.2,
      ctr: (Math.random() * 5 + 1).toFixed(2),
      cpc: (Math.random() * 10 + 2).toFixed(2),
      cpa: (Math.random() * 100 + 50).toFixed(2),
      roi: (Math.random() * 200 - 50).toFixed(2),
    };

    setTestResults(mockResults);
    setIsRunning(false);
    toast.success('การทดสอบเสร็จสมบูรณ์');
  };

  const handleStopTest = () => {
    setIsRunning(false);
    toast.warning('หยุดการทดสอบ');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ทดสอบยิงโฆษณา</h1>
        <p className="mt-2 text-gray-600">
          ทดลองยิงโฆษณาบนแพลตฟอร์มต่างๆ ด้วยงบทดสอบ
        </p>
      </div>

      {/* Warning */}
      <div className="mb-8 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 flex-shrink-0 text-orange-600" size={24} />
          <div>
            <h3 className="font-bold text-orange-800">โหมดทดสอบ</h3>
            <p className="mt-1 text-sm text-orange-700">
              นี่คือโหมดทดสอบที่จำลองการยิงโฆษณา ในการใช้งานจริง ระบบจะเรียก API ของแต่ละแพลตฟอร์มเพื่อสร้างแคมเปญจริง
              ตรวจสอบให้แน่ใจว่าคุณได้ตั้งค่า API Keys ในหน้าการตั้งค่าแล้ว
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column - Test Configuration */}
        <div className="space-y-6">
          {/* Platform Selection */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">เลือกแพลตฟอร์ม</h2>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`rounded-lg border-2 p-4 text-center font-semibold transition ${
                    selectedPlatform === platform.id
                      ? `border-${platform.color}-500 bg-${platform.color}-50 text-${platform.color}-700`
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          {/* Test Configuration */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">กำหนดค่าการทดสอบ</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ชื่อโฆษณา *
                </label>
                <input
                  type="text"
                  value={testData.adName}
                  onChange={(e) => setTestData({ ...testData, adName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="ทดสอบโฆษณาสินค้าใหม่"
                  disabled={isRunning}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  งบทดสอบ (฿) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={testData.budget}
                  onChange={(e) => setTestData({ ...testData, budget: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="1000"
                  disabled={isRunning}
                />
                <p className="mt-1 text-xs text-gray-500">งบขั้นต่ำ 100 บาท</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ระยะเวลาทดสอบ (วัน)
                </label>
                <select
                  value={testData.duration}
                  onChange={(e) => setTestData({ ...testData, duration: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isRunning}
                >
                  <option value="1">1 วัน</option>
                  <option value="3">3 วัน</option>
                  <option value="7">7 วัน</option>
                  <option value="14">14 วัน</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">กลุ่มเป้าหมาย</label>
                <select
                  value={testData.targetAudience}
                  onChange={(e) => setTestData({ ...testData, targetAudience: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isRunning}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="male">ผู้ชาย</option>
                  <option value="female">ผู้หญิง</option>
                  <option value="18-24">อายุ 18-24</option>
                  <option value="25-34">อายุ 25-34</option>
                  <option value="35-44">อายุ 35-44</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">เป้าหมาย</label>
                <select
                  value={testData.objective}
                  onChange={(e) => setTestData({ ...testData, objective: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isRunning}
                >
                  <option value="conversions">การแปลง (Conversions)</option>
                  <option value="traffic">การเข้าชม (Traffic)</option>
                  <option value="awareness">การรับรู้ (Awareness)</option>
                  <option value="engagement">การมีส่วนร่วม (Engagement)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStartTest}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600"
                >
                  <Play size={20} />
                  เริ่มทดสอบ
                </button>
              ) : (
                <button
                  onClick={handleStopTest}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
                >
                  <StopCircle size={20} />
                  หยุดทดสอบ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Test Results */}
        <div className="space-y-6">
          {/* Real-time Status */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">สถานะการทดสอบ</h2>
            {isRunning ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-lg font-semibold text-gray-700">กำลังรันโฆษณาทดสอบ...</p>
                  <p className="mt-2 text-sm text-gray-500">แพลตฟอร์ม: {selectedPlatform}</p>
                </div>
              </div>
            ) : testResults ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <BarChart3 size={20} />
                    <span className="font-semibold">ทดสอบเสร็จสมบูรณ์</span>
                  </div>
                  <p className="mt-1 text-sm text-green-600">
                    Ad ID: {testResults.adId}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Impressions</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      {testResults.impressions.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Clicks</p>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {testResults.clicks.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Conversions</p>
                    <p className="mt-1 text-2xl font-bold text-green-600">
                      {testResults.conversions}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">CTR</p>
                    <p className="mt-1 text-2xl font-bold text-purple-600">
                      {testResults.ctr}%
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">CPC</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      ฿{testResults.cpc}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">CPA</p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                      ฿{testResults.cpa}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Spent</p>
                    <p className="mt-1 text-2xl font-bold text-orange-600">
                      ฿{testResults.spent.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">ROI</p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        parseFloat(testResults.roi) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {testResults.roi}%
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-800">💡 คำแนะนำ</h3>
                  <p className="mt-2 text-sm text-blue-700">
                    {parseFloat(testResults.roi) >= 0
                      ? `✅ ROI เป็นบวก! แนะนำให้ขยายงบโฆษณาเพื่อเพิ่มยอดขาย`
                      : `⚠️ ROI เป็นลบ ควรปรับกลุ่มเป้าหมายหรือเนื้อหาโฆษณา`}
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    CTR {parseFloat(testResults.ctr) >= 3 ? 'สูง' : 'ต่ำ'} -{' '}
                    {parseFloat(testResults.ctr) >= 3
                      ? 'โฆษณาน่าสนใจ'
                      : 'ควรปรับภาพหรือข้อความให้น่าสนใจมากขึ้น'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <p>ยังไม่มีผลการทดสอบ</p>
                <p className="mt-2 text-sm">กรอกข้อมูลและกดปุ่ม "เริ่มทดสอบ"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
