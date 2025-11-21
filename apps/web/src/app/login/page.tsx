'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // บันทึก token ใน localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // ตั้งค่า cookie สำหรับ middleware
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        
        // แสดง toast สำเร็จ
        toast.success(`ยินดีต้อนรับ ${data.user.name}!`);
        
        // Redirect ไป dashboard (ใช้ window.location เพื่อ force refresh)
        window.location.href = '/dashboard';
      } else {
        // แสดง toast error
        toast.error(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600 mb-2">🌸 Sakura</h1>
          <p className="text-gray-600">ระบบจัดการธุรกิจแบบครบวงจร</p>
        </div>

        <h2 className="text-2xl font-semibold mb-6">เข้าสู่ระบบ</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ยังไม่มีบัญชี?{' '}
          <a href="/register" className="text-pink-600 hover:underline font-medium">
            สมัครสมาชิก
          </a>
        </p>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">Demo Accounts:</p>
          <p className="text-xs text-blue-700">
            <strong>Admin:</strong> admin@sakura.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}