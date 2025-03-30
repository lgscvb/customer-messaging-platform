import ApiConfig, {
  ApiConfigType,
  ApiConfigExtension,
  CreateApiConfigDTO,
  UpdateApiConfigDTO,
} from '../models/ApiConfig';
import logger from '../utils/logger';

/**
 * API 設定服務
 * 提供 API 設定的管理功能
 */
const apiConfigService = {
  /**
   * 獲取所有 API 設定
   */
  async getAllApiConfigs() {
    try {
      return await ApiConfigExtension.findAll();
    } catch (error) {
      logger.error('獲取所有 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 獲取所有啟用的 API 設定
   */
  async getAllActiveApiConfigs() {
    try {
      return await ApiConfigExtension.findAllActive();
    } catch (error) {
      logger.error('獲取所有啟用的 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 根據 ID 獲取 API 設定
   * @param id API 設定 ID
   */
  async getApiConfigById(id: string) {
    try {
      return await ApiConfigExtension.findById(id);
    } catch (error) {
      logger.error(`獲取 API 設定 (ID: ${id}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 根據鍵獲取 API 設定
   * @param key API 設定鍵
   */
  async getApiConfigByKey(key: string) {
    try {
      return await ApiConfigExtension.findByKey(key);
    } catch (error) {
      logger.error(`獲取 API 設定 (Key: ${key}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 根據類型獲取 API 設定列表
   * @param type API 設定類型
   */
  async getApiConfigsByType(type: ApiConfigType) {
    try {
      return await ApiConfigExtension.findByType(type);
    } catch (error) {
      logger.error(`獲取 API 設定 (Type: ${type}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 創建 API 設定
   * @param data API 設定數據
   */
  async createApiConfig(data: CreateApiConfigDTO) {
    try {
      // 檢查鍵是否已存在
      const existingConfig = await ApiConfigExtension.findByKey(data.key);
      if (existingConfig) {
        throw new Error(`API 設定鍵 ${data.key} 已存在`);
      }

      return await ApiConfigExtension.create(data);
    } catch (error) {
      logger.error('創建 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 更新 API 設定
   * @param id API 設定 ID
   * @param data 更新數據
   */
  async updateApiConfig(id: string, data: UpdateApiConfigDTO) {
    try {
      const apiConfig = await ApiConfigExtension.update(id, data);
      if (!apiConfig) {
        throw new Error(`API 設定 ID ${id} 不存在`);
      }
      return apiConfig;
    } catch (error) {
      logger.error(`更新 API 設定 (ID: ${id}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 刪除 API 設定
   * @param id API 設定 ID
   */
  async deleteApiConfig(id: string) {
    try {
      const result = await ApiConfigExtension.delete(id);
      if (!result) {
        throw new Error(`API 設定 ID ${id} 不存在`);
      }
      return result;
    } catch (error) {
      logger.error(`刪除 API 設定 (ID: ${id}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 獲取 API 設定值
   * @param key API 設定鍵
   * @param defaultValue 默認值
   */
  async getApiConfigValue(key: string, defaultValue: string = '') {
    try {
      return await ApiConfigExtension.getValue(key, defaultValue);
    } catch (error) {
      logger.error(`獲取 API 設定值 (Key: ${key}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 設置 API 設定值
   * @param key API 設定鍵
   * @param value API 設定值
   * @param userId 用戶 ID
   */
  async setApiConfigValue(key: string, value: string, userId: string) {
    try {
      return await ApiConfigExtension.setValue(key, value, userId);
    } catch (error) {
      logger.error(`設置 API 設定值 (Key: ${key}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 批量創建 API 設定
   * @param dataList API 設定數據列表
   * @param userId 用戶 ID
   */
  async bulkCreateApiConfigs(dataList: Omit<CreateApiConfigDTO, 'createdBy'>[], userId: string) {
    try {
      const results = [];
      for (const data of dataList) {
        const createData: CreateApiConfigDTO = {
          ...data,
          createdBy: userId,
        };
        const result = await this.createApiConfig(createData);
        results.push(result);
      }
      return results;
    } catch (error) {
      logger.error('批量創建 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 批量更新 API 設定
   * @param dataList API 設定數據列表
   * @param userId 用戶 ID
   */
  async bulkUpdateApiConfigs(dataList: { id: string; data: Omit<UpdateApiConfigDTO, 'updatedBy'> }[], userId: string) {
    try {
      const results = [];
      for (const item of dataList) {
        const updateData: UpdateApiConfigDTO = {
          ...item.data,
          updatedBy: userId,
        };
        const result = await this.updateApiConfig(item.id, updateData);
        results.push(result);
      }
      return results;
    } catch (error) {
      logger.error('批量更新 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 獲取 AI 服務的 API 金鑰
   * @param provider AI 服務提供商
   * @param defaultValue 默認值
   */
  async getAiApiKey(provider: string, defaultValue: string = '') {
    try {
      const key = `ai.${provider}.api_key`;
      return await this.getApiConfigValue(key, defaultValue);
    } catch (error) {
      logger.error(`獲取 AI API 金鑰 (Provider: ${provider}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 獲取平台的 API 金鑰
   * @param platform 平台名稱
   * @param keyType 金鑰類型
   * @param defaultValue 默認值
   */
  async getPlatformApiKey(platform: string, keyType: string, defaultValue: string = '') {
    try {
      const key = `platform.${platform}.${keyType}`;
      return await this.getApiConfigValue(key, defaultValue);
    } catch (error) {
      logger.error(`獲取平台 API 金鑰 (Platform: ${platform}, KeyType: ${keyType}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 獲取整合服務的 API 金鑰
   * @param service 服務名稱
   * @param keyType 金鑰類型
   * @param defaultValue 默認值
   */
  async getIntegrationApiKey(service: string, keyType: string, defaultValue: string = '') {
    try {
      const key = `integration.${service}.${keyType}`;
      return await this.getApiConfigValue(key, defaultValue);
    } catch (error) {
      logger.error(`獲取整合服務 API 金鑰 (Service: ${service}, KeyType: ${keyType}) 錯誤:`, error);
      throw error;
    }
  },
};

export default apiConfigService;