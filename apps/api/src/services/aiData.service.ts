import { prisma } from '@sakura/database';
import { logger } from '../utils/logger';

export class AIDataService {
  // Get sales summary for a period
  async getSalesSummary(userId: string, period: 'today' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    try {
      const orders = await prisma.order.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        include: {
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);
      const totalCost = orders.reduce((sum, order) => sum + parseFloat(order.totalCost?.toString() || '0'), 0);
      const totalProfit = totalRevenue - totalCost;
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        period,
        totalRevenue,
        totalCost,
        totalProfit,
        totalOrders,
        avgOrderValue,
        recentOrders: orders.slice(0, 10).map(o => ({
          id: o.id,
          total: o.totalAmount,
          date: o.createdAt,
          status: o.status
        }))
      };
    } catch (error) {
      logger.error('Error getting sales summary:', error);
      return {
        period,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        recentOrders: []
      };
    }
  }

  // Get top selling products
  async getTopProducts(userId: string, limit = 10) {
    try {
      const products = await prisma.product.findMany({
        where: { userId },
        include: {
          orderItems: true
        }
      });

      const productSales = products.map(product => {
        const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = product.orderItems.reduce((sum, item) =>
          sum + (item.quantity * parseFloat(item.price.toString())), 0
        );

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: parseFloat(product.price.toString()),
          stock: product.quantity,
          minStock: product.minStock,
          totalSold,
          totalRevenue,
          category: product.category
        };
      });

      return productSales
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting top products:', error);
      return [];
    }
  }

  // Get low stock products that need reorder
  async getLowStockProducts(userId: string) {
    try {
      const products = await prisma.product.findMany({
        where: {
          userId,
          quantity: { lte: prisma.product.fields.minStock }
        },
        orderBy: { quantity: 'asc' }
      });

      // Fallback: get products where quantity < minStock manually
      const allProducts = await prisma.product.findMany({
        where: { userId }
      });

      const lowStock = allProducts.filter(p => p.quantity <= p.minStock);

      return lowStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.quantity,
        minStock: p.minStock,
        price: parseFloat(p.price.toString()),
        category: p.category,
        suggestedOrder: Math.max((p.minStock * 2) - p.quantity, p.minStock)
      }));
    } catch (error) {
      logger.error('Error getting low stock products:', error);
      return [];
    }
  }

  // Get customer insights
  async getCustomerInsights(userId: string, limit = 10) {
    try {
      const customers = await prisma.customer.findMany({
        where: { userId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      const customerData = customers.map(customer => {
        const totalOrders = customer.orders.length;
        const totalSpent = customer.orders.reduce((sum, order) =>
          sum + parseFloat(order.totalAmount.toString()), 0
        );
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const lastOrder = customer.orders[0];

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          type: customer.type,
          totalOrders,
          totalSpent,
          avgOrderValue,
          lastOrderDate: lastOrder?.createdAt,
          lifetimeValue: totalSpent
        };
      });

      return customerData
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting customer insights:', error);
      return [];
    }
  }

  // Get campaign performance
  async getCampaignPerformance(userId: string) {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return campaigns.map(c => {
        const spent = parseFloat(c.spent?.toString() || '0');
        const revenue = parseFloat(c.revenue?.toString() || '0');
        const budget = parseFloat(c.budget?.toString() || '0');
        const profit = revenue - spent;
        const roi = spent > 0 ? ((profit / spent) * 100) : 0;
        const roas = spent > 0 ? (revenue / spent) : 0;

        return {
          id: c.id,
          name: c.name,
          platform: c.platform,
          type: c.type,
          budget,
          spent,
          revenue,
          profit,
          roi: roi.toFixed(2),
          roas: roas.toFixed(2),
          status: c.status,
          impressions: c.impressions,
          clicks: c.clicks,
          conversions: c.conversions,
          startDate: c.startDate,
          endDate: c.endDate
        };
      });
    } catch (error) {
      logger.error('Error getting campaign performance:', error);
      return [];
    }
  }

  // Get business overview (all data combined)
  async getBusinessOverview(userId: string) {
    const [
      salesSummary,
      topProducts,
      lowStock,
      topCustomers,
      campaigns
    ] = await Promise.all([
      this.getSalesSummary(userId, 'month'),
      this.getTopProducts(userId, 5),
      this.getLowStockProducts(userId),
      this.getCustomerInsights(userId, 5),
      this.getCampaignPerformance(userId)
    ]);

    return {
      salesSummary,
      topProducts,
      lowStock,
      topCustomers,
      campaigns: campaigns.slice(0, 5)
    };
  }

  // Get sales trends
  async getTrends(userId: string, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orders = await prisma.order.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by day
      const dailySales: Record<string, { revenue: number; orders: number }> = {};
      orders.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!dailySales[date]) {
          dailySales[date] = { revenue: 0, orders: 0 };
        }
        dailySales[date].revenue += parseFloat(order.totalAmount.toString());
        dailySales[date].orders += 1;
      });

      // Calculate growth rate
      const dates = Object.keys(dailySales).sort();
      const recentDays = dates.slice(-7);
      const previousDays = dates.slice(-14, -7);

      const recentSales = recentDays.reduce((sum, date) => sum + dailySales[date].revenue, 0);
      const previousSales = previousDays.reduce((sum, date) => sum + dailySales[date].revenue, 0);
      const growthRate = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;

      let trend = 'คงที่';
      if (growthRate > 5) trend = 'เติบโต';
      else if (growthRate < -5) trend = 'ลดลง';

      return {
        dailySales,
        recentSales,
        previousSales,
        growthRate: growthRate.toFixed(2),
        trend,
        totalDays: dates.length
      };
    } catch (error) {
      logger.error('Error getting trends:', error);
      return {
        dailySales: {},
        recentSales: 0,
        previousSales: 0,
        growthRate: '0',
        trend: 'ไม่มีข้อมูล',
        totalDays: 0
      };
    }
  }

  // Get order analytics
  async getOrderAnalytics(userId: string) {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: { product: true }
          },
          customer: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const statusCounts: Record<string, number> = {};
      const hourlyDistribution: Record<number, number> = {};

      orders.forEach(order => {
        // Count by status
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

        // Hourly distribution
        const hour = new Date(order.createdAt).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });

      // Find peak hours
      const peakHour = Object.entries(hourlyDistribution)
        .sort(([, a], [, b]) => b - a)[0];

      return {
        totalOrders: orders.length,
        statusCounts,
        hourlyDistribution,
        peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
        recentOrders: orders.slice(0, 10).map(o => ({
          id: o.id,
          customer: o.customer?.name || 'ลูกค้าทั่วไป',
          total: o.totalAmount,
          status: o.status,
          date: o.createdAt
        }))
      };
    } catch (error) {
      logger.error('Error getting order analytics:', error);
      return {
        totalOrders: 0,
        statusCounts: {},
        hourlyDistribution: {},
        peakHour: 'N/A',
        recentOrders: []
      };
    }
  }
}

export const aiDataService = new AIDataService();
