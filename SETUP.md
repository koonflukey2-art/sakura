# 🌸 Sakura Business Management System - Setup Guide

คู่มือการติดตั้งและใช้งานระบบจัดการธุรกิจ Sakura

## 📋 สิ่งที่ต้องเตรียม

1. **Node.js** (เวอร์ชัน 18 ขึ้นไป)
2. **pnpm** (Package Manager)
3. **PostgreSQL Database** (แนะนำใช้ [Neon](https://neon.tech) - ฟรี)

## 🚀 ขั้นตอนการติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้ง pnpm (ถ้ายังไม่มี)
npm install -g pnpm

# ติดตั้ง packages ทั้งหมด
pnpm install
```

### 2. สร้างฐานข้อมูล Neon

1. ไปที่ [https://console.neon.tech](https://console.neon.tech)
2. สร้างบัญชีและ Login
3. สร้าง Project ใหม่
4. คัดลอก **Connection String**

### 3. ตั้งค่า Environment Variables

#### Database (packages/database/.env)
```env
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
```

#### API (apps/api/.env)
```env
PORT=3001
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"
JWT_SECRET="your-super-secret-key-change-this"
```

#### Web (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Push Database Schema

```bash
cd packages/database
npx prisma generate
npx prisma db push
```

## 🎯 การรันโปรเจกต์

```bash
# ที่ root directory
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

## 🔐 เข้าสู่ระบบครั้งแรก

1. ไปที่ http://localhost:3000
2. คลิก "สมัครสมาชิก"
3. ผู้ใช้คนแรกจะได้ยศ **ADMIN** อัตโนมัติ!

## 🎨 ฟีเจอร์หลัก

- 👤 จัดการผู้ใช้ (ADMIN เท่านั้น)
- 📦 จัดการสต๊อกสินค้า + AI แนะนำ
- 💰 ระบบงบประมาณ (ขอ-อนุมัติ)
- 📱 แคมเปญโฆษณา + AI วิเคราะห์
- 📊 Analytics & กราฟ
- 🔔 ระบบแจ้งเตือนแบบ real-time
- 🤖 AI Integration

---

Made with ❤️ by Sakura Team
