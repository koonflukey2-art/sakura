import { Router } from 'express';
import { z } from 'zod';
import { prisma, UserRole, UserStatus } from '@sakura/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schema
const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

// GET /api/users - ดึงรายการผู้ใช้ทั้งหมด (เฉพาะ ADMIN)
router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res, next) => {
  try {
    const { search, role, status } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/role - เปลี่ยนยศผู้ใช้ (เฉพาะ ADMIN)
router.put(
  '/:id/role',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const { role } = updateRoleSchema.parse(req.body);

      // ไม่ให้แก้ไขตัวเอง
      if (req.params.id === req.user!.id) {
        throw new AppError(400, 'Cannot change your own role');
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/users/:id/status - เปลี่ยนสถานะผู้ใช้ (เฉพาะ ADMIN)
router.put(
  '/:id/status',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const { status } = updateStatusSchema.parse(req.body);

      // ไม่ให้แบนตัวเอง
      if (req.params.id === req.user!.id) {
        throw new AppError(400, 'Cannot change your own status');
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { status },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
