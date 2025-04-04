import { PlatformType } from '../types/platform';
import LineConnector, { LineConfig } from './line';
import FacebookConnector, { FacebookConfig } from './facebook';
import WebsiteConnector, { WebsiteConfig } from './website';
import logger from '../utils/logger';

/**
 * 平台配置接口
 */
export type PlatformConfig =
  | { platformType: PlatformType.LINE; config: LineConfig }
  | { platformType: PlatformType.FACEBOOK; config: FacebookConfig }
  | { platformType: PlatformType.WEBSITE; config: WebsiteConfig }
  | { platformType: PlatformType; config: Record<string, unknown> };

/**
 * 連接器類型
 */
type Connector = LineConnector | FacebookConnector | WebsiteConnector;

/**
 * 連接器工廠
 * 用於創建和管理不同平台的連接器
 */
class ConnectorFactory {
  private static instance: ConnectorFactory;
  private connectors: Map<PlatformType, Connector>;
  
  /**
   * 私有構造函數
   */
  private constructor() {
    this.connectors = new Map();
  }
  
  /**
   * 獲取連接器工廠實例
   */
  public static getInstance(): ConnectorFactory {
    if (!ConnectorFactory.instance) {
      ConnectorFactory.instance = new ConnectorFactory();
    }
    
    return ConnectorFactory.instance;
  }
  
  /**
   * 初始化連接器
   * @param platformConfigs 平台配置列表
   */
  public initialize(platformConfigs: PlatformConfig[]): void {
    try {
      for (const platformConfig of platformConfigs) {
        this.createConnector(platformConfig.platformType, platformConfig.config);
      }
      
      logger.info(`已初始化 ${this.connectors.size} 個平台連接器`);
    } catch (error) {
      logger.error('初始化連接器錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 創建連接器
   * @param platformType 平台類型
   * @param config 平台配置
   */
  public createConnector(platformType: PlatformType, config: unknown): void {
    try {
      let connector: Connector;
      
      switch (platformType) {
        case PlatformType.LINE:
          if (this.isLineConfig(config)) {
            connector = new LineConnector(config);
          } else {
            throw new Error(`無效的 LINE 平台配置`);
          }
          break;
        case PlatformType.FACEBOOK:
          if (this.isFacebookConfig(config)) {
            connector = new FacebookConnector(config);
          } else {
            throw new Error(`無效的 Facebook 平台配置`);
          }
          break;
        case PlatformType.WEBSITE:
          if (this.isWebsiteConfig(config)) {
            connector = new WebsiteConnector(config);
          } else {
            throw new Error(`無效的網站平台配置`);
          }
          break;
        default:
          throw new Error(`不支持的平台類型: ${platformType}`);
      }
      
      this.connectors.set(platformType, connector);
      
      logger.info(`已創建 ${platformType} 平台連接器`);
    } catch (error) {
      logger.error(`創建 ${platformType} 平台連接器錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 檢查是否為 LINE 平台配置
   * @param config 配置
   */
  private isLineConfig(config: unknown): config is LineConfig {
    if (!config || typeof config !== 'object') return false;
    
    const lineConfig = config as Partial<LineConfig>;
    return (
      typeof lineConfig.channelAccessToken === 'string' &&
      typeof lineConfig.channelSecret === 'string'
    );
  }
  
  /**
   * 檢查是否為 Facebook 平台配置
   * @param config 配置
   */
  private isFacebookConfig(config: unknown): config is FacebookConfig {
    if (!config || typeof config !== 'object') return false;
    
    const fbConfig = config as Partial<FacebookConfig>;
    return (
      typeof fbConfig.pageAccessToken === 'string' &&
      typeof fbConfig.appSecret === 'string' &&
      typeof fbConfig.verifyToken === 'string'
    );
  }
  
  /**
   * 檢查是否為網站平台配置
   * @param config 配置
   */
  private isWebsiteConfig(config: unknown): config is WebsiteConfig {
    if (!config || typeof config !== 'object') return false;
    
    const websiteConfig = config as Partial<WebsiteConfig>;
    return (
      typeof websiteConfig.apiKey === 'string' &&
      typeof websiteConfig.webhookSecret === 'string'
    );
  }
  
  /**
   * 獲取連接器
   * @param platformType 平台類型
   */
  public getConnector<T extends Connector>(platformType: PlatformType): T {
    const connector = this.connectors.get(platformType) as T;
    
    if (!connector) {
      throw new Error(`未找到 ${platformType} 平台連接器`);
    }
    
    return connector;
  }
  
  /**
   * 獲取所有連接器
   */
  public getAllConnectors(): Map<PlatformType, Connector> {
    return this.connectors;
  }
  
  /**
   * 移除連接器
   * @param platformType 平台類型
   */
  public removeConnector(platformType: PlatformType): void {
    if (this.connectors.has(platformType)) {
      this.connectors.delete(platformType);
      logger.info(`已移除 ${platformType} 平台連接器`);
    }
  }
  
  /**
   * 重置所有連接器
   */
  public reset(): void {
    this.connectors.clear();
    logger.info('已重置所有平台連接器');
  }
}

export default ConnectorFactory;