import { Router } from 'express';
import { prisma, OrderStatus } from '@sakura/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/overview - สรุปภาพรวมธุรกิจ
router.get('/overview', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // ดึงข้อมูลออเดอร์
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: {
          in: [OrderStatus.PAID, OrderStatus.DELIVERED],
        },
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalCost = orders.reduce((sum, o) => sum + Number(o.totalCost), 0);
    const totalProfit = orders.reduce((sum, o) => sum + Number(o.profit), 0);

    // ดึงข้อมูลแคมเปญ
    const campaigns = await prisma.campaign.findMany({
      where: {
        createdAt: { gte: startDate },
      },
    });

    const campaignSpent = campaigns.reduce((sum, c) => sum + Number(c.spent), 0);
    const campaignRevenue = campaigns.reduce((sum, c) => sum + Number(c.revenue), 0);

    // Net profit (กำไรสุทธิ) = กำไรจากการขาย - ค่าโฆษณา
    const netProfit = totalProfit - campaignSpent;

    // ดึงข้อมูลลูกค้า
    const newCustomers = await prisma.customer.count({
      where: {
        firstOrderDate: { gte: startDate },
      },
    });

    const returningCustomers = await prisma.customer.count({
      where: {
        totalOrders: { gt: 1 },
        updatedAt: { gte: startDate },
      },
    });

    // สต๊อกใกล้หมด
    const lowStockCount = await prisma.stockItem.count({
      where: {
        quantity: {
          lte: prisma.stockItem.fields.minThreshold,
        },
      },
    });

    res.json({
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
      revenue: {
        total: totalRevenue,
        cost: totalCost,
        grossProfit: totalProfit,
        campaignSpent,
        netProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      },
      orders: {
        total: orders.length,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      },
      customers: {
        new: newCustomers,
        returning: returningCustomers,
        total: newCustomers + returningCustomers,
      },
      campaigns: {
        total: campaigns.length,
        spent: campaignSpent,
        revenue: campaignRevenue,
        roi: campaignSpent > 0 ? ((campaignRevenue - campaignSpent) / campaignSpent) * 100 : 0,
      },
      stock: {
        lowStockItems: lowStockCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/profit-trend - กราฟกำไร/ขาดทุน
router.get('/profit-trend', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { groupBy = 'day', days = '30' } = req.query; // day, week, month

    const daysInt = parseInt(days as string);
    const startDate = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: {
          in: [OrderStatus.PAID, OrderStatus.DELIVERED],
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // จัดกลุ่มตามวัน
    const dailyData = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];

      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          cost: 0,
          profit: 0,
          orders: 0,
        };
      }

      acc[date].revenue += Number(order.totalAmount);
      acc[date].cost += Number(order.totalCost);
      acc[date].profit += Number(order.profit);
      acc[date].orders += 1;

      return acc;
    }, {} as Record<string, any>);

    const trend = Object.values(dailyData).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    res.json(trend);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/top-products - สินค้าขายดี
router.get('/top-products', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { limit = '10' } = req.query;

    const topProducts = await prisma.orderItem.groupBy({
      by: ['stockItemId'],
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: parseInt(limit as string),
    });

    // ดึงข้อมูลสินค้า
    const productIds = topProducts.map((p) => p.stockItemId);
    const products = await prisma.stockItem.findMany({
      where: { id: { in: productIds } },
    });

    const result = topProducts.map((p) => {
      const product = products.find((prod) => prod.id === p.stockItemId);
      return {
        stockItemId: p.stockItemId,
        name: product?.name || 'Unknown',
        code: product?.code || 'N/A',
        totalQuantitySold: p._sum.quantity || 0,
        totalRevenue: p._sum.lineTotal || 0,
        orderCount: p._count.id,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/customer-lifetime-value - มูลค่าลูกค้า
router.get('/customer-lifetime-value', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { limit = '10' } = req.query;

    const topCustomers = await prisma.customer.findMany({
      orderBy: {
        totalSpent: 'desc',
      },
      take: parseInt(limit as string),
    });

    res.json(topCustomers);
  } catch (error) {
    next(error);
  }
});

export default router;
