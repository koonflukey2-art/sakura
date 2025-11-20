'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Facebook,
  Chrome,
  Play,
  Instagram,
  MessageCircle,
  Globe,
  Edit,
  Trash2,
  X,
  TrendingUp,
  DollarSign,
  Settings,
  TestTube,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import AIButton from '@/components/AIButton';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  revenue: number;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const platformIcons: Record<string, any> = {
  FACEBOOK: Facebook,
  GOOGLE: Chrome,
  TIKTOK: Play,
  INSTAGRAM: Instagram,
  LINE: MessageCircle,
  WEBSITE: Globe,
  OTHER: Globe,
};

const platformColors: Record<string, string> = {
  FACEBOOK: 'blue',
  GOOGLE: 'red',
  TIKTOK: 'pink',
  INSTAGRAM: 'purple',
  LINE: 'green',
  WEBSITE: 'gray',
  OTHER: 'gray',
};

export default function CampaignsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    platform: 'FACEBOOK',
    budget: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        platform: formData.platform,
        budget: parseFloat(formData.budget),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      if (editingCampaign) {
        // Update
        await api.put(`/campaigns/${editingCampaign.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create
        await api.post('/campaigns', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      setEditingCampaign(null);
      setFormData({ name: '', platform: 'FACEBOOK', budget: '', startDate: '', endDate: '' });
      fetchCampaigns();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      platform: campaign.platform,
      budget: campaign.budget.toString(),
      startDate: campaign.startDate
        ? new Date(campaign.startDate).toISOString().split('T')[0]
        : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแคมเปญนี้?')) return;

    try {
      await api.delete(`/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCampaigns();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + Number(c.revenue), 0);
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">แคมเปญโฆษณา</h1>
          <p className="mt-2 text-gray-600">จัดการและติดตามแคมเปญโฆษณา</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/campaigns/settings')}
            className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
          >
            <Settings size={20} />
            ตั้งค่า API
          </button>
          <button
            onClick={() => router.push('/dashboard/campaigns/test')}
            className="flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white transition hover:bg-purple-600"
          >
            <TestTube size={20} />
            ทดสอบ
          </button>
          <AIButton
            page="campaigns"
            action="optimize_ad_budget"
            payload={{ campaigns }}
            buttonText="ให้ AI วิเคราะห์"
            variant="secondary"
          />
          <button
            onClick={() => {
              setEditingCampaign(null);
              setFormData({
                name: '',
                platform: 'FACEBOOK',
                budget: '',
                startDate: '',
                endDate: '',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600"
          >
            <Plus size={20} />
            เพิ่มแคมเปญใหม่
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">งบทั้งหมด</p>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                ฿{totalBudget.toLocaleString()}
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
              <p className="text-sm text-gray-600">ใช้ไปแล้ว</p>
              <p className="mt-2 text-2xl font-bold text-orange-600">
                ฿{totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">รายได้</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                ฿{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ROI</p>
              <p
                className={`mt-2 text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {roi.toFixed(2)}%
              </p>
            </div>
            <div className={`rounded-full ${roi >= 0 ? 'bg-green-100' : 'bg-red-100'} p-3`}>
              <TrendingUp className={roi >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  แพลตฟอร์ม
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  ชื่อแคมเปญ
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">งบ</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  ใช้ไป
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  รายได้
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">ROI</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    ไม่พบข้อมูลแคมเปญ
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => {
                  const Icon = platformIcons[campaign.platform] || Globe;
                  const color = platformColors[campaign.platform] || 'gray';
                  const campaignROI =
                    Number(campaign.spent) > 0
                      ? ((Number(campaign.revenue) - Number(campaign.spent)) /
                          Number(campaign.spent)) *
                        100
                      : 0;

                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg bg-${color}-100 p-2`}>
                            <Icon className={`text-${color}-600`} size={20} />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {campaign.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{campaign.name}</div>
                        <div className="text-xs text-gray-500">
                          {campaign.impressions.toLocaleString()} views • {campaign.clicks} clicks
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-700">
                        ฿{Number(campaign.budget).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-orange-600">
                        ฿{Number(campaign.spent).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">
                        ฿{Number(campaign.revenue).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                            campaignROI >= 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {campaignROI.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            campaign.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : campaign.status === 'PAUSED'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(campaign)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(campaign.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCampaign ? 'แก้ไขแคมเปญ' : 'เพิ่มแคมเปญใหม่'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ชื่อแคมเปญ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  placeholder="เช่น Facebook Ads - สินค้าใหม่"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  แพลตฟอร์ม *
                </label>
                <select
                  required
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                >
                  <option value="FACEBOOK">Facebook</option>
                  <option value="GOOGLE">Google</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="LINE">LINE</option>
                  <option value="WEBSITE">Website</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">งบ (฿) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  placeholder="10000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    วันที่เริ่ม
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sakura-500 px-8 py-3 font-semibold text-white transition hover:bg-sakura-600"
                >
                  {editingCampaign ? 'บันทึกการแก้ไข' : 'เพิ่มแคมเปญ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
