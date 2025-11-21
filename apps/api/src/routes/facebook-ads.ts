import { Router } from 'express';
import { FacebookAdsService } from '../services/facebookAds.service';
import { AdOptimizerService } from '../services/adOptimizer.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Store for Facebook settings (in production, use database)
const facebookSettings: Map<string, { accessToken: string; adAccountId: string; pageId: string }> = new Map();

// Save Facebook settings
router.post('/settings', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { accessToken, adAccountId, pageId } = req.body;

    if (!accessToken || !adAccountId) {
      throw new AppError(400, 'Access Token and Ad Account ID are required');
    }

    facebookSettings.set(req.user!.id, {
      accessToken,
      adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`,
      pageId: pageId || ''
    });

    logger.info(`Facebook settings saved for user ${req.user!.id}`);

    res.json({
      message: 'Facebook settings saved successfully',
      adAccountId: facebookSettings.get(req.user!.id)?.adAccountId
    });
  } catch (error) {
    next(error);
  }
});

// Get Facebook settings status
router.get('/settings', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const settings = facebookSettings.get(req.user!.id);

    res.json({
      configured: !!settings,
      adAccountId: settings?.adAccountId || null,
      hasPageId: !!settings?.pageId
    });
  } catch (error) {
    next(error);
  }
});

// Auto-launch campaign (one-click)
router.post('/auto-launch', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, budget, targetAudience, creative } = req.body;

    // Get Facebook settings
    const settings = facebookSettings.get(req.user!.id);

    if (!settings) {
      throw new AppError(400, 'Please configure Facebook Access Token first');
    }

    if (!name || !budget) {
      throw new AppError(400, 'Campaign name and budget are required');
    }

    const fbService = new FacebookAdsService(settings.accessToken, settings.adAccountId);

    // 1. Create Campaign
    logger.info(`Creating campaign: ${name}`);
    const campaign = await fbService.createCampaign({
      name,
      objective: 'OUTCOME_SALES',
      budget: parseFloat(budget),
      status: 'ACTIVE'
    });

    // 2. Create Ad Set with targeting
    const defaultTargeting = {
      age_min: targetAudience?.ageMin || 18,
      age_max: targetAudience?.ageMax || 65,
      geo_locations: {
        countries: targetAudience?.countries || ['TH']
      },
      ...(targetAudience?.interests && { interests: targetAudience.interests })
    };

    const adSet = await fbService.createAdSet(campaign.id, {
      name: `${name} - Ad Set`,
      targetingSpec: defaultTargeting,
      optimization_goal: 'OFFSITE_CONVERSIONS',
      billing_event: 'IMPRESSIONS',
      bid_amount: parseFloat(budget) * 0.1
    });

    // 3. Create Creative (if provided)
    let adCreative = null;
    let ad = null;

    if (creative && settings.pageId) {
      adCreative = await fbService.createCreative({
        name: `${name} - Creative`,
        title: creative.title || name,
        body: creative.body || '',
        image_url: creative.image || '',
        link: creative.link || '',
        pageId: settings.pageId
      });

      // 4. Create Ad
      ad = await fbService.createAd(adSet.id, adCreative.id, name);
    }

    // Return result
    res.json({
      message: 'Facebook campaign launched successfully!',
      campaign: {
        id: campaign.id,
        name,
        budget,
        status: 'ACTIVE',
        fbCampaignId: campaign.id,
        fbAdSetId: adSet.id,
        fbAdId: ad?.id || null
      }
    });
  } catch (error: any) {
    logger.error(`Auto-launch error: ${error.message}`);
    next(new AppError(500, `Failed to launch campaign: ${error.response?.data?.error?.message || error.message}`));
  }
});

// Get campaign insights
router.get('/insights/:adId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { adId } = req.params;
    const settings = facebookSettings.get(req.user!.id);

    if (!settings) {
      throw new AppError(400, 'Please configure Facebook Access Token first');
    }

    const fbService = new FacebookAdsService(settings.accessToken, settings.adAccountId);
    const insights = await fbService.getAdInsights(adId);

    if (!insights) {
      throw new AppError(404, 'No insights available for this ad');
    }

    // Calculate additional metrics
    const spend = parseFloat(insights.spend) || 0;
    const clicks = parseInt(insights.clicks) || 0;
    const conversions = parseInt(insights.conversions) || 0;
    const roas = insights.purchase_roas?.[0]?.value ? parseFloat(insights.purchase_roas[0].value) : 0;
    const revenue = roas * spend;
    const profit = revenue - spend;
    const roi = spend > 0 ? (profit / spend) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;

    res.json({
      ...insights,
      calculated: {
        revenue,
        profit,
        roi: roi.toFixed(2),
        roas: roas.toFixed(2),
        cpc: cpc.toFixed(2),
        cpa: cpa.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Pause campaign
router.post('/pause/:campaignId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { campaignId } = req.params;
    const settings = facebookSettings.get(req.user!.id);

    if (!settings) {
      throw new AppError(400, 'Please configure Facebook Access Token first');
    }

    const fbService = new FacebookAdsService(settings.accessToken, settings.adAccountId);
    await fbService.pauseCampaign(campaignId);

    res.json({ message: 'Campaign paused successfully' });
  } catch (error) {
    next(error);
  }
});

// Resume campaign
router.post('/resume/:campaignId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { campaignId } = req.params;
    const settings = facebookSettings.get(req.user!.id);

    if (!settings) {
      throw new AppError(400, 'Please configure Facebook Access Token first');
    }

    const fbService = new FacebookAdsService(settings.accessToken, settings.adAccountId);
    await fbService.resumeCampaign(campaignId);

    res.json({ message: 'Campaign resumed successfully' });
  } catch (error) {
    next(error);
  }
});

// Trigger manual optimization
router.post('/optimize', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const settings = facebookSettings.get(req.user!.id);

    if (!settings) {
      throw new AppError(400, 'Please configure Facebook Access Token first');
    }

    const fbService = new FacebookAdsService(settings.accessToken, settings.adAccountId);
    const optimizer = new AdOptimizerService(fbService);
    const results = await optimizer.triggerOptimization();

    res.json({
      message: 'Optimization completed',
      results
    });
  } catch (error) {
    next(error);
  }
});

// List Facebook campaigns
router.get('/campaigns', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const settings = facebookSettings.get(req.user!.id);

    if (!settings) {
      throw new AppError(400, 'Please configure Facebook Access Token first');
    }

    const fbService = new FacebookAdsService(settings.accessToken, settings.adAccountId);
    const campaigns = await fbService.listCampaigns();

    res.json(campaigns);
  } catch (error) {
    next(error);
  }
});

export default router;
