'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Search, UserCheck, UserX, Trash2, Shield, User, Eye } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'แอดมิน',
  STAFF_STOCK: 'พนักงานสต๊อก',
  STAFF_MARKETING: 'พนักงานการตลาด',
  VIEWER: 'ผู้ชม',
};

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  STAFF_STOCK: 'bg-blue-100 text-blue-700',
  STAFF_MARKETING: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-700',
};

const statusBadgeColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  BANNED: 'bg-red-100 text-red-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success('เปลี่ยนยศผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถเปลี่ยนยศผู้ใช้ได้');
    }
  };

  const changeStatus = async (userId: string, newStatus: string) => {
    try {
      await api.put(`/users/${userId}/status`, { status: newStatus });
      toast.success(
        newStatus === 'BANNED' ? 'แบนผู้ใช้สำเร็จ' : 'เปลี่ยนสถานะผู้ใช้สำเร็จ'
      );
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) return;

    try {
      await api.delete(`/users/${userId}`);
      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถลบผู้ใช้ได้');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="mt-1 text-gray-600">จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</p>
            <p className="text-2xl font-bold text-sakura-600">{users.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรืออีเมล..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
          >
            <option value="">ทุกยศ</option>
            <option value="ADMIN">แอดมิน</option>
            <option value="STAFF_STOCK">พนักงานสต๊อก</option>
            <option value="STAFF_MARKETING">พนักงานการตลาด</option>
            <option value="VIEWER">ผู้ชม</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-200"
          >
            <option value="">ทุกสถานะ</option>
            <option value="ACTIVE">ใช้งานอยู่</option>
            <option value="INACTIVE">ไม่ได้ใช้งาน</option>
            <option value="BANNED">ถูกแบน</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ผู้ใช้
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ยศ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                วันที่สมัคร
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  กำลังโหลด...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  ไม่พบข้อมูลผู้ใช้
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sakura-100">
                        <User className="text-sakura-600" size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        roleBadgeColors[user.role]
                      }`}
                    >
                      <option value="ADMIN">แอดมิน</option>
                      <option value="STAFF_STOCK">พนักงานสต๊อก</option>
                      <option value="STAFF_MARKETING">พนักงานการตลาด</option>
                      <option value="VIEWER">ผู้ชม</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) => changeStatus(user.id, e.target.value)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusBadgeColors[user.status]
                      }`}
                    >
                      <option value="ACTIVE">ใช้งานอยู่</option>
                      <option value="INACTIVE">ไม่ได้ใช้งาน</option>
                      <option value="BANNED">ถูกแบน</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Object.entries(roleLabels).map(([key, label]) => {
          const count = users.filter((u) => u.role === key).length;
          return (
            <div key={key} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{count}</p>
                </div>
                <Shield className="text-gray-300" size={40} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
