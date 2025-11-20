# 🌸 Sakura Business Management Platform - Setup Guide

## 📋 สารบัญ
1. [ข้อกำหนดของระบบ](#ข้อกำหนดของระบบ)
2. [การติดตั้ง](#การติดตั้ง)
3. [การตั้งค่า Database (Neon)](#การตั้งค่า-database-neon)
4. [การตั้งค่า AI API Keys](#การตั้งค่า-ai-api-keys)
5. [การรันระบบ](#การรันระบบ)
6. [การใช้งานครั้งแรก](#การใช้งานครั้งแรก)
7. [แก้ไขปัญหาที่พบบ่อย](#แก้ไขปัญหาที่พบบ่อย)

---

## ข้อกำหนดของระบบ

ก่อนเริ่มติดตั้ง ตรวจสอบว่าคุณมีสิ่งเหล่านี้ติดตั้งอยู่แล้ว:

- **Node.js** เวอร์ชัน 18.x หรือสูงกว่า
- **npm** หรือ **pnpm** (แนะนำ pnpm)
- **Git**
- **Neon Database Account** (ฟรี)
- **OpenAI API Key** หรือ **Google Gemini API Key** (สำหรับ AI features)

---

## การติดตั้ง

### 1. Clone โปรเจค

```bash
git clone <your-repository-url>
cd sakura
```

### 2. ติดตั้ง Dependencies

```bash
# ใช้ pnpm (แนะนำ)
pnpm install

# หรือใช้ npm
npm install
```

---

## การตั้งค่า Database (Neon)

### 1. สร้าง Neon Database

1. ไปที่ [Neon Console](https://neon.tech/)
2. สร้างบัญชีใหม่หรือเข้าสู่ระบบ
3. คลิก "Create Project"
4. ตั้งชื่อโปรเจค เช่น "Sakura-Production"
5. เลือก Region ที่ใกล้ที่สุด (เช่น Singapore)
6. คัดลอก **Connection String** ที่ได้

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` และใส่ข้อมูลของคุณ:

```env
# Database
DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/sakura?sslmode=require

# JWT Secret (สร้างใหม่ด้วยคำสั่งด้านล่าง)
JWT_SECRET=your-generated-secret-key

# AI API Keys
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. สร้าง JWT Secret

รัน command นี้เพื่อสร้าง secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

คัดลอกผลลัพธ์และใส่ในไฟล์ `.env` ที่ `JWT_SECRET`

### 4. รัน Database Migrations

```bash
cd packages/database
pnpm prisma migrate deploy
pnpm prisma generate
```

### 5. (Optional) Seed ข้อมูลตัวอย่าง

```bash
pnpm prisma db seed
```

---

## การตั้งค่า AI API Keys

### Option 1: OpenAI (GPT)

1. ไปที่ [OpenAI Platform](https://platform.openai.com/)
2. สร้างบัญชีและเข้าสู่ระบบ
3. ไปที่ [API Keys](https://platform.openai.com/api-keys)
4. คลิก "Create new secret key"
5. คัดลอก API key และเก็บไว้ในที่ปลอดภัย
6. ใส่ API key ในไฟล์ `.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

### Option 2: Google Gemini (แนะนำ - ฟรีและเร็ว)

1. ไปที่ [Google AI Studio](https://makersuite.google.com/app/apikey)
2. เข้าสู่ระบบด้วย Google Account
3. คลิก "Create API Key"
4. คัดลอก API key
5. ใส่ API key ในไฟล์ `.env`:

```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**💡 หมายเหตุ:** คุณสามารถใช้ทั้ง 2 ตัวพร้อมกันได้ และเลือกใช้ตอน runtime

---

## การรันระบบ

### 1. รัน Development Mode

เปิด 2 terminals:

**Terminal 1 - Backend API:**
```bash
cd apps/api
pnpm dev
# รันที่ http://localhost:3001
```

**Terminal 2 - Frontend Web:**
```bash
cd apps/web
pnpm dev
# รันที่ http://localhost:3000
```

### 2. รันทั้ง 2 ตัวพร้อมกัน (จาก root)

```bash
# ถ้าใช้ pnpm workspaces
pnpm dev

# หรือใช้ script
npm run dev:all
```

---

## การใช้งานครั้งแรก

### 1. เปิดเว็บไซต์

ไปที่: [http://localhost:3000](http://localhost:3000)

### 2. สมัครสมาชิกคนแรก (Admin)

1. คลิก "สมัครสมาชิก"
2. กรอกข้อมูล:
   - อีเมล: `admin@sakura.com`
   - รหัสผ่าน: `admin123` (แนะนำให้เปลี่ยนหลังเข้าระบบ)
   - ชื่อ-นามสกุล
3. คลิก "สมัครสมาชิก"

**🎉 คนสมัครคนแรกจะได้รับยศ ADMIN อัตโนมัติ!**

### 3. เข้าสู่ระบบ

1. คลิก "เข้าสู่ระบบ"
2. ใส่ Email และ Password ที่สมัครไว้
3. คลิก "เข้าสู่ระบบ"

### 4. ตั้งค่า AI API Keys (สำคัญ!)

1. ไปที่ "Settings" (เมนูด้านบน)
2. ใส่ AI API Keys:
   - **OpenAI API Key** (ถ้ามี)
   - **Gemini API Key** (ถ้ามี)
3. คลิก "บันทึก"

**💡 API Keys จะถูกเก็บใน localStorage ของ browser คุณเท่านั้น**

### 5. ทดสอบ AI Features

1. ไปที่ **Dashboard**
2. คลิกปุ่ม "ให้ AI วิเคราะห์" ด้านบนขวา
3. เลือก AI Provider (GPT หรือ Gemini)
4. พิมพ์คำถาม เช่น "วิเคราะห์ภาพรวมธุรกิจของฉัน"
5. คลิก "ถาม AI"

---

## แก้ไขปัญหาที่พบบ่อย

### ❌ ปัญหา: Backend ไม่สามารถเชื่อมต่อ Database

**วิธีแก้:**
1. ตรวจสอบว่า `DATABASE_URL` ใน `.env` ถูกต้อง
2. ตรวจสอบว่า Neon Database ยังทำงานอยู่
3. ลองรัน `pnpm prisma migrate deploy` อีกครั้ง

```bash
cd packages/database
pnpm prisma migrate deploy
```

### ❌ ปัญหา: JWT_SECRET Error

**วิธีแก้:**
1. สร้าง JWT secret ใหม่:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. คัดลอกและใส่ในไฟล์ `.env`
3. Restart backend server

### ❌ ปัญหา: AI ไม่ทำงาน

**วิธีแก้:**
1. ตรวจสอบว่าใส่ AI API Key ใน Settings แล้ว
2. ตรวจสอบว่า API Key ยังใช้งานได้ (ไม่หมดอายุ)
3. ลองเปลี่ยนจาก GPT เป็น Gemini หรือกลับกัน
4. เปิด Browser Console (F12) เพื่อดู error messages

### ❌ ปัญหา: หน้าเว็บไม่โหลด

**วิธีแก้:**
1. ตรวจสอบว่า Backend (port 3001) ทำงานอยู่
2. ตรวจสอบว่า Frontend (port 3000) ทำงานอยู่
3. Clear browser cache และ reload
4. ลองเปิดใน Private/Incognito mode

### ❌ ปัญหา: Login ติดค้าง

**วิธีแก้:**
1. เปิด Browser Console (F12)
2. ไปที่ Application/Storage → Local Storage
3. ลบ keys ทั้งหมดที่เกี่ยวข้องกับ sakura
4. Refresh หน้าเว็บและลอง login ใหม่

---

## 🎨 Features ที่เพิ่มใหม่

### 1. **Dashboard ที่ปรับปรุงใหม่**
- แสดง AI suggestions แบบ real-time
- Cards สวยงามพร้อม animations
- Quick actions ที่ใช้งานง่าย

### 2. **AI Center**
- หน้าใหม่สำหรับถามคำถาม AI ได้ทุกอย่าง
- รองรับ chat แบบต่อเนื่อง (จำบทสนทนาล่าสุด 5 ข้อความ)
- เลือก context ที่ต้องการวิเคราะห์ได้
- แสดงประวัติการใช้งาน

### 3. **AI ทุกหน้า**
- ปุ่ม AI พร้อม animations สวยงาม
- รองรับทั้ง OpenAI GPT และ Google Gemini
- สามารถใช้งานได้จริงทุกหน้า

### 4. **UI/UX ที่ทันสมัย**
- Gradient backgrounds
- Smooth animations และ transitions
- Hover effects ที่สวยงาม
- Responsive design สำหรับมือถือ

---

## 📱 หน้าที่มีในระบบ

1. **Dashboard** - ภาพรวมธุรกิจ + AI suggestions
2. **AI Center** - ถาม AI ได้ทุกอย่าง
3. **Stock** - จัดการสต๊อกสินค้า + AI วิเคราะห์
4. **Orders** - จัดการคำสั่งซื้อ
5. **Customers** - จัดการลูกค้า
6. **Analytics** - รายงานและสถิติ + AI วิเคราะห์
7. **Campaigns** - จัดการแคมเปญโฆษณา + AI แนะนำ
8. **Budget** - จัดการงบประมาณ
9. **Users** - จัดการผู้ใช้งาน (Admin only)
10. **Settings** - ตั้งค่า AI API Keys

---

## 🔐 Role & Permissions

- **ADMIN** - ใช้ AI ได้ทุกหน้า, จัดการทุกอย่างได้
- **STAFF_STOCK** - ใช้ AI ได้ในหน้า Stock, Orders, Dashboard, AI Center
- **STAFF_MARKETING** - ใช้ AI ได้ในหน้า Campaigns, Analytics, Dashboard, AI Center, Customers
- **VIEWER** - ดูข้อมูลอย่างเดียว, ใช้ AI ไม่ได้

---

## 🚀 Production Deployment

### 1. Build แอพพลิเคชัน

```bash
# Build backend
cd apps/api
pnpm build

# Build frontend
cd apps/web
pnpm build
```

### 2. ตั้งค่า Environment Variables สำหรับ Production

อย่าลืมเปลี่ยน:
- `NODE_ENV=production`
- `JWT_SECRET` ใหม่ที่ปลอดภัยกว่า
- `DATABASE_URL` ของ Production
- `ALLOWED_ORIGINS` เป็น domain จริงของคุณ

### 3. Deploy

คุณสามารถ deploy บน:
- **Vercel** (Frontend) + **Railway/Render** (Backend)
- **DigitalOcean App Platform**
- **AWS EC2**
- **Heroku**

---

## 💡 Tips & Best Practices

1. **อย่าแชร์ API Keys ของคุณ** - เก็บไว้ใน .env และไม่ commit ลง git
2. **Backup Database เป็นประจำ** - Neon มี backup feature
3. **ใช้ Strong Passwords** - สำหรับ admin accounts
4. **Monitor AI Usage** - เช็ค usage ที่ OpenAI/Gemini dashboard
5. **Test ก่อน Deploy** - รัน build และ test ใน local ก่อน

---

## 🆘 ต้องการความช่วยเหลือ?

หากมีปัญหาหรือข้อสงสัย:

1. ตรวจสอบ [แก้ไขปัญหาที่พบบ่อย](#แก้ไขปัญหาที่พบบ่อย) ด้านบน
2. เปิด Browser Console (F12) เพื่อดู error messages
3. ตรวจสอบ logs ของ backend server
4. ติดต่อทีมพัฒนา

---

## 📝 License

MIT License - ใช้งานได้อย่างอิสระ

---

**สนุกกับการใช้งาน Sakura Business Management Platform! 🌸**
