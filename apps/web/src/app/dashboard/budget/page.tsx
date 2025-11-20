'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Settings, TrendingUp, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

interface BudgetRequest {
  id: string;
  department: string;
  amount: number;
  reason: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface BudgetSettings {
  id: string;
  companyBudget: number;
  stockBudget: number;
  marketingBudget: number;
  operationsBudget: number;
  period: string;
  startDate: string;
  endDate: string;
}

export default function BudgetPage() {
  const { token, user } = useAuthStore();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [formData, setFormData] = useState({
    department: 'STOCK',
    amount: '',
    reason: '',
  });
  const [settingsFormData, setSettingsFormData] = useState({
    period: 'MONTHLY',
    companyBudget: '',
    stockBudget: '',
    marketingBudget: '',
    operationsBudget: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchRequests();
    if (user?.role === 'ADMIN') {
      fetchBudgetSettings();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/budget/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching budget requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetSettings = async () => {
    try {
      const response = await api.get('/budget/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setBudgetSettings(response.data);
        setSettingsFormData({
          period: response.data.period || 'MONTHLY',
          companyBudget: response.data.companyBudget.toString(),
          stockBudget: response.data.stockBudget.toString(),
          marketingBudget: response.data.marketingBudget.toString(),
          operationsBudget: response.data.operationsBudget.toString(),
          startDate: response.data.startDate ? new Date(response.data.startDate).toISOString().split('T')[0] : '',
          endDate: response.data.endDate ? new Date(response.data.endDate).toISOString().split('T')[0] : '',
        });
      }
    } catch (error) {
      console.error('Error fetching budget settings:', error);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/budget/requests', {
        department: formData.department,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('ส่งคำขอใช้งบสำเร็จ');
      setShowModal(false);
      setFormData({ department: 'STOCK', amount: '', reason: '' });
      fetchRequests();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/budget/requests/${id}/status`, {
        status,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(status === 'APPROVED' ? 'อนุมัติคำขอสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ');
      fetchRequests();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveBudgetSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/budget/settings', {
        period: settingsFormData.period,
        companyBudget: parseFloat(settingsFormData.companyBudget),
        stockBudget: parseFloat(settingsFormData.stockBudget),
        marketingBudget: parseFloat(settingsFormData.marketingBudget),
        operationsBudget: parseFloat(settingsFormData.operationsBudget),
        startDate: new Date(settingsFormData.startDate).toISOString(),
        endDate: new Date(settingsFormData.endDate).toISOString(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('บันทึกการตั้งค่างบประมาณสำเร็จ');
      setShowSettingsModal(false);
      fetchBudgetSettings();
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    const icons = {
      PENDING: <Clock size={16} />,
      APPROVED: <CheckCircle size={16} />,
      REJECTED: <XCircle size={16} />,
    };
    const labels = {
      PENDING: 'รอพิจารณา',
      APPROVED: 'อนุมัติ',
      REJECTED: 'ปฏิเสธ',
    };

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getDepartmentLabel = (dept: string) => {
    const labels: Record<string, string> = {
      STOCK: 'สต๊อก',
      MARKETING: 'การตลาด',
      OPERATIONS: 'ปฏิบัติการ',
      OTHER: 'อื่นๆ',
    };
    return labels[dept] || dept;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">จัดการงบประมาณ</h1>
          <p className="mt-2 text-gray-600">
            {isAdmin ? 'อนุมัติคำขอใช้งบและตั้งค่างบประมาณ' : 'ขออนุมัติใช้งบประมาณ'}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-600"
            >
              <Settings size={20} />
              ตั้งค่างบประมาณ
            </button>
          )}
          {!isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600"
            >
              <Plus size={20} />
              ขออนุมัติงบใหม่
            </button>
          )}
        </div>
      </div>

      {/* Budget Summary (Admin only) */}
      {isAdmin && budgetSettings && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">งบรวมบริษัท</p>
                <p className="mt-2 text-3xl font-bold">
                  ฿{Number(budgetSettings.companyBudget).toLocaleString()}
                </p>
              </div>
              <Wallet size={32} className="opacity-80" />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">งบสต๊อก</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              ฿{Number(budgetSettings.stockBudget).toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">งบการตลาด</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              ฿{Number(budgetSettings.marketingBudget).toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">งบปฏิบัติการ</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              ฿{Number(budgetSettings.operationsBudget).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Admin Alert */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="mb-6 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-6">
          <h3 className="text-lg font-bold text-yellow-800">
            🔔 มีคำขอใช้งบรอพิจารณา {pendingRequests.length} รายการ
          </h3>
          <p className="mt-1 text-sm text-yellow-700">กรุณาตรวจสอบและอนุมัติคำขอด้านล่าง</p>
        </div>
      )}

      {/* Summary Stats (Admin only) */}
      {isAdmin && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-600">คำขอรอพิจารณา</div>
            <div className="mt-2 text-3xl font-bold text-yellow-600">
              {pendingRequests.length}
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-600">อนุมัติแล้ว (เดือนนี้)</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {requests.filter((r) => r.status === 'APPROVED').length}
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-600">งบที่ใช้ไป (เดือนนี้)</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              ฿{requests
                .filter((r) => r.status === 'APPROVED')
                .reduce((sum, r) => sum + Number(r.amount), 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  วันที่ขอ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  ผู้ขอ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  แผนก
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  เหตุผล
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  สถานะ
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    จัดการ
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    ไม่มีคำขอใช้งบ
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-800">{request.user.name}</div>
                        <div className="text-sm text-gray-500">{request.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                        {getDepartmentLabel(request.department)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {request.reason}
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-gray-800">
                      ฿{Number(request.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(request.status)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {request.status === 'PENDING' && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveRequest(request.id, 'APPROVED')}
                              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleApproveRequest(request.id, 'REJECTED')}
                              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Budget Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">ขออนุมัติงบประมาณ</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">แผนก *</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                >
                  <option value="STOCK">สต๊อก</option>
                  <option value="MARKETING">การตลาด</option>
                  <option value="OPERATIONS">ปฏิบัติการ</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">จำนวนเงิน (฿) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">เหตุผล *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
                  placeholder="อธิบายเหตุผลในการขอใช้งบประมาณ..."
                />
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
                  ส่งคำขอ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">ตั้งค่างบประมาณบริษัท</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetSettings} className="p-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">รอบงบประมาณ *</label>
                <select
                  required
                  value={settingsFormData.period}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, period: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="MONTHLY">รายเดือน</option>
                  <option value="QUARTERLY">รายไตรมาส</option>
                  <option value="YEARLY">รายปี</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">วันที่เริ่ม *</label>
                  <input
                    type="date"
                    required
                    value={settingsFormData.startDate}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">วันที่สิ้นสุด *</label>
                  <input
                    type="date"
                    required
                    value={settingsFormData.endDate}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">งบรวมบริษัท (฿) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={settingsFormData.companyBudget}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, companyBudget: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="1000000"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">งบสต๊อก (฿) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={settingsFormData.stockBudget}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, stockBudget: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="300000"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">งบการตลาด (฿) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={settingsFormData.marketingBudget}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, marketingBudget: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="500000"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">งบปฏิบัติการ (฿) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={settingsFormData.operationsBudget}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, operationsBudget: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="200000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition hover:bg-blue-600"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
