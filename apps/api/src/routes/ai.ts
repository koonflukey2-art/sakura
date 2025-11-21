import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma, UserRole } from '@sakura/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { aiDataService } from '../services/aiData.service';

const router = Router();

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Validation schema
const aiExecuteSchema = z.object({
  provider: z.enum(['gpt', 'gemini']).default('gemini'),
  page: z.string(),
  action: z.string(),
  payload: z.record(z.any()).optional(),
  customPrompt: z.string().optional(),
});

// Permission check for AI usage
const canUseAI = (role: UserRole, page: string): boolean => {
  if (role === UserRole.ADMIN) return true;
  if (role === UserRole.STAFF_STOCK && (page === 'stock' || page === 'dashboard')) return true;
  if (role === UserRole.STAFF_MARKETING && ['campaigns', 'analytics', 'customers', 'dashboard'].includes(page)) {
    return true;
  }
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

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

// POST /api/ai/execute - Run AI analysis with real database data
router.post('/execute', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { provider, page, action, payload, customPrompt } = aiExecuteSchema.parse(req.body);
    const userId = req.user!.id;

    // Check permission
    if (!canUseAI(req.user!.role, page)) {
      throw new AppError(403, 'You do not have permission to use AI on this page');
    }

    let systemPrompt = '';
    let userPrompt = customPrompt || '';
    let contextData: any = {};

    // =============================================
    // DASHBOARD - Business Overview Analysis
    // =============================================
    if (page === 'dashboard') {
      contextData = await aiDataService.getBusinessOverview(userId);

      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์ธุรกิจอัจฉริยะ ตอบเป็นภาษาไทย

📊 ข้อมูลธุรกิจปัจจุบัน (ข้อมูลจริงจาก Database):

💰 ยอดขายเดือนนี้:
- รายได้รวม: ฿${contextData.salesSummary.totalRevenue.toLocaleString()}
- กำไรสุทธิ: ฿${contextData.salesSummary.totalProfit.toLocaleString()}
- จำนวนออเดอร์: ${contextData.salesSummary.totalOrders} รายการ
- มูลค่าเฉลี่ย/ออเดอร์: ฿${contextData.salesSummary.avgOrderValue.toFixed(2)}

🏆 สินค้าขายดีท็อป 5:
${contextData.topProducts.length > 0 ? contextData.topProducts.map((p: any, i: number) =>
  `${i + 1}. ${p.name} - ขายได้ ${p.totalSold} ชิ้น (฿${p.totalRevenue.toLocaleString()})`
).join('\n') : 'ยังไม่มีข้อมูลสินค้าขายดี'}

⚠️ สินค้าที่สต็อกต่ำ (${contextData.lowStock.length} รายการ):
${contextData.lowStock.length > 0 ? contextData.lowStock.slice(0, 5).map((p: any) =>
  `- ${p.name}: เหลือ ${p.currentStock} ชิ้น (ขั้นต่ำ ${p.minStock})`
).join('\n') : 'ไม่มีสินค้าสต็อกต่ำ'}

👥 ลูกค้าท็อป 5:
${contextData.topCustomers.length > 0 ? contextData.topCustomers.map((c: any, i: number) =>
  `${i + 1}. ${c.name} - ซื้อ ${c.totalOrders} ครั้ง (฿${c.totalSpent.toLocaleString()})`
).join('\n') : 'ยังไม่มีข้อมูลลูกค้า'}

📢 แคมเปญโฆษณา:
${contextData.campaigns.length > 0 ? contextData.campaigns.map((c: any) =>
  `- ${c.name} (${c.platform}): ROI ${c.roi}%, สถานะ ${c.status}`
).join('\n') : 'ยังไม่มีแคมเปญ'}

วิเคราะห์และให้คำแนะนำที่เป็นประโยชน์ตามข้อมูลจริงข้างต้น`;

      userPrompt = customPrompt || 'วิเคราะห์ภาพรวมธุรกิจและให้คำแนะนำ 3-5 ข้อ ที่นำไปใช้ได้จริง';
    }

    // =============================================
    // STOCK - Inventory Analysis
    // =============================================
    else if (page === 'stock') {
      const lowStock = await aiDataService.getLowStockProducts(userId);
      const topProducts = await aiDataService.getTopProducts(userId, 10);
      contextData = { lowStock, topProducts };

      systemPrompt = `คุณเป็น AI ผู้ช่วยจัดการสต็อกสินค้า ตอบเป็นภาษาไทย

📦 สินค้าที่สต็อกต่ำ (${lowStock.length} รายการ):
${lowStock.length > 0 ? lowStock.map((p: any) =>
  `- ${p.name} (${p.sku}): เหลือ ${p.currentStock} ชิ้น, ขั้นต่ำ ${p.minStock}, ราคา ฿${p.price}
   แนะนำสั่ง: ${p.suggestedOrder} ชิ้น`
).join('\n') : 'ไม่มีสินค้าสต็อกต่ำ'}

🏆 สินค้าขายดี:
${topProducts.slice(0, 5).map((p: any, i: number) =>
  `${i + 1}. ${p.name} - ขาย ${p.totalSold} ชิ้น, คงเหลือ ${p.stock} ชิ้น`
).join('\n')}`;

      if (action === 'suggest_reorder') {
        userPrompt = customPrompt || 'แนะนำการสั่งซื้อสินค้าเพิ่ม โดยพิจารณาจากยอดขายและสต็อกปัจจุบัน';
      } else {
        userPrompt = customPrompt || 'วิเคราะห์สถานการณ์สต็อกและให้คำแนะนำ';
      }
    }

    // =============================================
    // ANALYTICS - Trends Analysis
    // =============================================
    else if (page === 'analytics') {
      const salesData = await aiDataService.getSalesSummary(userId, 'month');
      const trends = await aiDataService.getTrends(userId);
      contextData = { salesData, trends };

      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์ข้อมูลและแนวโน้มทางธุรกิจ ตอบเป็นภาษาไทย

📈 ข้อมูลการขายเดือนนี้:
- รายได้รวม: ฿${salesData.totalRevenue.toLocaleString()}
- กำไรสุทธิ: ฿${salesData.totalProfit.toLocaleString()}
- จำนวนออเดอร์: ${salesData.totalOrders} รายการ

📊 แนวโน้ม:
- อัตราการเติบโต: ${trends.growthRate}%
- แนวโน้ม: ${trends.trend}
- ยอดขาย 7 วันล่าสุด: ฿${trends.recentSales.toLocaleString()}
- ยอดขาย 7 วันก่อนหน้า: ฿${trends.previousSales.toLocaleString()}

ยอดขายรายวัน:
${Object.entries(trends.dailySales).slice(-7).map(([date, data]: [string, any]) =>
  `${date}: ฿${data.revenue.toLocaleString()} (${data.orders} ออเดอร์)`
).join('\n')}`;

      userPrompt = customPrompt || 'วิเคราะห์แนวโน้มและให้คำแนะนำกลยุทธ์';
    }

    // =============================================
    // CAMPAIGNS - Campaign Analysis
    // =============================================
    else if (page === 'campaigns') {
      contextData = await aiDataService.getCampaignPerformance(userId);

      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์แคมเปญโฆษณา ตอบเป็นภาษาไทย

📢 แคมเปญทั้งหมด (${contextData.length} แคมเปญ):
${contextData.length > 0 ? contextData.map((c: any) =>
  `📌 ${c.name} (${c.platform})
   - งบประมาณ: ฿${c.budget.toLocaleString()}, ใช้ไป: ฿${c.spent.toLocaleString()}
   - รายได้: ฿${c.revenue.toLocaleString()}, กำไร: ฿${c.profit.toLocaleString()}
   - ROI: ${c.roi}%, ROAS: ${c.roas}x
   - Impressions: ${c.impressions?.toLocaleString() || 0}, Clicks: ${c.clicks?.toLocaleString() || 0}
   - Conversions: ${c.conversions || 0}, สถานะ: ${c.status}`
).join('\n\n') : 'ยังไม่มีแคมเปญ'}`;

      if (action === 'generate_campaign_ideas') {
        userPrompt = customPrompt || 'สร้างไอเดียแคมเปญใหม่ 3 ไอเดีย ที่เหมาะกับธุรกิจ';
      } else if (action === 'analyze_roi') {
        userPrompt = customPrompt || 'วิเคราะห์ ROI ของทุกแคมเปญและแนะนำว่าควรปรับปรุงหรือหยุดแคมเปญไหน';
      } else {
        userPrompt = customPrompt || 'วิเคราะห์ประสิทธิภาพแคมเปญและให้คำแนะนำ';
      }
    }

    // =============================================
    // CUSTOMERS - Customer Behavior Analysis
    // =============================================
    else if (page === 'customers') {
      contextData = await aiDataService.getCustomerInsights(userId, 15);

      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์ลูกค้า ตอบเป็นภาษาไทย

👥 ลูกค้าท็อป 15:
${contextData.length > 0 ? contextData.map((c: any, i: number) =>
  `${i + 1}. ${c.name} (${c.email || 'ไม่มีอีเมล'})
   - ประเภท: ${c.type || 'ทั่วไป'}
   - ซื้อ: ${c.totalOrders} ครั้ง, ยอดรวม: ฿${c.totalSpent.toLocaleString()}
   - มูลค่าเฉลี่ย: ฿${c.avgOrderValue.toFixed(2)}/ครั้ง
   - Lifetime Value: ฿${c.lifetimeValue.toLocaleString()}`
).join('\n\n') : 'ยังไม่มีข้อมูลลูกค้า'}

สรุป:
- จำนวนลูกค้าทั้งหมด: ${contextData.length} คน
- ลูกค้าที่ซื้อมากที่สุด: ${contextData[0]?.name || 'N/A'} (฿${contextData[0]?.totalSpent.toLocaleString() || 0})`;

      userPrompt = customPrompt || 'วิเคราะห์พฤติกรรมลูกค้าและแนะนำกลยุทธ์การตลาด เช่น โปรโมชั่นที่เหมาะสม';
    }

    // =============================================
    // ORDERS - Sales Analysis
    // =============================================
    else if (page === 'orders') {
      contextData = await aiDataService.getOrderAnalytics(userId);

      systemPrompt = `คุณเป็น AI ผู้ช่วยวิเคราะห์การขาย ตอบเป็นภาษาไทย

🛒 สรุปออเดอร์:
- ออเดอร์ทั้งหมด: ${contextData.totalOrders} รายการ
- ช่วงเวลาขายดีที่สุด: ${contextData.peakHour}

📊 สถานะออเดอร์:
${Object.entries(contextData.statusCounts).map(([status, count]) =>
  `- ${status}: ${count} รายการ`
).join('\n')}

📋 ออเดอร์ล่าสุด:
${contextData.recentOrders.map((o: any, i: number) =>
  `${i + 1}. ${o.id} - ${o.customer} - ฿${parseFloat(o.total).toLocaleString()} (${o.status})`
).join('\n')}`;

      userPrompt = customPrompt || 'วิเคราะห์การขายและแนะนำวิธีเพิ่มยอดขาย';
    }

    // =============================================
    // DEFAULT - Generic Analysis
    // =============================================
    else {
      systemPrompt = `คุณเป็น AI ผู้ช่วยธุรกิจอัจฉริยะ ตอบเป็นภาษาไทย ให้คำแนะนำที่เป็นประโยชน์`;
      userPrompt = customPrompt || `วิเคราะห์ข้อมูลต่อไปนี้:\n${JSON.stringify(payload, null, 2)}`;
      contextData = payload;
    }

    // Execute AI with context
    const response = await executeAI(provider, systemPrompt, userPrompt);

    // Log AI usage with metadata
    await prisma.aiLog.create({
      data: {
        userId,
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
      contextData, // Return context data so frontend knows what AI analyzed
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/logs - Get AI usage history (ADMIN only)
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
