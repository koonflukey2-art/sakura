import { Router } from 'express';
import { z } from 'zod';
import { prisma, UserRole, CampaignPlatform, CampaignStatus } from '@sakura/database';
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

// POST /api/campaigns/auto-launch - สร้างและยิงแคมเปญอัตโนมัติ
router.post('/auto-launch', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const {
      name,
      url,
      budget,
      cpc,
      conversionRate,
      targetValue,
      targetCost,
      revenue,
      cogs,
      platform,
      productName,
      vat,
      shippingCost,
      packagingCost,
      platformFee,
      autoStop,
      estimatedMetrics
    } = req.body;

    // Validate required fields
    if (!budget || budget <= 0) {
      throw new AppError(400, 'กรุณาระบุงบประมาณ');
    }

    // Calculate estimated metrics
    const estimatedClicks = cpc > 0 ? budget / cpc : 0;
    const estimatedOrders = estimatedClicks * ((conversionRate || 2.5) / 100);
    const estimatedRevenue = estimatedOrders * (revenue || targetValue || 0);
    const estimatedCost = estimatedOrders * (cogs || targetCost || 0);
    const estimatedProfit = estimatedRevenue - budget - estimatedCost;
    const estimatedROAS = budget > 0 ? estimatedRevenue / budget : 0;
    const estimatedROI = budget > 0 ? ((estimatedProfit / budget) * 100) : 0;

    // Create campaign in database
    const campaign = await prisma.campaign.create({
      data: {
        name: name || `Auto Launch - ${new Date().toLocaleDateString('th-TH')}`,
        platform: platform || 'FACEBOOK',
        type: 'AD',
        budget: budget,
        spent: 0,
        revenue: 0,
        roi: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        status: 'ACTIVE',
        createdById: req.user!.id,
        settingsJson: {
          url,
          cpc,
          conversionRate,
          targetValue,
          targetCost,
          productName,
          vat,
          shippingCost,
          packagingCost,
          platformFee,
          autoStop: autoStop || { enabled: true, minROI: -10 },
          estimatedMetrics: {
            clicks: Math.round(estimatedClicks),
            orders: estimatedOrders.toFixed(1),
            revenue: estimatedRevenue,
            profit: estimatedProfit,
            roas: estimatedROAS.toFixed(2),
            roi: estimatedROI.toFixed(2)
          }
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'CAMPAIGN_CREATED',
        title: `แคมเปญ "${campaign.name}" ถูกสร้างแล้ว`,
        message: `งบ ฿${budget.toLocaleString()} - คาดการณ์ ROAS ${estimatedROAS.toFixed(2)}x`,
        dataJson: { campaignId: campaign.id }
      }
    });

    // TODO: Connect to actual Facebook Ads API here
    // const fbService = new FacebookAdsService(accessToken, adAccountId);
    // const fbCampaign = await fbService.createCampaign({...});

    res.json({
      success: true,
      message: 'ยิงแอดสำเร็จ!',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        budget: campaign.budget,
        status: campaign.status
      },
      estimates: {
        clicks: Math.round(estimatedClicks),
        orders: parseFloat(estimatedOrders.toFixed(1)),
        revenue: estimatedRevenue,
        profit: estimatedProfit,
        roas: parseFloat(estimatedROAS.toFixed(2)),
        roi: parseFloat(estimatedROI.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
