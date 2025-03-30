import express from 'express';
import { Request, Response } from 'express';
import { PlatformType } from '../types/platform';
import ConnectorFactory from '../connectors';
import LineConnector from '../connectors/line';
import FacebookConnector from '../connectors/facebook';
import WebsiteConnector from '../connectors/website';
import logger from '../utils/logger';

const router = express.Router();

/**
 * LINE Webhook 處理
 * @route POST /api/webhooks/line
 */
router.post('/line', async (req: Request, res: Response) => {
  try {
    const events = req.body.events;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ message: '無效的 LINE Webhook 請求' });
    }
    
    // 獲取 LINE 連接器
    const connectorFactory = ConnectorFactory.getInstance();
    const lineConnector = connectorFactory.getConnector<LineConnector>(PlatformType.LINE);
    
    // 處理 Webhook 事件
    await lineConnector.handleWebhook(events);
    
    return res.status(200).json({ message: 'LINE Webhook 處理成功' });
  } catch (error) {
    logger.error('處理 LINE Webhook 錯誤:', error);
    return res.status(500).json({ message: '處理 LINE Webhook 時發生錯誤' });
  }
});

/**
 * Facebook Webhook 驗證
 * @route GET /api/webhooks/facebook
 */
router.get('/facebook', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;
    
    if (!mode || !token) {
      return res.status(400).json({ message: '無效的 Facebook Webhook 驗證請求' });
    }
    
    // 獲取 Facebook 連接器
    const connectorFactory = ConnectorFactory.getInstance();
    const facebookConnector = connectorFactory.getConnector<FacebookConnector>(PlatformType.FACEBOOK);
    
    // 驗證 Webhook
    const response = facebookConnector.verifyWebhook(mode, token, challenge);
    
    if (response) {
      return res.status(200).send(response);
    } else {
      return res.status(403).json({ message: 'Facebook Webhook 驗證失敗' });
    }
  } catch (error) {
    logger.error('驗證 Facebook Webhook 錯誤:', error);
    return res.status(500).json({ message: '驗證 Facebook Webhook 時發生錯誤' });
  }
});

/**
 * Facebook Webhook 處理
 * @route POST /api/webhooks/facebook
 */
router.post('/facebook', async (req: Request, res: Response) => {
  try {
    // 獲取 Facebook 連接器
    const connectorFactory = ConnectorFactory.getInstance();
    const facebookConnector = connectorFactory.getConnector<FacebookConnector>(PlatformType.FACEBOOK);
    
    // 處理 Webhook 事件
    await facebookConnector.handleWebhook(req.body);
    
    return res.status(200).json({ message: 'Facebook Webhook 處理成功' });
  } catch (error) {
    logger.error('處理 Facebook Webhook 錯誤:', error);
    return res.status(500).json({ message: '處理 Facebook Webhook 時發生錯誤' });
  }
});

/**
 * 網站 Webhook 處理
 * @route POST /api/webhooks/website
 */
router.post('/website', async (req: Request, res: Response) => {
  try {
    // 獲取網站連接器
    const connectorFactory = ConnectorFactory.getInstance();
    const websiteConnector = connectorFactory.getConnector<WebsiteConnector>(PlatformType.WEBSITE);
    
    // 處理 Webhook 事件
    await websiteConnector.handleWebhook(req.body);
    
    return res.status(200).json({ message: '網站 Webhook 處理成功' });
  } catch (error) {
    logger.error('處理網站 Webhook 錯誤:', error);
    return res.status(500).json({ message: '處理網站 Webhook 時發生錯誤' });
  }
});

export default router;