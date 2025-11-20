'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
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
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'แดชบอร์ด', href: '/dashboard', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING', 'VIEWER'] },
  { icon: Package, label: 'สต๊อกสินค้า', href: '/dashboard/stock', roles: ['ADMIN', 'STAFF_STOCK'] },
  { icon: Wallet, label: 'งบประมาณ', href: '/dashboard/budget', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
  { icon: ShoppingCart, label: 'คำสั่งซื้อ', href: '/dashboard/orders', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
  { icon: Users, label: 'ลูกค้า', href: '/dashboard/customers', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
  { icon: BarChart3, label: 'วิเคราะห์', href: '/dashboard/analytics', roles: ['ADMIN', 'STAFF_MARKETING'] },
  { icon: Megaphone, label: 'แคมเปญ', href: '/dashboard/campaigns', roles: ['ADMIN', 'STAFF_MARKETING'] },
  { icon: Settings, label: 'ตั้งค่า AI', href: '/dashboard/settings', roles: ['ADMIN', 'STAFF_STOCK', 'STAFF_MARKETING'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
