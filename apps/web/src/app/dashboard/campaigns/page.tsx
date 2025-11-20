'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  TestTube,
  X,
  Eye,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  budget: string;
  spent: string;
  revenue: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  impressions: number;
  clicks: number;
  conversions: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  settingsJson?: any;
}

interface CampaignAnalysis {
  shouldContinue: boolean;
  roi: number;
  roas: number;
  cpc: number;
  cpa: number;
  conversionRate: number;
  profitMargin: number;
  recommendation: string;
  warnings: string[];
}

const platformLabels: Record<string, string> = {
  FACEBOOK: 'Facebook Ads',
  GOOGLE: 'Google Ads',
  TIKTOK: 'TikTok Ads',
  LINE: 'LINE Ads',
  INSTAGRAM: 'Instagram Ads',
  WEBSITE: 'Website',
  OTHER: 'อื่นๆ',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'กำลังใช้งาน',
  PAUSED: 'หยุดชั่วคราว',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [analyzingCampaign, setAnalyzingCampaign] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/campaigns');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (campaign: Campaign) => {
    const spent = parseFloat(campaign.spent);
    const revenue = parseFloat(campaign.revenue);
    const profit = revenue - spent;
    const roi = spent > 0 ? ((profit / spent) * 100).toFixed(2) : '0.00';
    const roas = spent > 0 ? (revenue / spent).toFixed(2) : '0.00';
    const cpc = campaign.clicks > 0 ? (spent / campaign.clicks).toFixed(2) : '0.00';
    const cpa =
      campaign.conversions > 0 ? (spent / campaign.conversions).toFixed(2) : '0.00';
    const conversionRate =
      campaign.clicks > 0
        ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2)
        : '0.00';

    return { profit, roi, roas, cpc, cpa, conversionRate };
  };

  const analyzeCampaignWithAI = async (campaign: Campaign) => {
    setAnalyzingCampaign(true);
    try {
      const metrics = calculateMetrics(campaign);
      const response = await api.post('/ai/execute', {
        page: 'campaigns',
        action: 'analyze_campaign',
        prompt: `วิเคราะห์แคมเปญโฆษณาต่อไปนี้และแนะนำว่าควรดำเนินการต่อหรือหยุด:

แคมเปญ: ${campaign.name}
แพลตฟอร์ม: ${platformLabels[campaign.platform]}
งบประมาณ: ${campaign.budget} บาท
ใช้ไปแล้ว: ${campaign.spent} บาท
รายได้: ${campaign.revenue} บาท
กำไร: ${metrics.profit} บาท
ROI: ${metrics.roi}%
ROAS: ${metrics.roas}x
CPC: ${metrics.cpc} บาท
CPA: ${metrics.cpa} บาท
Conversion Rate: ${metrics.conversionRate}%
Impressions: ${campaign.impressions.toLocaleString()}
Clicks: ${campaign.clicks.toLocaleString()}
Conversions: ${campaign.conversions.toLocaleString()}

กรุณาวิเคราะห์และตอบกลับในรูปแบบ JSON ดังนี้:
{
  "shouldContinue": true/false,
  "roi": ${metrics.roi},
  "roas": ${metrics.roas},
  "cpc": ${metrics.cpc},
  "cpa": ${metrics.cpa},
  "conversionRate": ${metrics.conversionRate},
  "profitMargin": (กำไร/รายได้)*100,
  "recommendation": "คำแนะนำโดยละเอียด",
  "warnings": ["คำเตือน 1", "คำเตือน 2", ...]
}

หากกำไรต่ำกว่า 20% หรือ ROI ติดลบ ให้ shouldContinue เป็น false และเตือนให้หยุดแคมเปญ`,
      });

      const result = JSON.parse(response.data.response);
      setAnalysis(result);
      setShowAnalysisModal(true);

      // Create notification if should stop
      if (!result.shouldContinue) {
        await api.post('/notifications', {
          type: 'CAMPAIGN_WARNING',
          title: `⚠️ คำเตือน: ${campaign.name}`,
          message: `แคมเปญมีกำไรต่ำ (${result.profitMargin.toFixed(2)}%) แนะนำให้หยุดแคมเปญ`,
          dataJson: { campaignId: campaign.id },
        });
      }
    } catch (error) {
      console.error('Error analyzing campaign:', error);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์แคมเปญด้วย AI');
    } finally {
      setAnalyzingCampaign(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const campaignData = {
        name: formData.get('name'),
        platform: formData.get('platform'),
        budget: parseFloat(formData.get('budget') as string),
        startDate: formData.get('startDate') || undefined,
        endDate: formData.get('endDate') || undefined,
        settingsJson: {
          targetAudience: formData.get('targetAudience'),
          objective: formData.get('objective'),
          bidStrategy: formData.get('bidStrategy'),
          isTest: isTestMode,
        },
      };

      await api.post('/campaigns', campaignData);
      await fetchCampaigns();
      setShowCreateModal(false);
      setIsTestMode(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('เกิดข้อผิดพลาดในการสร้างแคมเปญ');
    }
  };

  const handleTestLaunch = () => {
    setIsTestMode(true);
    setShowCreateModal(true);
  };

  const handleUpdateStatus = async (campaignId: string, newStatus: string) => {
    try {
      await api.put(`/campaigns/${campaignId}`, { status: newStatus });
      await fetchCampaigns();

      if (newStatus === 'PAUSED') {
        await api.post('/notifications', {
          type: 'CAMPAIGN_STOPPED',
          title: '🛑 หยุดแคมเปญ',
          message: 'แคมเปญถูกหยุดชั่วคราวตามคำแนะนำ',
          dataJson: { campaignId },
        });
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะแคมเปญ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sakura-900">แคมเปญโฆษณา</h1>
          <p className="text-gray-600 mt-2">จัดการแคมเปญโฆษณาและวิเคราะห์ผลลัพธ์</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleTestLaunch}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2"
          >
            <TestTube className="w-5 h-5" />
            ทดสอบยิง
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-sakura-600 text-white px-4 py-2 rounded-md hover:bg-sakura-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            สร้างแคมเปญ
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const metrics = calculateMetrics(campaign);
          const isProfitable = parseFloat(metrics.roi) >= 0;
          const isLowProfit =
            parseFloat(metrics.roi) < 20 && parseFloat(metrics.roi) >= 0;

          return (
            <div
              key={campaign.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {platformLabels[campaign.platform]}
                    </p>
                    {campaign.settingsJson?.isTest && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        โหมดทดสอบ
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      statusColors[campaign.status]
                    }`}
                  >
                    {statusLabels[campaign.status]}
                  </span>
                </div>

                {/* Warning Banner */}
                {!isProfitable && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-semibold">
                        กำไรติดลบ! แนะนำให้หยุดแคมเปญ
                      </span>
                    </div>
                  </div>
                )}
                {isProfitable && isLowProfit && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-semibold">กำไรต่ำ! ควรตรวจสอบ</span>
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">งบประมาณ</span>
                    <span className="font-semibold">
                      {parseFloat(campaign.budget).toLocaleString('th-TH')} ฿
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ใช้ไป</span>
                    <span className="font-semibold">
                      {parseFloat(campaign.spent).toLocaleString('th-TH')} ฿
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">รายได้</span>
                    <span className="font-semibold text-green-600">
                      {parseFloat(campaign.revenue).toLocaleString('th-TH')} ฿
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">กำไร</span>
                    <span
                      className={`font-semibold ${
                        metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metrics.profit.toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      ฿
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">ROI</span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          parseFloat(metrics.roi) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {parseFloat(metrics.roi) >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {metrics.roi}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ROAS</span>
                      <span className="font-semibold">{metrics.roas}x</span>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Impressions</p>
                        <p className="font-semibold text-sm">
                          {campaign.impressions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Clicks</p>
                        <p className="font-semibold text-sm">
                          {campaign.clicks.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Conversions</p>
                        <p className="font-semibold text-sm">
                          {campaign.conversions.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      analyzeCampaignWithAI(campaign);
                    }}
                    disabled={analyzingCampaign}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI วิเคราะห์
                  </button>
                  {campaign.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleUpdateStatus(campaign.id, 'PAUSED')}
                      className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <Pause className="w-4 h-4" />
                      หยุด
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(campaign.id, 'ACTIVE')}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      เริ่ม
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {campaigns.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>ยังไม่มีแคมเปญ</p>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {isTestMode ? '🧪 ทดสอบยิงแคมเปญ' : 'สร้างแคมเปญใหม่'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setIsTestMode(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isTestMode && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-sm text-purple-800">
                  โหมดทดสอบ: แคมเปญนี้จะถูกทำเครื่องหมายเป็นโหมดทดสอบ
                  เหมาะสำหรับการทดสอบการตั้งค่าก่อนยิงจริง
                </p>
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อแคมเปญ
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="เช่น โปรโมชั่นสินค้าใหม่ Q1 2024"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แพลตฟอร์ม
                </label>
                <select
                  name="platform"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">เลือกแพลตฟอร์ม</option>
                  <option value="FACEBOOK">Facebook Ads</option>
                  <option value="GOOGLE">Google Ads</option>
                  <option value="TIKTOK">TikTok Ads</option>
                  <option value="LINE">LINE Ads</option>
                  <option value="INSTAGRAM">Instagram Ads</option>
                  <option value="WEBSITE">Website</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  งบประมาณ (฿)
                </label>
                <input
                  type="number"
                  name="budget"
                  required
                  step="0.01"
                  min="0"
                  placeholder={isTestMode ? '1000-5000 (แนะนำสำหรับการทดสอบ)' : ''}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  กลุ่มเป้าหมาย
                </label>
                <textarea
                  name="targetAudience"
                  rows={3}
                  placeholder="อธิบายกลุ่มเป้าหมายของคุณ เช่น อายุ เพศ ความสนใจ"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วัตถุประสงค์
                </label>
                <select
                  name="objective"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="AWARENESS">การรับรู้แบรนด์</option>
                  <option value="TRAFFIC">เพิ่มการเข้าชม</option>
                  <option value="ENGAGEMENT">การมีส่วนร่วม</option>
                  <option value="LEADS">สร้างลีด</option>
                  <option value="CONVERSIONS">การแปลง/ยอดขาย</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  กลยุทธ์การเสนอราคา
                </label>
                <select
                  name="bidStrategy"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="LOWEST_COST">ต้นทุนต่ำสุด</option>
                  <option value="COST_CAP">กำหนดต้นทุน</option>
                  <option value="BID_CAP">กำหนดการเสนอราคา</option>
                  <option value="TARGET_COST">ต้นทุนเป้าหมาย</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className={`flex-1 ${
                    isTestMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-sakura-600 hover:bg-sakura-700'
                  } text-white px-4 py-2 rounded-md flex items-center justify-center gap-2`}
                >
                  {isTestMode ? <TestTube className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isTestMode ? 'เริ่มทดสอบ' : 'สร้างแคมเปญ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsTestMode(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAnalysisModal && analysis && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                AI วิเคราะห์แคมเปญ
              </h2>
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysis(null);
                  setSelectedCampaign(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">{selectedCampaign.name}</h3>
              <p className="text-gray-600">{platformLabels[selectedCampaign.platform]}</p>
            </div>

            {/* Should Continue Banner */}
            {!analysis.shouldContinue ? (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-red-900 text-lg">
                      🛑 แนะนำให้หยุดแคมเปญ
                    </h4>
                    <p className="text-red-700 mt-1">
                      ผลการดำเนินงานไม่เป็นไปตามเป้าหมาย ควรหยุดแคมเปญเพื่อลดการสูญเสีย
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-green-900 text-lg">
                      ✅ สามารถดำเนินการต่อได้
                    </h4>
                    <p className="text-green-700 mt-1">
                      ผลการดำเนินงานเป็นไปตามเป้าหมาย แคมเปญมีความคุ้มค่า
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">ROI</p>
                <p
                  className={`text-2xl font-bold ${
                    analysis.roi >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {analysis.roi}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">ROAS</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.roas}x</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">CPC</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.cpc} ฿</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">CPA</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.cpa} ฿</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.conversionRate}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                <p
                  className={`text-2xl font-bold ${
                    analysis.profitMargin >= 20
                      ? 'text-green-600'
                      : analysis.profitMargin >= 0
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {analysis.profitMargin.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Warnings */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  คำเตือน
                </h4>
                <ul className="space-y-2">
                  {analysis.warnings.map((warning, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 p-3 bg-red-50 rounded-md"
                    >
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-red-800">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendation */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">คำแนะนำจาก AI</h4>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-gray-800 leading-relaxed">{analysis.recommendation}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {!analysis.shouldContinue && selectedCampaign.status === 'ACTIVE' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedCampaign.id, 'PAUSED');
                    setShowAnalysisModal(false);
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Pause className="w-5 h-5" />
                  หยุดแคมเปญ
                </button>
              )}
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setAnalysis(null);
                  setSelectedCampaign(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
