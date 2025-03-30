import { Op, QueryTypes } from 'sequelize';
import { Message, MessageAttributes } from '../models/Message';
import { Customer } from '../models/Customer';
import { CustomerPlatform } from '../models/CustomerPlatform';
import { Purchase, PurchaseItem } from '../models/Purchase';
import { TimeRange, CustomerInteractionAnalytics, ReplyEffectivenessAnalytics, SalesConversionAnalytics } from '../types/analytics';

/**
 * 分析服務
 * 提供客戶互動分析、回覆效果評估和銷售轉化率分析
 */
class AnalyticsService {
  /**
   * 獲取時間範圍的開始日期
   * @param timeRange 時間範圍
   * @returns 開始日期
   */
  private getStartDate(timeRange: TimeRange): Date {
    const now = new Date();
    const startDate = new Date(now);
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // 預設為一週
    }
    
    return startDate;
  }
  
  /**
   * 獲取客戶互動分析
   * @param timeRange 時間範圍
   * @returns 客戶互動分析數據
   */
  async getCustomerInteractionAnalytics(timeRange: TimeRange): Promise<CustomerInteractionAnalytics> {
    const startDate = this.getStartDate(timeRange);
    
    // 獲取訊息總數
    const totalMessages = await Message.count({
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    // 獲取客戶訊息數
    const customerMessages = await Message.count({
      where: {
        isFromCustomer: true,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    // 獲取回覆訊息數
    const replyMessages = await Message.count({
      where: {
        isFromCustomer: false,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    // 獲取平均回覆時間（毫秒）
    const messages = await Message.findAll({
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'customerId', 'isFromCustomer', 'createdAt']
    });
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    // 計算每個客戶訊息的回覆時間
    const messagesByCustomer: Record<string, any[]> = {};
    
    messages.forEach((message) => {
      const customerId = message.customerId;
      if (!messagesByCustomer[customerId]) {
        messagesByCustomer[customerId] = [];
      }
      messagesByCustomer[customerId].push(message);
    });
    
    // 計算每個客戶的平均回覆時間
    Object.values(messagesByCustomer).forEach(customerMessages => {
      for (let i = 0; i < customerMessages.length - 1; i++) {
        const currentMessage = customerMessages[i];
        const nextMessage = customerMessages[i + 1];
        
        // 如果當前訊息是客戶發送的，下一條是客服回覆的
        if (currentMessage.isFromCustomer && !nextMessage.isFromCustomer) {
          const responseTime = nextMessage.createdAt.getTime() - currentMessage.createdAt.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });
    
    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    
    // 獲取活躍客戶數
    const activeCustomers = await Customer.count({
      include: [{
        model: Message,
        as: 'messages',
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        required: true
      }]
    });
    
    // 獲取每個平台的訊息數
    const platformMessages = await Message.findAll({
      include: [{
        model: Customer,
        as: 'customer',
        include: [{
          model: CustomerPlatform,
          as: 'platforms'
        }]
      }],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    const messagesByPlatform: Record<string, number> = {};
    
    platformMessages.forEach((message) => {
      if (message.customer && message.customer.platforms) {
        message.customer.platforms.forEach((platform) => {
          const platformType = platform.type;
          if (!messagesByPlatform[platformType]) {
            messagesByPlatform[platformType] = 0;
          }
          messagesByPlatform[platformType]++;
        });
      }
    });
    
    // 獲取訊息趨勢（按日期分組）
    const messageTrend = await Message.findAll({
      attributes: [
        [
          Message.sequelize!.fn('date_trunc', 'day', Message.sequelize!.col('createdAt')),
          'date'
        ],
        [
          Message.sequelize!.fn('count', Message.sequelize!.col('id')),
          'count'
        ]
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [Message.sequelize!.fn('date_trunc', 'day', Message.sequelize!.col('createdAt'))],
      order: [[Message.sequelize!.fn('date_trunc', 'day', Message.sequelize!.col('createdAt')), 'ASC']]
    });
    
    // 獲取頂部客戶（訊息數最多的客戶）
    const topCustomers = await Customer.findAll({
      include: [{
        model: Message,
        as: 'messages',
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        required: true
      }],
      attributes: [
        'id',
        'name',
        'email',
        [Message.sequelize!.fn('count', Message.sequelize!.col('messages.id')), 'messageCount']
      ],
      group: ['Customer.id'],
      order: [[Message.sequelize!.fn('count', Message.sequelize!.col('messages.id')), 'DESC']],
      limit: 10
    });
    
    return {
      totalMessages,
      customerMessages,
      replyMessages,
      averageResponseTime,
      activeCustomers,
      messagesByPlatform,
      messageTrend: messageTrend.map((item: any) => ({
        date: item.get('date'),
        count: parseInt(item.get('count'), 10)
      })),
      topCustomers: topCustomers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        messageCount: parseInt(customer.get('messageCount'), 10)
      }))
    };
  }
  
  /**
   * 獲取回覆效果評估
   * @param timeRange 時間範圍
   * @returns 回覆效果評估數據
   */
  async getReplyEffectivenessAnalytics(timeRange: TimeRange): Promise<ReplyEffectivenessAnalytics> {
    const startDate = this.getStartDate(timeRange);
    
    // 獲取 AI 回覆百分比
    const totalReplies = await Message.count({
      where: {
        isFromCustomer: false,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    const aiReplies = await Message.count({
      where: {
        isFromCustomer: false,
        isAiGenerated: true,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    const aiReplyPercentage = totalReplies > 0 ? (aiReplies / totalReplies) * 100 : 0;
    
    // 獲取 AI 回覆信心分佈
    const aiRepliesWithConfidence = await Message.findAll({
      where: {
        isFromCustomer: false,
        isAiGenerated: true,
        aiConfidence: {
          [Op.ne]: null
        },
        createdAt: {
          [Op.gte]: startDate
        }
      },
      attributes: ['id', 'aiConfidence']
    });
    
    const confidenceDistribution = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    aiRepliesWithConfidence.forEach((reply) => {
      const confidence = reply.aiConfidence || 0;
      
      if (confidence < 0.4) {
        confidenceDistribution.low++;
      } else if (confidence < 0.7) {
        confidenceDistribution.medium++;
      } else {
        confidenceDistribution.high++;
      }
    });
    
    // 獲取 AI 回覆趨勢
    const aiReplyTrend = await Message.findAll({
      attributes: [
        [
          Message.sequelize!.fn('date_trunc', 'day', Message.sequelize!.col('createdAt')),
          'date'
        ],
        [
          Message.sequelize!.fn('count', Message.sequelize!.col('id')),
          'count'
        ],
        [
          Message.sequelize!.fn('sum', Message.sequelize!.literal('CASE WHEN "isAiGenerated" = true THEN 1 ELSE 0 END')),
          'aiCount'
        ]
      ],
      where: {
        isFromCustomer: false,
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [Message.sequelize!.fn('date_trunc', 'day', Message.sequelize!.col('createdAt'))],
      order: [[Message.sequelize!.fn('date_trunc', 'day', Message.sequelize!.col('createdAt')), 'ASC']]
    });
    
    // 獲取頂部類別（AI 回覆中最常見的類別）
    const topCategories = await Message.findAll({
      attributes: [
        'category',
        [Message.sequelize!.fn('count', Message.sequelize!.col('id')), 'count']
      ],
      where: {
        isFromCustomer: false,
        isAiGenerated: true,
        category: {
          [Op.ne]: null
        },
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: ['category'],
      order: [[Message.sequelize!.fn('count', Message.sequelize!.col('id')), 'DESC']],
      limit: 10
    });
    
    // 獲取人工編輯率
    const editedReplies = await Message.count({
      where: {
        isFromCustomer: false,
        isAiGenerated: true,
        isEdited: true,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    const editRate = aiReplies > 0 ? (editedReplies / aiReplies) * 100 : 0;
    
    return {
      totalReplies,
      aiReplies,
      aiReplyPercentage,
      confidenceDistribution,
      aiReplyTrend: aiReplyTrend.map((item: any) => ({
        date: item.get('date'),
        count: parseInt(item.get('count'), 10),
        aiCount: parseInt(item.get('aiCount'), 10)
      })),
      topCategories: topCategories.map((item: any) => ({
        category: item.category,
        count: parseInt(item.get('count'), 10)
      })),
      editedReplies,
      editRate
    };
  }
  
  /**
   * 獲取銷售轉化率分析
   * @param timeRange 時間範圍
   * @returns 銷售轉化率分析數據
   */
  async getSalesConversionAnalytics(timeRange: TimeRange): Promise<SalesConversionAnalytics> {
    const startDate = this.getStartDate(timeRange);
    
    // 獲取總對話數
    const totalConversations = await Message.sequelize!.query(`
      SELECT COUNT(DISTINCT "conversationId") as count
      FROM "messages"
      WHERE "createdAt" >= :startDate
    `, {
      replacements: { startDate },
      type: QueryTypes.SELECT
    });
    
    // 獲取包含產品推薦的對話數
    const conversationsWithRecommendations = await Message.sequelize!.query(`
      SELECT COUNT(DISTINCT "conversationId") as count
      FROM "messages"
      WHERE "createdAt" >= :startDate
      AND "hasProductRecommendation" = true
    `, {
      replacements: { startDate },
      type: QueryTypes.SELECT
    });
    
    // 獲取導致購買的對話數
    const conversationsWithPurchase = await Message.sequelize!.query(`
      SELECT COUNT(DISTINCT "conversationId") as count
      FROM "messages"
      WHERE "createdAt" >= :startDate
      AND "conversationId" IN (
        SELECT DISTINCT "conversationId"
        FROM "purchases"
        WHERE "createdAt" >= :startDate
      )
    `, {
      replacements: { startDate },
      type: QueryTypes.SELECT
    });
    
    // 計算轉化率
    const totalCount = (totalConversations[0] as any)?.count || 0;
    const recommendationCount = (conversationsWithRecommendations[0] as any)?.count || 0;
    const purchaseCount = (conversationsWithPurchase[0] as any)?.count || 0;
    
    const recommendationRate = totalCount > 0 ? (recommendationCount / totalCount) * 100 : 0;
    const conversionRate = recommendationCount > 0 ? (purchaseCount / recommendationCount) * 100 : 0;
    
    // 獲取平均購買金額
    const averagePurchaseAmount = await Message.sequelize!.query(`
      SELECT AVG("amount") as average
      FROM "purchases"
      WHERE "createdAt" >= :startDate
    `, {
      replacements: { startDate },
      type: QueryTypes.SELECT
    });
    
    // 獲取銷售趨勢
    const salesTrend = await Message.sequelize!.query(`
      SELECT 
        date_trunc('day', "createdAt") as date,
        COUNT(*) as count,
        SUM("amount") as amount
      FROM "purchases"
      WHERE "createdAt" >= :startDate
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date_trunc('day', "createdAt") ASC
    `, {
      replacements: { startDate },
      type: QueryTypes.SELECT
    });
    
    // 獲取頂部產品
    const topProducts = await Message.sequelize!.query(`
      SELECT 
        "productId",
        "productName",
        COUNT(*) as count,
        SUM("amount") as totalAmount
      FROM "purchase_items"
      JOIN "purchases" ON "purchase_items"."purchaseId" = "purchases"."id"
      WHERE "purchases"."createdAt" >= :startDate
      GROUP BY "productId", "productName"
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `, {
      replacements: { startDate },
      type: QueryTypes.SELECT
    });
    
    return {
      totalConversations: parseInt(totalCount as string, 10),
      conversationsWithRecommendations: parseInt(recommendationCount as string, 10),
      conversationsWithPurchase: parseInt(purchaseCount as string, 10),
      recommendationRate,
      conversionRate,
      averagePurchaseAmount: parseFloat((averagePurchaseAmount[0] as any)?.average || 0),
      salesTrend: salesTrend.map((item: any) => ({
        date: item.date,
        count: parseInt(item.count, 10),
        amount: parseFloat(item.amount)
      })),
      topProducts: topProducts.map((item: any) => ({
        productId: item.productid,
        productName: item.productname,
        count: parseInt(item.count, 10),
        totalAmount: parseFloat(item.totalamount)
      }))
    };
  }
}

export default new AnalyticsService();