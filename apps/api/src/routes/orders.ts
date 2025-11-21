import { Router } from 'express';
import { z } from 'zod';
import { prisma, OrderStatus } from '@sakura/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schema
const createOrderSchema = z.object({
  customerId: z.string().cuid(),
  items: z.array(
    z.object({
      stockItemId: z.string().cuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
});

// GET /api/orders - ดึงรายการออเดอร์ทั้งหมด
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status, customerId, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          orderItems: {
            include: {
              stockItem: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - ดึงข้อมูลออเดอร์ 1 รายการ
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        orderItems: {
          include: {
            stockItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - สร้างออเดอร์ใหม่
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { customerId, items } = createOrderSchema.parse(req.body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // Fetch stock items
    const stockItemIds = items.map((item) => item.stockItemId);
    const stockItems = await prisma.stockItem.findMany({
      where: { id: { in: stockItemIds } },
    });

    if (stockItems.length !== items.length) {
      throw new AppError(400, 'Some stock items not found');
    }

    // Check stock availability
    for (const item of items) {
      const stockItem = stockItems.find((s) => s.id === item.stockItemId);
      if (!stockItem) {
        throw new AppError(400, `Stock item ${item.stockItemId} not found`);
      }
      if (stockItem.quantity < item.quantity) {
        throw new AppError(400, `Insufficient stock for ${stockItem.name}`);
      }
    }

    // Calculate totals
    let totalAmount = 0;
    let totalCost = 0;

    const orderItemsData = items.map((item) => {
      const stockItem = stockItems.find((s) => s.id === item.stockItemId)!;
      const lineTotal = Number(stockItem.priceSell) * item.quantity;
      const lineCost = Number(stockItem.priceCost) * item.quantity;

      totalAmount += lineTotal;
      totalCost += lineCost;

      return {
        stockItemId: item.stockItemId,
        quantity: item.quantity,
        priceSell: stockItem.priceSell,
        priceCost: stockItem.priceCost,
        lineTotal,
      };
    });

    const profit = totalAmount - totalCost;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          customerId,
          totalAmount,
          totalCost,
          profit,
          status: OrderStatus.PENDING,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              stockItem: true,
            },
          },
        },
      });

      // Update stock quantities
      for (const item of items) {
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Update customer stats
      const isFirstOrder = customer.totalOrders === 0;
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: totalAmount },
          firstOrderDate: isFirstOrder ? new Date() : undefined,
        },
      });

      return newOrder;
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status - อัปเดตสถานะออเดอร์
router.put('/:id/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status } = z.object({ status: z.nativeEnum(OrderStatus) }).parse(req.body);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        customer: true,
        orderItems: {
          include: {
            stockItem: true,
          },
        },
      },
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
