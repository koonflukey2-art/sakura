# 🌸 Sakura - คู่มือติดตั้งและใช้งาน

## 📋 สารบัญ
1. [ข้อกำหนดระบบ](#ข้อกำหนดระบบ)
2. [การติดตั้ง](#การติดตั้ง)
3. [การตั้งค่าฐานข้อมูล](#การตั้งค่าฐานข้อมูล)
4. [การรันระบบ](#การรันระบบ)
5. [การใช้งานครั้งแรก](#การใช้งานครั้งแรก)
6. [การแก้ไขปัญหา](#การแก้ไขปัญหา)

---

## ข้อกำหนดระบบ

- **Node.js**: v18.0.0 ขึ้นไป
- **pnpm**: v8.0.0 ขึ้นไป
- **PostgreSQL**: (Neon Database แนะนำ)
- **Browser**: Chrome, Firefox, Safari, Edge (เวอร์ชันล่าสุด)

---

## การติดตั้ง

### 1. Clone Repository

\`\`\`bash
git clone <your-repo-url>
cd sakura
\`\`\`

### 2. ติดตั้ง Dependencies

\`\`\`bash
pnpm install
\`\`\`

---

## การตั้งค่าฐานข้อมูล

### ขั้นตอนที่ 1: สร้างฐานข้อมูล Neon

1. ไปที่ https://console.neon.tech
2. สร้าง Project ใหม่
3. คัดลอก **Connection String**

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

#### สำหรับ API (apps/api/.env)

\`\`\`bash
# Server
PORT=3001
NODE_ENV=development

# Database - ใส่ Connection String จาก Neon
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/database?sslmode=require"

# JWT Secret (ถูกสร้างให้อัตโนมัติแล้ว)
JWT_SECRET="952a8754f1a3f780f5db0a2bf9e4c79a9c787becf29020319e4260d3ee6a16d4"
JWT_EXPIRES_IN="7d"

# AI Services (Optional - เพิ่มภายหลังได้)
# OPENAI_API_KEY="your-openai-api-key"
# GEMINI_API_KEY="your-gemini-api-key"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:9002"
\`\`\`

#### สำหรับ Database Package (packages/database/.env)

\`\`\`bash
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/database?sslmode=require"
\`\`\`

#### สำหรับ Web App (apps/web/.env.local)

\`\`\`bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
\`\`\`

### ขั้นตอนที่ 3: Push Database Schema

\`\`\`bash
# Generate Prisma Client
cd packages/database
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed ข้อมูลทดสอบ
# pnpm db:seed
\`\`\`

---

## การรันระบบ

### Development Mode

#### แบบรวม (แนะนำ)

\`\`\`bash
# รันทั้ง API และ Web พร้อมกัน
pnpm dev
\`\`\`

#### แบบแยก

Terminal 1 - API:
\`\`\`bash
cd apps/api
pnpm dev
# API จะรันที่ http://localhost:3001
\`\`\`

Terminal 2 - Web:
\`\`\`bash
cd apps/web
pnpm dev
# Web จะรันที่ http://localhost:9002
\`\`\`

### Production Mode

\`\`\`bash
# Build ทั้งหมด
pnpm build

# Start production server
cd apps/api && pnpm start
cd apps/web && pnpm start
\`\`\`

---

## การใช้งานครั้งแรก

### 1. เปิดเว็บไซต์

เปิด Browser แล้วไปที่: **http://localhost:9002**

### 2. สมัครสมาชิกคนแรก (จะเป็น Admin อัตโนมัติ)

1. คลิก "สมัครสมาชิก"
2. กรอกข้อมูล:
   - อีเมล: admin@sakura.com
   - รหัสผ่าน: admin123
   - ชื่อ: Admin Sakura
3. คลิก "สมัครสมาชิก"

> **หมายเหตุ**: ผู้ใช้คนแรกที่สมัครจะได้รับสิทธิ์ ADMIN โดยอัตโนมัติ

### 3. เข้าสู่ระบบ

1. กรอก Email และ Password ที่สมัครไว้
2. คลิก "เข้าสู่ระบบ"
3. คุณจะถูก Redirect ไป Dashboard

### 4. เริ่มใช้งาน

- **Dashboard**: ดูภาพรวมธุรกิจ
- **สต๊อกสินค้า**: เพิ่มสินค้าลงระบบ
- **งบประมาณ**: ตั้งค่างบประมาณบริษัท
- **คำสั่งซื้อ**: สร้างออเดอร์แรก
- **ลูกค้า**: เพิ่มข้อมูลลูกค้า
- **วิเคราะห์**: ดูรายงานกำไร/ขาดทุน

---

## การแก้ไขปัญหา

### ปัญหา: ไม่สามารถ Login ได้

**สาเหตุ**: JWT_SECRET ไม่ถูกโหลด

**วิธีแก้**:
1. ตรวจสอบไฟล์ \`apps/api/.env\` ว่ามี JWT_SECRET หรือไม่
2. Restart API server
3. ลองสมัครสมาชิกใหม่อีกครั้ง

### ปัญหา: Database Connection Error

**สาเหตุ**: DATABASE_URL ไม่ถูกต้อง

**วิธีแก้**:
1. ตรวจสอบ DATABASE_URL ใน \`apps/api/.env\` และ \`packages/database/.env\`
2. ตรวจสอบว่า Neon Database ยังทำงานอยู่
3. ลอง Ping database:
   \`\`\`bash
   cd packages/database
   pnpm db:studio
   \`\`\`

### ปัญหา: API ไม่ตอบสนอง

**สาเหตุ**: Port ถูกใช้งานแล้ว หรือ API ไม่ได้รัน

**วิธีแก้**:
1. ตรวจสอบว่า API รันอยู่ที่ port 3001:
   \`\`\`bash
   curl http://localhost:3001/health
   \`\`\`
2. ถ้า Port ถูกใช้แล้ว เปลี่ยน PORT ใน \`apps/api/.env\`
3. Restart API server

### ปัญหา: Prisma Client ไม่พบ

**วิธีแก้**:
\`\`\`bash
cd packages/database
pnpm db:generate
\`\`\`

### ปัญหา: CORS Error

**วิธีแก้**:
เพิ่ม URL ของ Frontend ลงใน \`ALLOWED_ORIGINS\` ใน \`apps/api/.env\`:
\`\`\`bash
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:9002,http://your-domain.com"
\`\`\`

---

## การจัดการ Users และ Roles

### Roles ในระบบ

1. **ADMIN** - ดูแลทุกอย่าง
2. **STAFF_STOCK** - จัดการสต๊อกสินค้า
3. **STAFF_MARKETING** - จัดการแคมเปญโฆษณา
4. **VIEWER** - ดูข้อมูลอย่างเดียว (ไม่สามารถแก้ไข)

### การเปลี่ยนยศผู้ใช้ (เฉพาะ Admin)

1. ไปที่เมนู "ผู้ใช้" (จะเห็นเฉพาะ Admin)
2. เลือกผู้ใช้ที่ต้องการเปลี่ยนยศ
3. คลิก "เปลี่ยนยศ"
4. เลือกยศใหม่

---

## Tips & Best Practices

### ความปลอดภัย

1. **เปลี่ยน JWT_SECRET**: ใช้ค่าที่ปลอดภัยใน Production
   \`\`\`bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   \`\`\`

2. **ใช้ HTTPS**: ใน Production ต้องใช้ HTTPS เท่านั้น

3. **Secure Database**: ตั้งรหัสผ่านที่แข็งแรงสำหรับฐานข้อมูล

### Performance

1. **Connection Pooling**: Neon มี Connection Pooling อัตโนมัติ
2. **Caching**: พิจารณาใช้ Redis สำหรับ cache
3. **CDN**: ใช้ CDN สำหรับ static files

---

## คำถามที่พบบ่อย (FAQ)

**Q: สามารถใช้ฐานข้อมูลอื่นแทน Neon ได้ไหม?**
A: ได้ครับ สามารถใช้ PostgreSQL ใดๆ ก็ได้ เพียงแค่เปลี่ยน DATABASE_URL

**Q: มี API Documentation ไหม?**
A: ดูได้ที่ [API.md](./API.md) (จะสร้างในอนาคต)

**Q: ระบบรองรับ Multi-tenant ไหม?**
A: ยังไม่รองรับ แต่สามารถพัฒนาต่อได้

**Q: สามารถเชื่อมต่อ AI (GPT/Gemini) ได้ไหม?**
A: ได้ครับ ใส่ API Key ใน \`.env\`:
\`\`\`bash
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."
\`\`\`

---

## 📞 ติดต่อ & Support

- **Email**: support@sakura.com
- **GitHub Issues**: [Link to issues]

---

## 📄 License

MIT License - ดูรายละเอียดใน [LICENSE](./LICENSE)

---

**สร้างด้วย ❤️ โดย Sakura Team**
