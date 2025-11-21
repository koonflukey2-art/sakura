import axios from 'axios';
import { logger } from '../utils/logger';

export interface CreateCampaignData {
  name: string;
  objective: 'OUTCOME_TRAFFIC' | 'OUTCOME_SALES' | 'OUTCOME_LEADS' | 'OUTCOME_AWARENESS';
  budget: number;
  status: 'ACTIVE' | 'PAUSED';
}

export interface CreateAdSetData {
  name: string;
  targetingSpec: {
    age_min?: number;
    age_max?: number;
    genders?: number[];
    geo_locations?: {
      countries?: string[];
      cities?: { key: string }[];
    };
    interests?: { id: string; name: string }[];
  };
  optimization_goal: string;
  billing_event: string;
  bid_amount: number;
}

export interface CreateCreativeData {
  name: string;
  title: string;
  body: string;
  image_url: string;
  link: string;
  pageId: string;
}

export interface AdInsights {
  spend: string;
  impressions: string;
  clicks: string;
  conversions: string;
  cost_per_conversion: string;
  purchase_roas: { value: string }[];
}

export class FacebookAdsService {
  private accessToken: string;
  private adAccountId: string;
  private apiVersion = 'v18.0';
  private baseUrl = 'https://graph.facebook.com';

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}/${this.apiVersion}/${endpoint}`;
  }

  // Create a new campaign
  async createCampaign(data: CreateCampaignData) {
    try {
      const response = await axios.post(
        this.getUrl(`${this.adAccountId}/campaigns`),
        {
          name: data.name,
          objective: data.objective,
          status: data.status,
          daily_budget: data.budget * 100, // Convert to cents
          access_token: this.accessToken,
          special_ad_categories: [],
        }
      );
      logger.info(`Campaign created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error creating campaign: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Create an Ad Set
  async createAdSet(campaignId: string, data: CreateAdSetData) {
    try {
      const response = await axios.post(
        this.getUrl(`${this.adAccountId}/adsets`),
        {
          name: data.name,
          campaign_id: campaignId,
          targeting: data.targetingSpec,
          optimization_goal: data.optimization_goal,
          billing_event: data.billing_event,
          bid_amount: data.bid_amount * 100,
          status: 'ACTIVE',
          access_token: this.accessToken,
        }
      );
      logger.info(`Ad Set created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error creating ad set: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Create Ad Creative
  async createCreative(data: CreateCreativeData) {
    try {
      const response = await axios.post(
        this.getUrl(`${this.adAccountId}/adcreatives`),
        {
          name: data.name,
          object_story_spec: {
            page_id: data.pageId,
            link_data: {
              link: data.link,
              message: data.body,
              name: data.title,
              picture: data.image_url,
            },
          },
          access_token: this.accessToken,
        }
      );
      logger.info(`Creative created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error creating creative: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Create an Ad
  async createAd(adSetId: string, creativeId: string, name: string) {
    try {
      const response = await axios.post(
        this.getUrl(`${this.adAccountId}/ads`),
        {
          name,
          adset_id: adSetId,
          creative: { creative_id: creativeId },
          status: 'ACTIVE',
          access_token: this.accessToken,
        }
      );
      logger.info(`Ad created: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error creating ad: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Get Ad Insights (ROI, Spend, Revenue)
  async getAdInsights(adId: string): Promise<AdInsights | null> {
    try {
      const response = await axios.get(
        this.getUrl(`${adId}/insights`),
        {
          params: {
            fields: 'spend,impressions,clicks,conversions,cost_per_conversion,purchase_roas',
            access_token: this.accessToken,
          },
        }
      );
      return response.data.data?.[0] || null;
    } catch (error: any) {
      logger.error(`Error getting insights: ${error.response?.data?.error?.message || error.message}`);
      return null;
    }
  }

  // Pause a campaign
  async pauseCampaign(campaignId: string) {
    try {
      const response = await axios.post(
        this.getUrl(campaignId),
        {
          status: 'PAUSED',
          access_token: this.accessToken,
        }
      );
      logger.info(`Campaign paused: ${campaignId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error pausing campaign: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Pause an Ad
  async pauseAd(adId: string) {
    try {
      const response = await axios.post(
        this.getUrl(adId),
        {
          status: 'PAUSED',
          access_token: this.accessToken,
        }
      );
      logger.info(`Ad paused: ${adId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error pausing ad: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Resume a campaign
  async resumeCampaign(campaignId: string) {
    try {
      const response = await axios.post(
        this.getUrl(campaignId),
        {
          status: 'ACTIVE',
          access_token: this.accessToken,
        }
      );
      logger.info(`Campaign resumed: ${campaignId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error resuming campaign: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // Get campaign details
  async getCampaign(campaignId: string) {
    try {
      const response = await axios.get(
        this.getUrl(campaignId),
        {
          params: {
            fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
            access_token: this.accessToken,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Error getting campaign: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // List all campaigns
  async listCampaigns() {
    try {
      const response = await axios.get(
        this.getUrl(`${this.adAccountId}/campaigns`),
        {
          params: {
            fields: 'id,name,status,objective,daily_budget,lifetime_budget',
            access_token: this.accessToken,
          },
        }
      );
      return response.data.data || [];
    } catch (error: any) {
      logger.error(`Error listing campaigns: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }
}
