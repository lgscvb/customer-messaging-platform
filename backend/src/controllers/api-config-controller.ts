import { Request, Response } from 'express';
import { ApiConfigType } from '../models/ApiConfig';
import apiConfigService from '../services/api-config-service';
import logger from '../utils/logger';

/**
 * API 設定控制器
 * 處理 API 設定相關的請求
 */
const apiConfigController = {
  /**
   * 獲取所有 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async getAllApiConfigs(req: Request, res: Response) {
    try {
      const apiConfigs = await apiConfigService.getAllApiConfigs();
      
      return res.status(200).json({
        success: true,
        data: apiConfigs,
      });
    } catch (error: any) {
      logger.error('獲取所有 API 設定錯誤:', error);
      
      return res.status(500).json({
        success: false,
        message: '獲取 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 獲取所有啟用的 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async getAllActiveApiConfigs(req: Request, res: Response) {
    try {
      const apiConfigs = await apiConfigService.getAllActiveApiConfigs();
      
      return res.status(200).json({
        success: true,
        data: apiConfigs,
      });
    } catch (error: any) {
      logger.error('獲取所有啟用的 API 設定錯誤:', error);
      
      return res.status(500).json({
        success: false,
        message: '獲取啟用的 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 根據 ID 獲取 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async getApiConfigById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const apiConfig = await apiConfigService.getApiConfigById(id);
      
      if (!apiConfig) {
        return res.status(404).json({
          success: false,
          message: `API 設定 ID ${id} 不存在`,
        });
      }
      
      return res.status(200).json({
        success: true,
        data: apiConfig,
      });
    } catch (error: any) {
      logger.error(`獲取 API 設定 (ID: ${req.params.id}) 錯誤:`, error);
      
      return res.status(500).json({
        success: false,
        message: '獲取 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 根據鍵獲取 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async getApiConfigByKey(req: Request, res: Response) {
    try {
      const { key } = req.params;
      
      const apiConfig = await apiConfigService.getApiConfigByKey(key);
      
      if (!apiConfig) {
        return res.status(404).json({
          success: false,
          message: `API 設定鍵 ${key} 不存在`,
        });
      }
      
      return res.status(200).json({
        success: true,
        data: apiConfig,
      });
    } catch (error: any) {
      logger.error(`獲取 API 設定 (Key: ${req.params.key}) 錯誤:`, error);
      
      return res.status(500).json({
        success: false,
        message: '獲取 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 根據類型獲取 API 設定列表
   * @param req 請求對象
   * @param res 響應對象
   */
  async getApiConfigsByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      
      // 驗證類型是否有效
      if (!Object.values(ApiConfigType).includes(type as ApiConfigType)) {
        return res.status(400).json({
          success: false,
          message: `無效的 API 設定類型: ${type}`,
        });
      }
      
      const apiConfigs = await apiConfigService.getApiConfigsByType(type as ApiConfigType);
      
      return res.status(200).json({
        success: true,
        data: apiConfigs,
      });
    } catch (error: any) {
      logger.error(`獲取 API 設定 (Type: ${req.params.type}) 錯誤:`, error);
      
      return res.status(500).json({
        success: false,
        message: '獲取 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 創建 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async createApiConfig(req: Request, res: Response) {
    try {
      const { name, key, value, type, isEncrypted, description, isActive, metadata } = req.body;
      
      // 驗證必要字段
      if (!name || !key || !value || !type) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段: name, key, value, type',
        });
      }
      
      // 驗證類型是否有效
      if (!Object.values(ApiConfigType).includes(type)) {
        return res.status(400).json({
          success: false,
          message: `無效的 API 設定類型: ${type}`,
        });
      }
      
      // 確保 req.user 存在
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求',
        });
      }
      
      const apiConfig = await apiConfigService.createApiConfig({
        name,
        key,
        value,
        type,
        isEncrypted,
        description,
        isActive,
        metadata,
        createdBy: req.user.id,
      });
      
      return res.status(201).json({
        success: true,
        data: apiConfig,
      });
    } catch (error: any) {
      logger.error('創建 API 設定錯誤:', error);
      
      // 處理重複鍵錯誤
      if (error.message && error.message.includes('已存在')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: '創建 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 更新 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async updateApiConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, value, type, isEncrypted, description, isActive, metadata } = req.body;
      
      // 驗證至少有一個更新字段
      if (!name && value === undefined && !type && isEncrypted === undefined && description === undefined && isActive === undefined && !metadata) {
        return res.status(400).json({
          success: false,
          message: '至少需要一個更新字段',
        });
      }
      
      // 驗證類型是否有效
      if (type && !Object.values(ApiConfigType).includes(type)) {
        return res.status(400).json({
          success: false,
          message: `無效的 API 設定類型: ${type}`,
        });
      }
      
      // 確保 req.user 存在
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求',
        });
      }
      
      const apiConfig = await apiConfigService.updateApiConfig(id, {
        name,
        value,
        type,
        isEncrypted,
        description,
        isActive,
        metadata,
        updatedBy: req.user.id,
      });
      
      if (!apiConfig) {
        return res.status(404).json({
          success: false,
          message: `API 設定 ID ${id} 不存在`,
        });
      }
      
      return res.status(200).json({
        success: true,
        data: apiConfig,
      });
    } catch (error: any) {
      logger.error(`更新 API 設定 (ID: ${req.params.id}) 錯誤:`, error);
      
      return res.status(500).json({
        success: false,
        message: '更新 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 刪除 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async deleteApiConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const result = await apiConfigService.deleteApiConfig(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: `API 設定 ID ${id} 不存在`,
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `API 設定 ID ${id} 已刪除`,
      });
    } catch (error: any) {
      logger.error(`刪除 API 設定 (ID: ${req.params.id}) 錯誤:`, error);
      
      return res.status(500).json({
        success: false,
        message: '刪除 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 獲取 API 設定值
   * @param req 請求對象
   * @param res 響應對象
   */
  async getApiConfigValue(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { defaultValue } = req.query;
      
      const value = await apiConfigService.getApiConfigValue(key, defaultValue as string || '');
      
      return res.status(200).json({
        success: true,
        data: {
          key,
          value,
        },
      });
    } catch (error: any) {
      logger.error(`獲取 API 設定值 (Key: ${req.params.key}) 錯誤:`, error);
      
      return res.status(500).json({
        success: false,
        message: '獲取 API 設定值失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 設置 API 設定值
   * @param req 請求對象
   * @param res 響應對象
   */
  async setApiConfigValue(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      // 驗證必要字段
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段: value',
        });
      }
      
      // 確保 req.user 存在
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求',
        });
      }
      
      const apiConfig = await apiConfigService.setApiConfigValue(key, value, req.user.id);
      
      return res.status(200).json({
        success: true,
        data: apiConfig,
      });
    } catch (error: any) {
      logger.error(`設置 API 設定值 (Key: ${req.params.key}) 錯誤:`, error);
      
      // 處理不存在的鍵錯誤
      if (error.message && error.message.includes('不存在')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: '設置 API 設定值失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 批量創建 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async bulkCreateApiConfigs(req: Request, res: Response) {
    try {
      const { configs } = req.body;
      
      // 驗證必要字段
      if (!configs || !Array.isArray(configs) || configs.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段: configs (必須是非空數組)',
        });
      }
      
      // 驗證每個配置項
      for (const config of configs) {
        const { name, key, value, type } = config;
        
        if (!name || !key || !value || !type) {
          return res.status(400).json({
            success: false,
            message: `配置項缺少必要字段: name, key, value, type`,
          });
        }
        
        if (!Object.values(ApiConfigType).includes(type)) {
          return res.status(400).json({
            success: false,
            message: `無效的 API 設定類型: ${type}`,
          });
        }
      }
      
      // 確保 req.user 存在
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求',
        });
      }
      
      const results = await apiConfigService.bulkCreateApiConfigs(configs, req.user.id);
      
      return res.status(201).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('批量創建 API 設定錯誤:', error);
      
      return res.status(500).json({
        success: false,
        message: '批量創建 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
  
  /**
   * 批量更新 API 設定
   * @param req 請求對象
   * @param res 響應對象
   */
  async bulkUpdateApiConfigs(req: Request, res: Response) {
    try {
      const { configs } = req.body;
      
      // 驗證必要字段
      if (!configs || !Array.isArray(configs) || configs.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少必要字段: configs (必須是非空數組)',
        });
      }
      
      // 驗證每個配置項
      for (const config of configs) {
        const { id, data } = config;
        
        if (!id || !data) {
          return res.status(400).json({
            success: false,
            message: `配置項缺少必要字段: id, data`,
          });
        }
        
        if (data.type && !Object.values(ApiConfigType).includes(data.type)) {
          return res.status(400).json({
            success: false,
            message: `無效的 API 設定類型: ${data.type}`,
          });
        }
      }
      
      // 確保 req.user 存在
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: '未授權的請求',
        });
      }
      
      const results = await apiConfigService.bulkUpdateApiConfigs(configs, req.user.id);
      
      return res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('批量更新 API 設定錯誤:', error);
      
      return res.status(500).json({
        success: false,
        message: '批量更新 API 設定失敗',
        error: error.message || '未知錯誤',
      });
    }
  },
};

export default apiConfigController;