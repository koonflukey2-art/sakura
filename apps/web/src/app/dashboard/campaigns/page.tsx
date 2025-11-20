'use client';

import { useState } from 'react';
import { Plus, Facebook, Chrome, Play } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">แคมเปญโฆษณา</h1>
          <p className="mt-2 text-gray-600">จัดการและติดตามแคมเปญโฆษณา</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-sakura-500 px-6 py-3 font-semibold text-white transition hover:bg-sakura-600">
          <Plus size={20} />
          เพิ่มแคมเปญใหม่
        </button>
      </div>

      {/* Coming Soon */}
      <div className="rounded-xl bg-white p-12 shadow-sm text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-sakura-100">
          <Chrome className="text-sakura-600" size={48} />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-gray-800">ฟีเจอร์กำลังมา เร็วๆ นี้!</h2>
        <p className="text-gray-600 mb-6">
          เราพร้อมเชื่อมต่อกับ Facebook Ads, Google Ads, TikTok Ads และอื่นๆ
        </p>
        <div className="flex justify-center gap-4">
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 px-6 py-4">
            <Facebook className="mx-auto text-blue-600" size={32} />
            <p className="mt-2 text-sm font-semibold text-blue-700">Facebook</p>
          </div>
          <div className="rounded-lg border-2 border-red-200 bg-red-50 px-6 py-4">
            <Chrome className="mx-auto text-red-600" size={32} />
            <p className="mt-2 text-sm font-semibold text-red-700">Google</p>
          </div>
          <div className="rounded-lg border-2 border-pink-200 bg-pink-50 px-6 py-4">
            <Play className="mx-auto text-pink-600" size={32} />
            <p className="mt-2 text-sm font-semibold text-pink-700">TikTok</p>
          </div>
        </div>
      </div>
    </div>
  );
}
