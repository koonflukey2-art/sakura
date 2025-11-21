import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma, UserRole } from '@sakura/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Validation schema
const aiExecuteSchema = z.object({
  provider: z.enum(['gpt', 'gemini']).default('gpt'),
  page: z.string(),
  action: z.string(),
  payload: z.record(z.any()).optional(),
  customPrompt: z.string().optional(),
});

// Permission check for AI usage
const canUseAI = (role: UserRole, page: string): boolean => {
  // ADMIN can use AI everywhere
  if (role === UserRole.ADMIN) return true;

  // STAFF_STOCK can use AI on stock pages
  if (role === UserRole.STAFF_STOCK && page === 'stock') return true;

  // STAFF_MARKETING can use AI on campaigns/analytics pages
  if (role === UserRole.STAFF_MARKETING && (page === 'campaigns' || page === 'analytics')) {
    return true;
  }

  // VIEWER cannot use AI
  return false;
};

// AI Service helper
async function executeAI(
  provider: 'gpt' | 'gemini',
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  try {
    if (provider === 'gpt') {
      if (!openai) {
        throw new AppError(500, 'OpenAI API key not configured');
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || 'No response';
    } else {
      if (!genAI) {
        throw new AppError(500, 'Gemini API key not configured');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;

      return response.text();
    }
  } catch (error: any) {
    logger.error(`AI execution error: ${error.message}`);
    throw new AppError(500, `AI service error: ${error.message}`);
  }
}

// POST /api/ai/execute - รัน AI analysis
router.post('/execute', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { provider, page, action, payload, customPrompt } = aiExecuteSchema.parse(req.body);

    // Check permission
    if (!canUseAI(req.user!.role, page)) {
      throw new AppError(403, 'You do not have permission to use AI on this page');
    }

    let systemPrompt = '';
    let userPrompt = customPrompt || '';

    // Build prompts based on page and action
    if (page === 'stock') {
      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์การจัดการสต๊อกสินค้า ให้คำแนะนำที่เป็นประโยชน์และชัดเจนเป็นภาษาไทย`;

      if (action === 'analyze_stock') {
        const items = payload?.items || [];
        userPrompt =
          userPrompt ||
          `วิเคราะห์ข้อมูลสต๊อกสินค้าต่อไปนี้และให้คำแนะนำว่าควรสั่งซื้อสินค้าใดเพิ่ม หรือสินค้าใดนอนกอง:\n\n${JSON.stringify(items, null, 2)}`;
      } else if (action === 'suggest_reorder') {
        userPrompt =
          userPrompt ||
          `จากข้อมูลสินค้าและยอดขายย้อนหลัง แนะนำว่าควรสั่งซื้อสินค้าใหม่กี่ชิ้น:\n\n${JSON.stringify(payload, null, 2)}`;
      }
    } else if (page === 'budget') {
      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์งบประมาณและการเงิน ให้คำแนะนำที่เป็นประโยชน์เป็นภาษาไทย`;

      if (action === 'should_approve_budget') {
        userPrompt =
          userPrompt ||
          `วิเคราะห์คำขอใช้งบประมาณและแนะนำว่าควรอนุมัติหรือไม่:\n\n${JSON.stringify(payload, null, 2)}`;
      }
    } else if (page === 'analytics') {
      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์ข้อมูลและแนวโน้มทางธุรกิจ ให้ insight ที่มีคุณค่าเป็นภาษาไทย`;

      if (action === 'explain_profit_trend') {
        userPrompt =
          userPrompt ||
          `วิเคราะห์แนวโน้มกำไรและให้คำอธิบายว่าทำไมมีการเปลี่ยนแปลง:\n\n${JSON.stringify(payload, null, 2)}`;
      } else if (action === 'suggest_marketing_strategy') {
        userPrompt =
          userPrompt ||
          `จากข้อมูลการขายและลูกค้า แนะนำกลยุทธ์ทางการตลาด:\n\n${JSON.stringify(payload, null, 2)}`;
      }
    } else if (page === 'campaigns') {
      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์แคมเปญโฆษณาและการตลาดดิจิทัล ให้คำแนะนำเชิงกลยุทธ์เป็นภาษาไทย`;

      if (action === 'generate_campaign_idea') {
        userPrompt =
          userPrompt ||
          `สร้างไอเดียแคมเปญโฆษณาใหม่จากข้อมูลต่อไปนี้:\n\n${JSON.stringify(payload, null, 2)}`;
      } else if (action === 'optimize_ad_budget') {
        userPrompt =
          userPrompt ||
          `วิเคราะห์และแนะนำวิธีจัดสรรงบโฆษณาให้มีประสิทธิภาพ:\n\n${JSON.stringify(payload, null, 2)}`;
      }
    }

    // Execute AI
    const response = await executeAI(provider, systemPrompt, userPrompt);

    // Log AI usage
    await prisma.aiLog.create({
      data: {
        userId: req.user!.id,
        page,
        action,
        requestPrompt: userPrompt,
        response,
        provider,
      },
    });

    res.json({
      response,
      provider,
      page,
      action,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/logs - ดึงประวัติการใช้ AI (เฉพาะ ADMIN)
router.get('/logs', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res, next) => {
  try {
    const { page, userId, limit = '50' } = req.query;

    const where: any = {};

    if (page) {
      where.page = page;
    }

    if (userId) {
      where.userId = userId;
    }

    const logs = await prisma.aiLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
