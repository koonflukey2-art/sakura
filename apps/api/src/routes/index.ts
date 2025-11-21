import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import stockRoutes from './stock';
import customerRoutes from './customers';
import orderRoutes from './orders';
import budgetRoutes from './budget';
import campaignRoutes from './campaigns';
import analyticsRoutes from './analytics';
import notificationRoutes from './notifications';
import aiRoutes from './ai';
import facebookAdsRoutes from './facebook-ads';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stock', stockRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/budget', budgetRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/facebook-ads', facebookAdsRoutes);

export default router;
