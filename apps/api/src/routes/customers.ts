import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@sakura/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schema
const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// GET /api/customers - ดึงรายการลูกค้าทั้งหมด
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers,
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

// GET /api/customers/:id - ดึงข้อมูลลูกค้า 1 ราย
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// POST /api/customers - สร้างลูกค้าใหม่
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createCustomerSchema.parse(req.body);

    const customer = await prisma.customer.create({
      data,
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - แก้ไขข้อมูลลูกค้า
router.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateCustomerSchema.parse(req.body);

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data,
    });

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/stats/new-vs-returning - สถิติลูกค้าใหม่ vs เก่า
router.get('/stats/new-vs-returning', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const newCustomers = await prisma.customer.count({
      where: {
        totalOrders: 1,
      },
    });

    const returningCustomers = await prisma.customer.count({
      where: {
        totalOrders: {
          gt: 1,
        },
      },
    });

    res.json({
      newCustomers,
      returningCustomers,
      total: newCustomers + returningCustomers,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
