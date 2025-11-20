import { Router } from 'express';
import { z } from 'zod';
import {
  prisma,
  UserRole,
  BudgetPeriod,
  BudgetDepartment,
  BudgetRequestStatus,
  NotificationType,
} from '@sakura/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createBudgetSettingsSchema = z.object({
  period: z.nativeEnum(BudgetPeriod),
  companyBudget: z.number().positive(),
  stockBudget: z.number().positive(),
  marketingBudget: z.number().positive(),
  operationsBudget: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const createBudgetRequestSchema = z.object({
  department: z.nativeEnum(BudgetDepartment),
  amount: z.number().positive(),
  reason: z.string().min(10),
});

const approveBudgetRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

// GET /api/budget/settings - ดึงการตั้งค่างบประมาณ
router.get('/settings', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const settings = await prisma.budgetSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// POST /api/budget/settings - สร้าง/แก้ไขการตั้งค่างบประมาณ (เฉพาะ ADMIN)
router.post(
  '/settings',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createBudgetSettingsSchema.parse(req.body);

      // Deactivate old settings
      await prisma.budgetSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Create new settings
      const settings = await prisma.budgetSettings.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      res.status(201).json(settings);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/budget/requests - ดึงรายการคำขอใช้งบประมาณ
router.get('/requests', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { status, department } = req.query;

    const where: any = {};

    // ถ้าไม่ใช่ ADMIN ให้เห็นเฉพาะของตัวเอง
    if (req.user!.role !== UserRole.ADMIN) {
      where.userId = req.user!.id;
    }

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = department;
    }

    const requests = await prisma.budgetRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// POST /api/budget/requests - สร้างคำขอใช้งบประมาณ
router.post('/requests', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = createBudgetRequestSchema.parse(req.body);

    const request = await prisma.budgetRequest.create({
      data: {
        ...data,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // สร้างการแจ้งเตือนให้ ADMIN
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
    });

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: NotificationType.BUDGET_REQUEST,
            title: 'คำขอใช้งบประมาณใหม่',
            message: `${req.user!.name} ขออนุมัติงบ ${data.department} จำนวน ${data.amount} บาท`,
            dataJson: { budgetRequestId: request.id },
          },
        })
      )
    );

    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// PUT /api/budget/requests/:id/status - อนุมัติ/ปฏิเสธคำขอ (เฉพาะ ADMIN)
router.put(
  '/requests/:id/status',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const { status, rejectionReason } = approveBudgetRequestSchema.parse(req.body);

      const budgetRequest = await prisma.budgetRequest.findUnique({
        where: { id: req.params.id },
        include: {
          user: true,
        },
      });

      if (!budgetRequest) {
        throw new AppError(404, 'Budget request not found');
      }

      if (budgetRequest.status !== BudgetRequestStatus.PENDING) {
        throw new AppError(400, 'Budget request already processed');
      }

      // Update budget request
      const updated = await prisma.budgetRequest.update({
        where: { id: req.params.id },
        data: {
          status: status as BudgetRequestStatus,
          approvedBy: req.user!.id,
          approvedAt: new Date(),
          rejectionReason,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // สร้างการแจ้งเตือนให้ผู้ขอ
      await prisma.notification.create({
        data: {
          userId: budgetRequest.userId,
          type:
            status === 'APPROVED'
              ? NotificationType.BUDGET_APPROVED
              : NotificationType.BUDGET_REJECTED,
          title: status === 'APPROVED' ? 'คำของบประมาณได้รับการอนุมัติ' : 'คำของบประมาณถูกปฏิเสธ',
          message:
            status === 'APPROVED'
              ? `คำของบ ${budgetRequest.department} จำนวน ${budgetRequest.amount} บาท ได้รับการอนุมัติแล้ว`
              : `คำของบ ${budgetRequest.department} จำนวน ${budgetRequest.amount} บาท ถูกปฏิเสธ: ${rejectionReason || 'ไม่ระบุเหตุผล'}`,
          dataJson: { budgetRequestId: updated.id },
        },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/budget/summary - สรุปการใช้งบประมาณ
router.get('/summary', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const settings = await prisma.budgetSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      return res.json({
        message: 'No active budget settings found',
        data: null,
      });
    }

    // คำนวณงบที่ใช้ไปแล้ว (ที่อนุมัติแล้ว)
    const approvedRequests = await prisma.budgetRequest.findMany({
      where: {
        status: BudgetRequestStatus.APPROVED,
        createdAt: {
          gte: settings.startDate,
          lte: settings.endDate,
        },
      },
    });

    const spentByDepartment = approvedRequests.reduce(
      (acc, req) => {
        acc[req.department] = (acc[req.department] || 0) + Number(req.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    const totalSpent = approvedRequests.reduce((sum, req) => sum + Number(req.amount), 0);

    res.json({
      settings,
      spent: {
        total: totalSpent,
        stock: spentByDepartment.STOCK || 0,
        marketing: spentByDepartment.MARKETING || 0,
        operations: spentByDepartment.OPERATIONS || 0,
        other: spentByDepartment.OTHER || 0,
      },
      remaining: {
        total: Number(settings.companyBudget) - totalSpent,
        stock: Number(settings.stockBudget) - (spentByDepartment.STOCK || 0),
        marketing: Number(settings.marketingBudget) - (spentByDepartment.MARKETING || 0),
        operations: Number(settings.operationsBudget) - (spentByDepartment.OPERATIONS || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
