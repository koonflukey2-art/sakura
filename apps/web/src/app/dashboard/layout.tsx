'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Wallet,
  ShoppingCart,
  Users,
  BarChart3,
  Megaphone,
  Bell,
  LogOut,
  Settings,
  X,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'แดชบอร์ด', href: '/dashboard', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING', 'VIEWER'] },
  { icon: Users, label: 'จัดการผู้ใช้', href: '/dashboard/users', roles: ['ADMIN'] },
  { icon: Package, label: 'สต๊อกสินค้า', href: '/dashboard/stock', roles: ['ADMIN', 'STAFF_STOCK'] },
  { icon: Wallet, label: 'งบประมาณ', href: '/dashboard/budget', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
  { icon: ShoppingCart, label: 'คำสั่งซื้อ', href: '/dashboard/orders', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
  { icon: Users, label: 'ลูกค้า', href: '/dashboard/customers', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
  { icon: BarChart3, label: 'วิเคราะห์', href: '/dashboard/analytics', roles: ['ADMIN', 'STAFF_MARKETING'] },
  { icon: Megaphone, label: 'แคมเปญ', href: '/dashboard/campaigns', roles: ['ADMIN', 'STAFF_MARKETING'] },
  { icon: Settings, label: 'ตั้งค่า AI', href: '/dashboard/settings', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
];

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=20');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้');
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('ลบการแจ้งเตือนสำเร็จ');
    } catch (error) {
      toast.error('ไม่สามารถลบการแจ้งเตือนได้');
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredMenu = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold text-sakura-600">🌸 Sakura</h1>
            <p className="mt-1 text-xs text-gray-500">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {filteredMenu.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-sakura-50 hover:text-sakura-600"
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={20} />
              <span className="font-medium">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        {/* Top Bar with Notifications */}
        <div className="sticky top-0 z-30 border-b bg-white px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">ระบบจัดการธุรกิจ Sakura</h2>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-sakura-600 transition"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 rounded-lg bg-white shadow-2xl border">
                  <div className="border-b p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">การแจ้งเตือน</h3>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            disabled={loading}
                            className="text-sm text-sakura-600 hover:text-sakura-700 disabled:opacity-50"
                          >
                            อ่านทั้งหมด
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>ไม่มีการแจ้งเตือน</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`border-b p-4 transition hover:bg-gray-50 ${
                            !notification.isRead ? 'bg-sakura-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 cursor-pointer" onClick={() => !notification.isRead && markAsRead(notification.id)}>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-800">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-sakura-500"></span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {notification.message}
                              </p>
                              <p className="mt-2 text-xs text-gray-400">
                                {new Date(notification.createdAt).toLocaleString('th-TH')}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-red-500 transition"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="border-t p-3 text-center">
                      <button className="text-sm text-sakura-600 hover:text-sakura-700 font-medium">
                        ดูทั้งหมด
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
