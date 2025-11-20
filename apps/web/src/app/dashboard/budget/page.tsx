'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

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

export default function BudgetPage() {
  const { token, user } = useAuthStore();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

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
                            <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600">
                              อนุมัติ
                            </button>
                            <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
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
    </div>
  );
}
