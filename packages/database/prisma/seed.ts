import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌸 Starting Sakura database seeding...');

  // สร้าง Admin user คนแรก
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sakura.com' },
    update: {},
    create: {
      email: 'admin@sakura.com',
      passwordHash: adminPassword,
      name: 'Admin Sakura',
      phone: '0812345678',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // สร้าง Staff Stock user
  const staffPassword = await bcrypt.hash('staff123', 10);

  const staffStock = await prisma.user.upsert({
    where: { email: 'stock@sakura.com' },
    update: {},
    create: {
      email: 'stock@sakura.com',
      passwordHash: staffPassword,
      name: 'Stock Manager',
      phone: '0823456789',
      role: UserRole.STAFF_STOCK,
    },
  });

  console.log('✅ Staff Stock user created:', staffStock.email);

  // สร้าง Staff Marketing user
  const staffMarketing = await prisma.user.upsert({
    where: { email: 'marketing@sakura.com' },
    update: {},
    create: {
      email: 'marketing@sakura.com',
      passwordHash: staffPassword,
      name: 'Marketing Manager',
      phone: '0834567890',
      role: UserRole.STAFF_MARKETING,
    },
  });

  console.log('✅ Staff Marketing user created:', staffMarketing.email);

  // สร้าง Viewer user
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@sakura.com' },
    update: {},
    create: {
      email: 'viewer@sakura.com',
      passwordHash: staffPassword,
      name: 'Viewer User',
      phone: '0845678901',
      role: UserRole.VIEWER,
    },
  });

  console.log('✅ Viewer user created:', viewer.email);

  // สร้างตัวอย่าง Stock Items
  const stockItems = await Promise.all([
    prisma.stockItem.upsert({
      where: { code: 'PRD001' },
      update: {},
      create: {
        name: 'เสื้อยืดสีขาว',
        code: 'PRD001',
        description: 'เสื้อยืดคอกลมสีขาว ผ้าคอตตอน 100%',
        location: 'คลังหลัก',
        priceCost: 150,
        priceSell: 299,
        quantity: 100,
        minThreshold: 20,
      },
    }),
    prisma.stockItem.upsert({
      where: { code: 'PRD002' },
      update: {},
      create: {
        name: 'กางเกงยีนส์',
        code: 'PRD002',
        description: 'กางเกงยีนส์ขายาว สีน้ำเงิน',
        location: 'คลังหลัก',
        priceCost: 350,
        priceSell: 699,
        quantity: 50,
        minThreshold: 15,
      },
    }),
    prisma.stockItem.upsert({
      where: { code: 'PRD003' },
      update: {},
      create: {
        name: 'รองเท้าผ้าใบ',
        code: 'PRD003',
        description: 'รองเท้าผ้าใบสีดำ ใส่สบาย',
        location: 'คลังสาขา A',
        priceCost: 500,
        priceSell: 990,
        quantity: 30,
        minThreshold: 10,
      },
    }),
  ]);

  console.log(`✅ Created ${stockItems.length} stock items`);

  // สร้างตัวอย่าง Customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'customer1@example.com' },
      update: {},
      create: {
        name: 'สมชาย ใจดี',
        email: 'customer1@example.com',
        phone: '0891234567',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'customer2@example.com' },
      update: {},
      create: {
        name: 'สมหญิง สวยงาม',
        email: 'customer2@example.com',
        phone: '0892345678',
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // สร้างตัวอย่าง Budget Settings
  const budgetSettings = await prisma.budgetSettings.create({
    data: {
      period: 'MONTHLY',
      companyBudget: 1000000,
      stockBudget: 400000,
      marketingBudget: 300000,
      operationsBudget: 300000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
    },
  });

  console.log('✅ Budget settings created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test accounts:');
  console.log('Admin: admin@sakura.com / admin123');
  console.log('Stock Staff: stock@sakura.com / staff123');
  console.log('Marketing Staff: marketing@sakura.com / staff123');
  console.log('Viewer: viewer@sakura.com / staff123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
