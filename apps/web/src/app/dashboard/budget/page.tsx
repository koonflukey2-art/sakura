'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { CheckCircle, XCircle, Clock, Plus, AlertTriangle } from 'lucide-react';

interface BudgetSettings {
  id: string;
  period: string;
  companyBudget: string;
  stockBudget: string;
  marketingBudget: string;
  operationsBudget: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface BudgetRequest {
  id: string;
  user: {
    name: string;
    email: string;
  };
  department: string;
  amount: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface BudgetSummary {
  totalBudget: string;
  totalSpent: string;
  totalRemaining: string;
  stockSpent: string;
  stockRemaining: string;
  marketingSpent: string;
  marketingRemaining: string;
}

const departmentLabels: Record<string, string> = {
  STOCK: 'สต็อก',
  MARKETING: 'การตลาด',
  OPERATIONS: 'ปฏิบัติการ',
  OTHER: 'อื่นๆ',
};

export default function BudgetPage() {
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings | null>(null);
  const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BudgetRequest | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const [settingsRes, requestsRes, summaryRes] = await Promise.all([
        api.get('/budget/settings').catch(() => ({ data: null })),
        api.get('/budget/requests'),
        api.get('/budget/summary').catch(() => ({ data: null })),
      ]);
      setBudgetSettings(settingsRes.data);
      setBudgetRequests(requestsRes.data);
      setBudgetSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await api.post('/budget/settings', {
        period: formData.get('period'),
        companyBudget: parseFloat(formData.get('companyBudget') as string),
        stockBudget: parseFloat(formData.get('stockBudget') as string),
        marketingBudget: parseFloat(formData.get('marketingBudget') as string),
        operationsBudget: parseFloat(formData.get('operationsBudget') as string),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
      });
      await fetchBudgetData();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('เกิดข้อผิดพลาดในการสร้างงบประมาณ');
    }
  };

  const handleRequestBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await api.post('/budget/requests', {
        department: formData.get('department'),
        amount: parseFloat(formData.get('amount') as string),
        reason: formData.get('reason'),
      });
      await fetchBudgetData();
      setShowRequestModal(false);
    } catch (error) {
      console.error('Error requesting budget:', error);
      alert('เกิดข้อผิดพลาดในการขอเพิ่มงบประมาณ');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await api.put(`/budget/requests/${requestId}/status`, {
        status: 'APPROVED',
      });
      await fetchBudgetData();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติคำขอ');
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      await api.put(`/budget/requests/${requestId}/status`, {
        status: 'REJECTED',
        rejectionReason: reason,
      });
      await fetchBudgetData();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธคำขอ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sakura-900">งบประมาณ</h1>
          <p className="text-gray-600 mt-2">จัดการงบประมาณและคำขอเพิ่มงบประมาณ</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            ขอเพิ่มงบประมาณ
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-sakura-600 text-white px-4 py-2 rounded-md hover:bg-sakura-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              สร้างงบประมาณใหม่
            </button>
          )}
        </div>
      </div>

      {/* Budget Summary */}
      {budgetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">งบประมาณทั้งหมด</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {parseFloat(budgetSummary.totalBudget).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })}{' '}
              ฿
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">ใช้ไปแล้ว</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {parseFloat(budgetSummary.totalSpent).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })}{' '}
              ฿
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">คงเหลือ</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {parseFloat(budgetSummary.totalRemaining).toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })}{' '}
              ฿
            </p>
          </div>
        </div>
      )}

      {/* Current Budget Settings */}
      {budgetSettings && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">งบประมาณปัจจุบัน</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">งบบริษัท</p>
              <p className="text-lg font-semibold text-gray-900">
                {parseFloat(budgetSettings.companyBudget).toLocaleString('th-TH')} ฿
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">งบสต็อก</p>
              <p className="text-lg font-semibold text-gray-900">
                {parseFloat(budgetSettings.stockBudget).toLocaleString('th-TH')} ฿
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">งบการตลาด</p>
              <p className="text-lg font-semibold text-gray-900">
                {parseFloat(budgetSettings.marketingBudget).toLocaleString('th-TH')} ฿
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">งบปฏิบัติการ</p>
              <p className="text-lg font-semibold text-gray-900">
                {parseFloat(budgetSettings.operationsBudget).toLocaleString('th-TH')} ฿
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              ระยะเวลา: {new Date(budgetSettings.startDate).toLocaleDateString('th-TH')} -{' '}
              {new Date(budgetSettings.endDate).toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
      )}

      {/* Budget Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">คำขอเพิ่มงบประมาณ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้ขอ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แผนก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เหตุผล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่ขอ
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgetRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.user.name}</div>
                    <div className="text-sm text-gray-500">{request.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {departmentLabels[request.department]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {parseFloat(request.amount).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      ฿
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.status === 'PENDING' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        รอดำเนินการ
                      </span>
                    )}
                    {request.status === 'APPROVED' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        อนุมัติ
                      </span>
                    )}
                    {request.status === 'REJECTED' && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        ปฏิเสธ
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'PENDING' && (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-sakura-600 hover:text-sakura-900"
                        >
                          ดูรายละเอียด
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {budgetRequests.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                    ไม่มีคำขอเพิ่มงบประมาณ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">สร้างงบประมาณใหม่</h2>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    งบบริษัท (฿)
                  </label>
                  <input
                    type="number"
                    name="companyBudget"
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    งบสต็อก (฿)
                  </label>
                  <input
                    type="number"
                    name="stockBudget"
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    งบการตลาด (฿)
                  </label>
                  <input
                    type="number"
                    name="marketingBudget"
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    งบปฏิบัติการ (฿)
                  </label>
                  <input
                    type="number"
                    name="operationsBudget"
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
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
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ระยะเวลา</label>
                  <select
                    name="period"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="MONTHLY">รายเดือน</option>
                    <option value="QUARTERLY">รายไตรมาส</option>
                    <option value="YEARLY">รายปี</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-sakura-600 text-white px-4 py-2 rounded-md hover:bg-sakura-700"
                >
                  สร้างงบประมาณ
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Budget Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">ขอเพิ่มงบประมาณ</h2>
            <form onSubmit={handleRequestBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">แผนก</label>
                <select
                  name="department"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">เลือกแผนก</option>
                  <option value="STOCK">สต็อก</option>
                  <option value="MARKETING">การตลาด</option>
                  <option value="OPERATIONS">ปฏิบัติการ</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงิน (฿)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผล</label>
                <textarea
                  name="reason"
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  ส่งคำขอ
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Detail Modal (Admin) */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">รายละเอียดคำขอ</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-500">ผู้ขอ</p>
                <p className="font-semibold">{selectedRequest.user.name}</p>
                <p className="text-sm text-gray-600">{selectedRequest.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">แผนก</p>
                <p className="font-semibold">{departmentLabels[selectedRequest.department]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนเงิน</p>
                <p className="font-semibold text-lg">
                  {parseFloat(selectedRequest.amount).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  ฿
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">เหตุผล</p>
                <p className="text-gray-900">{selectedRequest.reason}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleApproveRequest(selectedRequest.id)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                อนุมัติ
              </button>
              <button
                onClick={() => {
                  const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
                  if (reason) {
                    handleRejectRequest(selectedRequest.id, reason);
                  }
                }}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                ปฏิเสธ
              </button>
            </div>
            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full mt-3 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
