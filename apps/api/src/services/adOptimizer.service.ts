import { FacebookAdsService } from './facebookAds.service';
import { logger } from '../utils/logger';

// Note: In a real implementation, this would use Prisma
// For now, we'll create a mock interface
interface Campaign {
  id: string;
  userId: string;
  name: string;
  platform: string;
  status: string;
  fbAdId?: string;
  spent?: number;
  revenue?: number;
  roi?: number;
}

interface Notification {
  userId: string;
  type: string;
  title: string;
  message: string;
}

// Mock database functions (replace with actual Prisma calls)
const mockDb = {
  campaigns: [] as Campaign[],
  notifications: [] as Notification[],

  async findCampaigns(filter: { status: string; platform: string }): Promise<Campaign[]> {
    return this.campaigns.filter(c => c.status === filter.status && c.platform === filter.platform);
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
    const index = this.campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      this.campaigns[index] = { ...this.campaigns[index], ...data };
      return this.campaigns[index];
    }
    return null;
  },

  async createNotification(data: Notification): Promise<Notification> {
    this.notifications.push(data);
    return data;
  }
};

export class AdOptimizerService {
  private fbService: FacebookAdsService;
  private optimizerInterval: NodeJS.Timeout | null = null;

  // Thresholds for optimization
  private readonly ROI_LOSS_THRESHOLD = -10; // Stop if ROI < -10%
  private readonly ROI_EXCELLENT_THRESHOLD = 50; // Suggest budget increase if ROI > 50%
  private readonly CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor(fbService: FacebookAdsService) {
    this.fbService = fbService;
  }

  // Check ROI and optimize campaign
  async checkAndOptimize(campaign: Campaign): Promise<{
    action: 'paused' | 'continued' | 'recommended_increase' | 'no_action';
    roi: number;
    message: string;
  }> {
    if (!campaign.fbAdId) {
      return { action: 'no_action', roi: 0, message: 'No Facebook Ad ID linked' };
    }

    try {
      // Get insights from Facebook
      const insights = await this.fbService.getAdInsights(campaign.fbAdId);

      if (!insights) {
        return { action: 'no_action', roi: 0, message: 'No insights available' };
      }

      const spend = parseFloat(insights.spend) || 0;
      const roas = insights.purchase_roas?.[0]?.value ? parseFloat(insights.purchase_roas[0].value) : 0;
      const revenue = roas * spend;
      const profit = revenue - spend;
      const roi = spend > 0 ? (profit / spend) * 100 : 0;

      // Update campaign metrics in database
      await mockDb.updateCampaign(campaign.id, {
        spent: spend,
        revenue: revenue,
        roi: roi
      });

      // If ROI is below loss threshold, pause the ad
      if (roi < this.ROI_LOSS_THRESHOLD) {
        await this.fbService.pauseAd(campaign.fbAdId);

        // Update campaign status
        await mockDb.updateCampaign(campaign.id, { status: 'PAUSED' });

        // Create warning notification
        await mockDb.createNotification({
          userId: campaign.userId,
          type: 'CAMPAIGN_WARNING',
          title: `Campaign "${campaign.name}" auto-paused`,
          message: `ROI: ${roi.toFixed(2)}% (loss) - Campaign paused to save budget`
        });

        logger.warn(`Campaign ${campaign.id} paused due to low ROI: ${roi.toFixed(2)}%`);

        return {
          action: 'paused',
          roi,
          message: `Campaign paused due to negative ROI (${roi.toFixed(2)}%)`
        };
      }

      // If ROI is excellent, suggest budget increase
      if (roi > this.ROI_EXCELLENT_THRESHOLD) {
        await mockDb.createNotification({
          userId: campaign.userId,
          type: 'CAMPAIGN_SUCCESS',
          title: `Campaign "${campaign.name}" performing great!`,
          message: `ROI: ${roi.toFixed(2)}% - Consider increasing budget for more results`
        });

        logger.info(`Campaign ${campaign.id} has excellent ROI: ${roi.toFixed(2)}%`);

        return {
          action: 'recommended_increase',
          roi,
          message: `Excellent performance (ROI: ${roi.toFixed(2)}%) - Consider increasing budget`
        };
      }

      return {
        action: 'continued',
        roi,
        message: `Campaign performing normally (ROI: ${roi.toFixed(2)}%)`
      };

    } catch (error: any) {
      logger.error(`Error optimizing campaign ${campaign.id}: ${error.message}`);
      return {
        action: 'no_action',
        roi: 0,
        message: `Error checking campaign: ${error.message}`
      };
    }
  }

  // Run auto-optimizer for all active Facebook campaigns
  async runOptimization(): Promise<{
    checked: number;
    paused: number;
    recommended: number;
    errors: number;
  }> {
    const results = {
      checked: 0,
      paused: 0,
      recommended: 0,
      errors: 0
    };

    try {
      const activeCampaigns = await mockDb.findCampaigns({
        status: 'ACTIVE',
        platform: 'FACEBOOK'
      });

      for (const campaign of activeCampaigns) {
        try {
          const result = await this.checkAndOptimize(campaign);
          results.checked++;

          if (result.action === 'paused') results.paused++;
          if (result.action === 'recommended_increase') results.recommended++;

        } catch (error: any) {
          results.errors++;
          logger.error(`Error optimizing campaign ${campaign.id}: ${error.message}`);
        }
      }

      logger.info(`Optimization complete: ${results.checked} checked, ${results.paused} paused, ${results.recommended} recommended`);

    } catch (error: any) {
      logger.error(`Error running optimization: ${error.message}`);
    }

    return results;
  }

  // Start auto-optimizer interval
  startAutoOptimizer() {
    if (this.optimizerInterval) {
      logger.warn('Auto-optimizer already running');
      return;
    }

    logger.info('Starting auto-optimizer (checking every hour)');

    // Run immediately
    this.runOptimization();

    // Then run every hour
    this.optimizerInterval = setInterval(() => {
      this.runOptimization();
    }, this.CHECK_INTERVAL);
  }

  // Stop auto-optimizer
  stopAutoOptimizer() {
    if (this.optimizerInterval) {
      clearInterval(this.optimizerInterval);
      this.optimizerInterval = null;
      logger.info('Auto-optimizer stopped');
    }
  }

  // Manual trigger for optimization
  async triggerOptimization(): Promise<{
    checked: number;
    paused: number;
    recommended: number;
    errors: number;
  }> {
    logger.info('Manual optimization triggered');
    return this.runOptimization();
  }
}
