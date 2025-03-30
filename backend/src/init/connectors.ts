import dotenv from 'dotenv';
import { PlatformType } from '../types/platform';
import ConnectorFactory from '../connectors';
import { LineConfig } from '../connectors/line';
import { FacebookConfig } from '../connectors/facebook';
import { WebsiteConfig } from '../connectors/website';
import logger from '../utils/logger';

// 加載環境變量
dotenv.config();

/**
 * 初始化連接器
 */
export function initializeConnectors(): void {
  try {
    const connectorFactory = ConnectorFactory.getInstance();
    
    // 初始化 LINE 連接器
    if (process.env.LINE_ENABLED === 'true') {
      const lineConfig: LineConfig = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
        channelSecret: process.env.LINE_CHANNEL_SECRET || '',
        apiEndpoint: process.env.LINE_API_ENDPOINT,
      };
      
      connectorFactory.createConnector(PlatformType.LINE, lineConfig);
      logger.info('LINE 連接器初始化成功');
    }
    
    // 初始化 Facebook 連接器
    if (process.env.FACEBOOK_ENABLED === 'true') {
      const facebookConfig: FacebookConfig = {
        pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
        appSecret: process.env.FACEBOOK_APP_SECRET || '',
        verifyToken: process.env.FACEBOOK_VERIFY_TOKEN || '',
        apiVersion: process.env.FACEBOOK_API_VERSION,
      };
      
      connectorFactory.createConnector(PlatformType.FACEBOOK, facebookConfig);
      logger.info('Facebook 連接器初始化成功');
    }
    
    // 初始化網站連接器
    if (process.env.WEBSITE_ENABLED === 'true') {
      const websiteConfig: WebsiteConfig = {
        apiKey: process.env.WEBSITE_API_KEY || '',
        webhookSecret: process.env.WEBSITE_WEBHOOK_SECRET || '',
      };
      
      connectorFactory.createConnector(PlatformType.WEBSITE, websiteConfig);
      logger.info('網站連接器初始化成功');
    }
    
    logger.info('所有連接器初始化完成');
  } catch (error) {
    logger.error('初始化連接器錯誤:', error);
    throw error;
  }
}

/**
 * 獲取環境變量
 * @param name 環境變量名稱
 * @param defaultValue 默認值
 */
function getEnv(name: string, defaultValue: string = ''): string {
  const value = process.env[name];
  return value !== undefined ? value : defaultValue;
}