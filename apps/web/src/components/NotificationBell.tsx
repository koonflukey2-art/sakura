'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Bell, X, Check, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  dataJson?: any;
}

const notificationTypeLabels: Record<string, string> = {
  BUDGET_REQUEST: 'คำขอเพิ่มงบประมาณ',
  BUDGET_APPROVED: 'อนุมัติงบประมาณ',
  BUDGET_REJECTED: 'ปฏิเสธงบประมาณ',
  STOCK_LOW: 'สต็อกเหลือน้อย',
  AI_SUGGESTION: 'คำแนะนำจาก AI',
  ORDER_NEW: 'ออเดอร์ใหม่',
  CAMPAIGN_WARNING: 'เตือนแคมเปญ',
  CAMPAIGN_STOPPED: 'หยุดแคมเปญ',
  SYSTEM: 'ระบบ',
};

const notificationTypeColors: Record<string, string> = {
  BUDGET_REQUEST: 'bg-blue-100 text-blue-800',
  BUDGET_APPROVED: 'bg-green-100 text-green-800',
  BUDGET_REJECTED: 'bg-red-100 text-red-800',
  STOCK_LOW: 'bg-yellow-100 text-yellow-800',
  AI_SUGGESTION: 'bg-purple-100 text-purple-800',
  ORDER_NEW: 'bg-green-100 text-green-800',
  CAMPAIGN_WARNING: 'bg-orange-100 text-orange-800',
  CAMPAIGN_STOPPED: 'bg-red-100 text-red-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/read-all');
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'เมื่อสักครู่';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-sm text-sakura-600 hover:text-sakura-700 flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            notificationTypeColors[notification.type] || notificationTypeColors.SYSTEM
                          }`}
                        >
                          {notificationTypeLabels[notification.type] || 'ระบบ'}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="ทำเครื่องหมายว่าอ่านแล้ว"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-red-600 hover:text-red-800 rounded"
                        title="ลบการแจ้งเตือน"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
