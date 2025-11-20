# 🌸 Sakura - Business Management Platform

> **ระบบจัดการธุรกิจแบบครบวงจร พร้อม AI ช่วยวิเคราะห์**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## ✨ Features

### 🎯 Core Features

- **🔐 ระบบสมาชิก & สิทธิ์**: แบ่งยศตาม Role (ADMIN, STAFF_STOCK, STAFF_MARKETING, VIEWER)
- **📦 จัดการสต๊อก**: ติดตามสินค้าคงคลัง พร้อมแจ้งเตือนเมื่อสินค้าใกล้หมด
- **💰 จัดการงบประมาณ**: ระบบขออนุมัติงบ พร้อมการอนุมัติจาก Admin
- **🛒 จัดการคำสั่งซื้อ**: บันทึกและติดตามออเดอร์ เชื่อมกับสต๊อกอัตโนมัติ
- **👥 จัดการลูกค้า**: แยกลูกค้าใหม่/เก่า ติดตามประวัติการซื้อ
- **📊 Analytics & Reports**: วิเคราะห์กำไร/ขาดทุน ยอดขาย ROI แคมเปญ
- **📢 ระบบแจ้งเตือน**: แจ้งเตือนเมื่อมีคำขอใช้งบ สต๊อกหมด หรือระบบขาดทุน
- **🤖 AI ช่วยวิเคราะห์**: คำแนะนำจาก AI สำหรับปรับปรุงธุรกิจ
- **📱 Responsive Design**: รองรับทั้ง Desktop และ Mobile

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **API**: RESTful API

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Project Structure

```
sakura/
├── apps/
│   ├── api/          # Backend API (Express + TypeScript)
│   └── web/          # Frontend (Next.js)
├── packages/
│   ├── database/     # Prisma schema & migrations
│   ├── types/        # Shared TypeScript types
│   └── ui/           # Shared UI components
└── package.json      # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Installation

```bash
# 1. Clone repository
git clone <your-repo-url>
cd sakura

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
# - Copy apps/api/.env.example to apps/api/.env
# - Copy packages/database/.env.example to packages/database/.env
# - Add your Neon DATABASE_URL

# 4. Push database schema
cd packages/database
pnpm db:push

# 5. Start development
cd ../..
pnpm dev
```

**Access:**
- Frontend: http://localhost:9002
- Backend API: http://localhost:3001

### Environment Variables

#### Backend (apps/api/.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/sakura"
JWT_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-key"
GEMINI_API_KEY="your-gemini-key"
PORT=3001
```

#### Frontend (apps/web/.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter api dev
pnpm --filter web dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## API Documentation

API documentation is available at `http://localhost:3001/api-docs` when running in development mode.

## Database Schema

See `packages/database/prisma/schema.prisma` for the complete database schema.

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - คู่มือติดตั้งและใช้งานแบบละเอียด
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - สำหรับนักพัฒนา

---

## 🤝 Contributing

เรายินดีรับ Contributions จากทุกคน!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see the [LICENSE](./LICENSE) file for details.

---

**Made with ❤️ by Sakura Team**
