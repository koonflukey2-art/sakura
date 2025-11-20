import { Router } from 'express';
import { z } from 'zod';
import { prisma, UserRole, StockStatus, ShippingStatus } from '@sakura/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schema
const createStockSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  priceCost: z.number().positive(),
  priceSell: z.number().positive(),
  quantity: z.number().int().min(0),
  minThreshold: z.number().int().min(0).default(10),
});

const updateStockSchema = createStockSchema.partial();

// GET /api/stock/items - ดึงรายการสินค้าทั้งหมด
router.get('/items', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.stockItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.stockItem.count({ where }),
    ]);

    res.json({
      items,
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

// GET /api/stock/items/:id - ดึงข้อมูลสินค้า 1 รายการ
router.get('/items/:id', authenticate, async (req, res, next) => {
  try {
    const item = await prisma.stockItem.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      throw new AppError(404, 'Stock item not found');
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/stock/items - สร้างสินค้าใหม่ (เฉพาะ ADMIN และ STAFF_STOCK)
router.post(
  '/items',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_STOCK),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createStockSchema.parse(req.body);

      // Check if code already exists
      const existing = await prisma.stockItem.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new AppError(400, 'Stock code already exists');
      }

      const item = await prisma.stockItem.create({
        data,
      });

      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/stock/items/:id - แก้ไขสินค้า (เฉพาะ ADMIN และ STAFF_STOCK)
router.put(
  '/items/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_STOCK),
  async (req: AuthRequest, res, next) => {
    try {
      const data = updateStockSchema.parse(req.body);

      const item = await prisma.stockItem.update({
        where: { id: req.params.id },
        data,
      });

      res.json(item);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/stock/items/:id - ลบสินค้า (เฉพาะ ADMIN)
router.delete(
  '/items/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      await prisma.stockItem.delete({
        where: { id: req.params.id },
      });

      res.json({ message: 'Stock item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/stock/low-stock - สินค้าใกล้หมด
router.get('/low-stock', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.stockItem.findMany({
      where: {
        quantity: {
          lte: prisma.stockItem.fields.minThreshold,
        },
        status: StockStatus.ACTIVE,
      },
      orderBy: { quantity: 'asc' },
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
});

export default router;
