import { Router } from 'express';
import { prisma } from '@sakura/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications - ดึงการแจ้งเตือนของผู้ใช้
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { unreadOnly = 'false', limit = '50' } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - ทำเครื่องหมายว่าอ่านแล้ว
router.put('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all - ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
router.put('/read-all', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id - ลบการแจ้งเตือน
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification || notification.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
