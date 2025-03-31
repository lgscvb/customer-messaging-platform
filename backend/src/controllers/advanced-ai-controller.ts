import { Request, Response } from 'express';
import logger from '../utils/logger';
import advancedAiService, { LanguageCode } from '../services/advanced-ai-service';

/**
 * 進階 AI 控制器
 * 處理進階 AI 功能的請求
 */
class AdvancedAIController {
  /**
   * 檢測語言
   * @param req 請求
   * @param res 響應
   */
  async detectLanguage(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body;
      
      if (!text) {
        res.status(400).json({ error: '缺少必要參數: text' });
        return;
      }
      
      const result = await advancedAiService.detectLanguage(text);
      
      res.json(result);
    } catch (error) {
      logger.error('檢測語言錯誤:', error);
      res.status(500).json({ error: '檢測語言時發生錯誤' });
    }
  }
  
  /**
   * 翻譯文本
   * @param req 請求
   * @param res 響應
   */
  async translateText(req: Request, res: Response): Promise<void> {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        res.status(400).json({ error: '缺少必要參數: text, targetLanguage' });
        return;
      }
      
      const result = await advancedAiService.translateText(
        text,
        targetLanguage as LanguageCode,
        sourceLanguage as LanguageCode
      );
      
      res.json({ translatedText: result });
    } catch (error) {
      logger.error('翻譯文本錯誤:', error);
      res.status(500).json({ error: '翻譯文本時發生錯誤' });
    }
  }
  
  /**
   * 分析情感
   * @param req 請求
   * @param res 響應
   */
  async analyzeSentiment(req: Request, res: Response): Promise<void> {
    try {
      const { text, language } = req.body;
      
      if (!text) {
        res.status(400).json({ error: '缺少必要參數: text' });
        return;
      }
      
      const result = await advancedAiService.analyzeSentiment(
        text,
        language as LanguageCode
      );
      
      res.json(result);
    } catch (error) {
      logger.error('分析情感錯誤:', error);
      res.status(500).json({ error: '分析情感時發生錯誤' });
    }
  }
  
  /**
   * 識別意圖
   * @param req 請求
   * @param res 響應
   */
  async recognizeIntent(req: Request, res: Response): Promise<void> {
    try {
      const { text, language } = req.body;
      
      if (!text) {
        res.status(400).json({ error: '缺少必要參數: text' });
        return;
      }
      
      const result = await advancedAiService.recognizeIntent(
        text,
        language as LanguageCode
      );
      
      res.json(result);
    } catch (error) {
      logger.error('識別意圖錯誤:', error);
      res.status(500).json({ error: '識別意圖時發生錯誤' });
    }
  }
  
  /**
   * 生成對話摘要
   * @param req 請求
   * @param res 響應
   */
  async generateConversationSummary(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, limit } = req.body;
      
      if (!customerId) {
        res.status(400).json({ error: '缺少必要參數: customerId' });
        return;
      }
      
      const result = await advancedAiService.generateConversationSummary(
        customerId,
        limit
      );
      
      res.json(result);
    } catch (error) {
      logger.error('生成對話摘要錯誤:', error);
      res.status(500).json({ error: '生成對話摘要時發生錯誤' });
    }
  }
  
  /**
   * 主動學習
   * @param req 請求
   * @param res 響應
   */
  async activeLearning(req: Request, res: Response): Promise<void> {
    try {
      const { originalReply, humanReply, query } = req.body;
      
      if (!originalReply || !humanReply || !query) {
        res.status(400).json({ error: '缺少必要參數: originalReply, humanReply, query' });
        return;
      }
      
      const result = await advancedAiService.activeLearning(
        originalReply,
        humanReply,
        query
      );
      
      res.json(result);
    } catch (error) {
      logger.error('主動學習錯誤:', error);
      res.status(500).json({ error: '主動學習時發生錯誤' });
    }
  }
  
  /**
   * 根據情感調整回覆
   * @param req 請求
   * @param res 響應
   */
  async adjustReplyBySentiment(req: Request, res: Response): Promise<void> {
    try {
      const { reply, sentiment } = req.body;
      
      if (!reply || !sentiment) {
        res.status(400).json({ error: '缺少必要參數: reply, sentiment' });
        return;
      }
      
      const result = await advancedAiService.adjustReplyBySentiment(
        reply,
        sentiment
      );
      
      res.json({ adjustedReply: result });
    } catch (error) {
      logger.error('根據情感調整回覆錯誤:', error);
      res.status(500).json({ error: '根據情感調整回覆時發生錯誤' });
    }
  }
  
  /**
   * 根據意圖調整回覆
   * @param req 請求
   * @param res 響應
   */
  async adjustReplyByIntent(req: Request, res: Response): Promise<void> {
    try {
      const { reply, intent } = req.body;
      
      if (!reply || !intent) {
        res.status(400).json({ error: '缺少必要參數: reply, intent' });
        return;
      }
      
      const result = await advancedAiService.adjustReplyByIntent(
        reply,
        intent
      );
      
      res.json({ adjustedReply: result });
    } catch (error) {
      logger.error('根據意圖調整回覆錯誤:', error);
      res.status(500).json({ error: '根據意圖調整回覆時發生錯誤' });
    }
  }
  
  /**
   * 生成多語言回覆
   * @param req 請求
   * @param res 響應
   */
  async generateMultilingualReply(req: Request, res: Response): Promise<void> {
    try {
      const { reply, targetLanguage } = req.body;
      
      if (!reply || !targetLanguage) {
        res.status(400).json({ error: '缺少必要參數: reply, targetLanguage' });
        return;
      }
      
      const result = await advancedAiService.generateMultilingualReply(
        reply,
        targetLanguage as LanguageCode
      );
      
      res.json({ translatedReply: result });
    } catch (error) {
      logger.error('生成多語言回覆錯誤:', error);
      res.status(500).json({ error: '生成多語言回覆時發生錯誤' });
    }
  }
  
  /**
   * 生成增強回覆
   * @param req 請求
   * @param res 響應
   */
  async generateEnhancedReply(req: Request, res: Response): Promise<void> {
    try {
      const { query, customerId } = req.body;
      
      if (!query || !customerId) {
        res.status(400).json({ error: '缺少必要參數: query, customerId' });
        return;
      }
      
      const result = await advancedAiService.generateEnhancedReply(
        query,
        customerId
      );
      
      res.json(result);
    } catch (error) {
      logger.error('生成增強回覆錯誤:', error);
      res.status(500).json({ error: '生成增強回覆時發生錯誤' });
    }
  }
}

export default new AdvancedAIController();
