# Sakura - Business Management Platform

ระบบจัดการธุรกิจแบบครบวงจร พร้อม AI ช่วยวิเคราะห์

## Features

- 🔐 **ระบบสมาชิก & สิทธิ์** - Role-based access control (Admin, Staff, Viewer)
- 📦 **จัดการสต๊อก** - ระบบบริหารสินค้าคงคลัง พร้อมแจ้งเตือนสต๊อกใกล้หมด
- 💰 **ระบบงบประมาณ** - ขออนุมัติและอนุมัติงบประมาณ
- 🛒 **ระบบขาย** - จัดการออเดอร์และลูกค้า แยกลูกค้าใหม่-เก่า
- 📊 **Analytics** - กราฟกำไร/ขาดทุน รายวัน/สัปดาห์/เดือน/ปี
- 🤖 **AI Integration** - Gemini/GPT ช่วยวิเคราะห์และแนะนำ
- 🔔 **Notification** - ระบบแจ้งเตือนแบบ Real-time
- 📱 **Responsive** - รองรับทั้ง Desktop และ Mobile

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
# Install dependencies
pnpm install

# Setup database
cd packages/database
cp .env.example .env
# Edit .env with your database credentials
pnpm prisma migrate dev

# Start development
pnpm dev
```

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

## License

MIT
