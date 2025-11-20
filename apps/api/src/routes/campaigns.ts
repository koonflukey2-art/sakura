import { Router } from 'express';
import { z } from 'zod';
import {
  prisma,
  UserRole,
  CampaignPlatform,
  CampaignStatus,
  AlertSeverity,
  TestStatus,
  NotificationType,
} from '@sakura/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(1),
  platform: z.nativeEnum(CampaignPlatform),
  budget: z.number().positive(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  settingsJson: z.record(z.any()).optional(),
});

const updateCampaignSchema = createCampaignSchema.partial();

const updateMetricsSchema = z.object({
  spent: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
});

// GET /api/campaigns - ดึงรายการแคมเปญทั้งหมด
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { platform, status } = req.query;

    const where: any = {};

    if (platform) {
      where.platform = platform;
    }

    if (status) {
      where.status = status;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (error) {
    next(error);
  }
});

// GET /api/campaigns/:id - ดึงข้อมูลแคมเปญ 1 รายการ
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError(404, 'Campaign not found');
    }

    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns - สร้างแคมเปญใหม่ (เฉพาะ ADMIN และ STAFF_MARKETING)
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createCampaignSchema.parse(req.body);

      const campaign = await prisma.campaign.create({
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          createdById: req.user!.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(campaign);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/campaigns/:id - แก้ไขแคมเปญ (เฉพาะ ADMIN และ STAFF_MARKETING)
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const data = updateCampaignSchema.parse(req.body);

      const campaign = await prisma.campaign.update({
        where: { id: req.params.id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json(campaign);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/campaigns/:id/metrics - อัปเดต metrics (เฉพาะ ADMIN และ STAFF_MARKETING)
router.put(
  '/:id/metrics',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const data = updateMetricsSchema.parse(req.body);

      const campaign = await prisma.campaign.update({
        where: { id: req.params.id },
        data,
      });

      res.json(campaign);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/campaigns/:id - ลบแคมเปญ (เฉพาะ ADMIN)
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      await prisma.campaign.delete({
        where: { id: req.params.id },
      });

      res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/campaigns/stats/performance - สถิติ performance แคมเปญ
router.get('/stats/performance', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
      },
    });

    const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + Number(c.revenue), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
    const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    res.json({
      totalCampaigns: campaigns.length,
      totalBudget,
      totalSpent,
      totalRevenue,
      totalConversions,
      roi: Number(roi.toFixed(2)),
      roas: Number(roas.toFixed(2)),
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        spent: Number(c.spent),
        revenue: Number(c.revenue),
        roi:
          Number(c.spent) > 0
            ? (((Number(c.revenue) - Number(c.spent)) / Number(c.spent)) * 100).toFixed(2)
            : 0,
        roas: Number(c.spent) > 0 ? (Number(c.revenue) / Number(c.spent)).toFixed(2) : 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Campaign Alerts
// ============================================

const createAlertSchema = z.object({
  severity: z.nativeEnum(AlertSeverity),
  title: z.string().min(1),
  message: z.string().min(1),
  dataJson: z.record(z.any()).optional(),
});

// GET /api/campaigns/:id/alerts - ดึง alerts ของแคมเปญ
router.get('/:id/alerts', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { resolved } = req.query;

    const where: any = {
      campaignId: req.params.id,
    };

    if (resolved !== undefined) {
      where.isResolved = resolved === 'true';
    }

    const alerts = await prisma.campaignAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/alerts - สร้าง alert (เฉพาะ ADMIN และ STAFF_MARKETING)
router.post(
  '/:id/alerts',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createAlertSchema.parse(req.body);

      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: { createdBy: true },
      });

      if (!campaign) {
        throw new AppError(404, 'Campaign not found');
      }

      const alert = await prisma.campaignAlert.create({
        data: {
          ...data,
          campaignId: req.params.id,
        },
      });

      // สร้างการแจ้งเตือนให้ผู้สร้างแคมเปญ
      await prisma.notification.create({
        data: {
          userId: campaign.createdById,
          type: NotificationType.CAMPAIGN_ALERT,
          title: `แจ้งเตือนแคมเปญ: ${campaign.name}`,
          message: data.message,
          dataJson: { campaignId: campaign.id, alertId: alert.id },
        },
      });

      // ถ้าเป็น CRITICAL ให้แจ้งเตือน ADMIN ด้วย
      if (data.severity === AlertSeverity.CRITICAL) {
        const admins = await prisma.user.findMany({
          where: { role: UserRole.ADMIN },
        });

        await Promise.all(
          admins.map((admin) =>
            prisma.notification.create({
              data: {
                userId: admin.id,
                type: NotificationType.CAMPAIGN_ALERT,
                title: `🚨 แจ้งเตือนวิกฤติ: ${campaign.name}`,
                message: data.message,
                dataJson: { campaignId: campaign.id, alertId: alert.id },
              },
            })
          )
        );
      }

      res.status(201).json(alert);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/campaigns/:campaignId/alerts/:alertId/resolve - แก้ไข alert เป็น resolved
router.put(
  '/:campaignId/alerts/:alertId/resolve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const alert = await prisma.campaignAlert.update({
        where: { id: req.params.alertId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });

      res.json(alert);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// Campaign Tests
// ============================================

const createTestSchema = z.object({
  testName: z.string().min(1),
  testBudget: z.number().positive(),
});

const updateTestMetricsSchema = z.object({
  spent: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  status: z.nativeEnum(TestStatus).optional(),
  resultJson: z.record(z.any()).optional(),
});

// GET /api/campaigns/:id/tests - ดึงการทดสอบของแคมเปญ
router.get('/:id/tests', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const tests = await prisma.campaignTest.findMany({
      where: {
        campaignId: req.params.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tests);
  } catch (error) {
    next(error);
  }
});

// POST /api/campaigns/:id/tests - สร้างการทดสอบใหม่ (เฉพาะ ADMIN และ STAFF_MARKETING)
router.post(
  '/:id/tests',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createTestSchema.parse(req.body);

      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
      });

      if (!campaign) {
        throw new AppError(404, 'Campaign not found');
      }

      const test = await prisma.campaignTest.create({
        data: {
          ...data,
          campaignId: req.params.id,
          status: TestStatus.PENDING,
        },
      });

      res.status(201).json(test);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/campaigns/:campaignId/tests/:testId - อัปเดตการทดสอบ
router.put(
  '/:campaignId/tests/:testId',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const data = updateTestMetricsSchema.parse(req.body);

      const test = await prisma.campaignTest.update({
        where: { id: req.params.testId },
        data,
      });

      res.json(test);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/campaigns/:campaignId/tests/:testId/run - เริ่มรันการทดสอบ
router.post(
  '/:campaignId/tests/:testId/run',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const test = await prisma.campaignTest.findUnique({
        where: { id: req.params.testId },
      });

      if (!test) {
        throw new AppError(404, 'Test not found');
      }

      if (test.status !== TestStatus.PENDING) {
        throw new AppError(400, 'Test already started or completed');
      }

      const updatedTest = await prisma.campaignTest.update({
        where: { id: req.params.testId },
        data: {
          status: TestStatus.RUNNING,
        },
      });

      res.json({
        message: 'Test started successfully',
        test: updatedTest,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// AI Campaign Analysis
// ============================================

// POST /api/campaigns/:id/ai-analyze - AI วิเคราะห์ว่าควรยิงต่อหรือหยุด
router.post(
  '/:id/ai-analyze',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.STAFF_MARKETING),
  async (req: AuthRequest, res, next) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          alerts: {
            where: { isResolved: false },
          },
          tests: {
            where: { status: TestStatus.COMPLETED },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!campaign) {
        throw new AppError(404, 'Campaign not found');
      }

      // คำนวณ metrics
      const spent = Number(campaign.spent);
      const revenue = Number(campaign.revenue);
      const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
      const roas = spent > 0 ? revenue / spent : 0;
      const cpa = campaign.conversions > 0 ? spent / campaign.conversions : 0;

      // กฎการตัดสินใจ
      let shouldContinue = true;
      let recommendation = '';
      const warnings: string[] = [];

      // เช็ค ROAS
      if (campaign.minROAS && roas < Number(campaign.minROAS)) {
        shouldContinue = false;
        warnings.push(
          `ROAS (${roas.toFixed(2)}) ต่ำกว่าที่กำหนด (${campaign.minROAS})`
        );
      }

      // เช็ค CPA
      if (campaign.maxCPA && cpa > Number(campaign.maxCPA)) {
        shouldContinue = false;
        warnings.push(
          `CPA (${cpa.toFixed(2)}) สูงกว่าที่กำหนด (${campaign.maxCPA})`
        );
      }

      // เช็คว่าขาดทุนหรือไม่
      if (roi < 0 && campaign.autoStopOnLowProfit) {
        shouldContinue = false;
        warnings.push(`กำลังขาดทุน ROI: ${roi.toFixed(2)}%`);
      }

      // เช็ค budget
      if (spent >= Number(campaign.budget)) {
        shouldContinue = false;
        warnings.push('งบประมาณถูกใช้หมดแล้ว');
      }

      // สร้างคำแนะนำ
      if (shouldContinue) {
        recommendation = `✅ แคมเปญนี้มีผลลัพธ์ดี ควรดำเนินการต่อ\n\n📊 ผลลัพธ์:\n- ROAS: ${roas.toFixed(
          2
        )}\n- ROI: ${roi.toFixed(2)}%\n- CPA: ฿${cpa.toFixed(2)}\n- Conversions: ${
          campaign.conversions
        }`;
      } else {
        recommendation = `⚠️ แนะนำให้หยุดหรือปรับแคมเปญ\n\n❌ ปัญหาที่พบ:\n${warnings
          .map((w) => `- ${w}`)
          .join('\n')}\n\n📊 ผลลัพธ์:\n- ROAS: ${roas.toFixed(
          2
        )}\n- ROI: ${roi.toFixed(2)}%\n- CPA: ฿${cpa.toFixed(2)}\n- Spent: ฿${spent.toFixed(
          2
        )} / ฿${Number(campaign.budget).toFixed(2)}`;
      }

      // บันทึก AI Log
      await prisma.aiLog.create({
        data: {
          userId: req.user!.id,
          page: 'campaigns',
          action: 'analyze_campaign',
          requestPrompt: `Analyze campaign: ${campaign.name}`,
          response: recommendation,
          provider: 'rule-based', // ในตัวอย่างนี้ใช้ rule-based ก่อน
        },
      });

      // ถ้าแนะนำให้หยุดและเปิด autoStop
      if (!shouldContinue && campaign.autoStopOnLowProfit) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: CampaignStatus.PAUSED,
          },
        });

        // สร้าง alert
        await prisma.campaignAlert.create({
          data: {
            campaignId: campaign.id,
            severity: AlertSeverity.CRITICAL,
            title: 'แคมเปญถูกหยุดอัตโนมัติ',
            message: `แคมเปญถูกหยุดโดย AI เนื่องจาก: ${warnings.join(', ')}`,
            dataJson: { roi, roas, cpa },
          },
        });

        // แจ้งเตือน
        await prisma.notification.create({
          data: {
            userId: campaign.createdById,
            type: NotificationType.CAMPAIGN_LOW_PERFORMANCE,
            title: `🚨 แคมเปญถูกหยุด: ${campaign.name}`,
            message: recommendation,
            dataJson: { campaignId: campaign.id },
          },
        });
      }

      res.json({
        shouldContinue,
        recommendation,
        warnings,
        metrics: {
          spent,
          revenue,
          roi: Number(roi.toFixed(2)),
          roas: Number(roas.toFixed(2)),
          cpa: Number(cpa.toFixed(2)),
          conversions: campaign.conversions,
          budgetUsedPercent: Number(
            ((spent / Number(campaign.budget)) * 100).toFixed(2)
          ),
        },
        alerts: campaign.alerts.length,
        completedTests: campaign.tests.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
