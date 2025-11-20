# Sakura - คู่มือพัฒนา

## การติดตั้งและเริ่มต้น

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้ง pnpm ถ้ายังไม่มี
npm install -g pnpm

# ติดตั้ง dependencies ทั้งหมด
pnpm install
```

### 2. ตั้งค่า Database

```bash
# สร้างไฟล์ .env จาก .env.example
cd packages/database
cp .env.example .env

# แก้ไข DATABASE_URL ใน .env ให้ตรงกับ PostgreSQL ของคุณ
# DATABASE_URL="postgresql://user:password@localhost:5432/sakura"

# รัน Prisma migrations
pnpm prisma migrate dev

# Seed ข้อมูลทดสอบ
pnpm db:seed
```

### 3. ตั้งค่า Backend API

```bash
cd apps/api
cp .env.example .env

# แก้ไขค่าใน .env:
# - DATABASE_URL
# - JWT_SECRET (สร้าง secret key ใหม่)
# - OPENAI_API_KEY (ถ้ามี)
# - GEMINI_API_KEY (ถ้ามี)
```

### 4. ตั้งค่า Frontend

```bash
cd apps/web
cp .env.local.example .env.local

# แก้ไขค่าใน .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. เริ่มต้นการพัฒนา

```bash
# กลับไปที่ root directory
cd ../..

# รัน dev mode (ทั้ง backend และ frontend)
pnpm dev

# หรือรันแยก
pnpm --filter api dev      # Backend: http://localhost:3001
pnpm --filter web dev      # Frontend: http://localhost:9002
```

## โครงสร้างโปรเจกต์

```
sakura/
├── apps/
│   ├── api/                 # Backend (Express.js + TypeScript)
│   │   ├── src/
│   │   │   ├── routes/     # API routes
│   │   │   ├── middleware/ # Express middleware
│   │   │   ├── utils/      # Utility functions
│   │   │   └── index.ts    # Entry point
│   │   └── package.json
│   │
│   └── web/                 # Frontend (Next.js 14)
│       ├── src/
│       │   ├── app/        # App Router pages
│       │   ├── components/ # React components
│       │   ├── lib/        # Utilities
│       │   └── store/      # Zustand state
│       └── package.json
│
├── packages/
│   └── database/            # Prisma ORM
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── package.json
│
└── package.json             # Monorepo root
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ดึงข้อมูลผู้ใช้ปัจจุบัน

### Stock Management
- `GET /api/stock/items` - ดึงรายการสินค้า
- `POST /api/stock/items` - เพิ่มสินค้าใหม่
- `PUT /api/stock/items/:id` - แก้ไขสินค้า
- `DELETE /api/stock/items/:id` - ลบสินค้า
- `GET /api/stock/low-stock` - สินค้าใกล้หมด

### Budget
- `GET /api/budget/settings` - ดึงการตั้งค่างบประมาณ
- `POST /api/budget/settings` - ตั้งค่างบประมาณ
- `GET /api/budget/requests` - ดึงคำขอใช้งบ
- `POST /api/budget/requests` - สร้างคำขอใช้งบ
- `PUT /api/budget/requests/:id/status` - อนุมัติ/ปฏิเสธคำขอ

### Orders
- `GET /api/orders` - ดึงรายการออเดอร์
- `POST /api/orders` - สร้างออเดอร์ใหม่
- `GET /api/orders/:id` - ดึงข้อมูลออเดอร์
- `PUT /api/orders/:id/status` - อัปเดตสถานะ

### Analytics
- `GET /api/analytics/overview` - สรุปภาพรวม
- `GET /api/analytics/profit-trend` - กราฟกำไร
- `GET /api/analytics/top-products` - สินค้าขายดี

### AI
- `POST /api/ai/execute` - รัน AI analysis
- `GET /api/ai/logs` - ดึงประวัติการใช้ AI

## บัญชีทดสอบ

หลังจาก seed database แล้ว จะมีบัญชีทดสอบดังนี้:

- **Admin**: admin@sakura.com / admin123
- **Stock Staff**: stock@sakura.com / staff123
- **Marketing Staff**: marketing@sakura.com / staff123
- **Viewer**: viewer@sakura.com / staff123

## สิทธิ์การใช้งาน

### ADMIN
- สิทธิ์เต็มทุกหน้า
- จัดการผู้ใช้และยศ
- อนุมัติงบประมาณ
- ใช้ AI ได้ทุกหน้า

### STAFF_STOCK
- จัดการสต๊อก
- ขอใช้งบประมาณ
- ใช้ AI ได้เฉพาะหน้า Stock

### STAFF_MARKETING
- จัดการแคมเปญ
- ขอใช้งบประมาณ
- ใช้ AI ได้เฉพาะหน้า Campaigns และ Analytics

### VIEWER
- ดูข้อมูลอย่างเดียว
- ไม่สามารถแก้ไขหรือลบ
- ใช้ AI ไม่ได้

## การใช้งาน AI

AI จะช่วยวิเคราะห์และให้คำแนะนำในหน้าต่างๆ:

- **Stock**: วิเคราะห์สต๊อก แนะนำการสั่งซื้อ
- **Budget**: วิเคราะห์ว่าควรอนุมัติงบหรือไม่
- **Analytics**: อธิบายแนวโน้มกำไร/ขาดทุน
- **Campaigns**: สร้างไอเดียแคมเปญ เพิ่มประสิทธิภาพงบโฆษณา

## การ Build สำหรับ Production

```bash
# Build ทั้งหมด
pnpm build

# Build เฉพาะ API
pnpm --filter api build

# Build เฉพาะ Web
pnpm --filter web build
```

## Database Management

```bash
# Prisma Studio (GUI สำหรับดู/แก้ไขข้อมูล)
cd packages/database
pnpm db:studio

# สร้าง migration ใหม่
pnpm db:migrate

# Reset database
pnpm prisma migrate reset
```

## Tips

1. ใช้ `pnpm dev` เพื่อรันทั้ง backend และ frontend พร้อมกัน
2. ตรวจสอบ logs ใน `apps/api/logs/` เพื่อ debug
3. ใช้ Prisma Studio เพื่อดูและจัดการข้อมูลใน database
4. API documentation อยู่ที่ http://localhost:3001/health

## ปัญหาที่พบบ่อย

### Port ถูกใช้งานแล้ว
```bash
# ตรวจสอบ process ที่ใช้ port
lsof -i :3001  # API
lsof -i :9002  # Web

# Kill process
kill -9 <PID>
```

### Database connection error
- ตรวจสอบว่า PostgreSQL ทำงานอยู่
- ตรวจสอบ DATABASE_URL ใน .env
- ลอง restart PostgreSQL

### Prisma errors
```bash
# Regenerate Prisma Client
cd packages/database
pnpm prisma generate

# Reset และ seed ใหม่
pnpm prisma migrate reset
```
