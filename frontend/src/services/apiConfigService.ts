import api from './api';
import axios from 'axios';
import type { AxiosResponse } from 'axios';

/**
 * API 設定類型枚舉
 */
export enum ApiConfigType {
  AI = 'ai',
  PLATFORM = 'platform',
  INTEGRATION = 'integration',
  OTHER = 'other',
}

/**
 * API 設定接口
 */
export interface ApiConfig {
  id: string;
  name: string;
  key: string;
  value: string;
  type: ApiConfigType;
  isEncrypted: boolean;
  description: string | null;
  isActive: boolean;
  metadata: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 創建 API 設定 DTO
 */
export interface CreateApiConfigDTO {
  name: string;
  key: string;
  value: string;
  type: ApiConfigType;
  isEncrypted?: boolean;
  description?: string | null;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 更新 API 設定 DTO
 */
export interface UpdateApiConfigDTO {
  name?: string;
  value?: string;
  type?: ApiConfigType;
  isEncrypted?: boolean;
  description?: string | null;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * API 設定服務
 * 提供 API 設定的管理功能
 */
const apiConfigService = {
  /**
   * 獲取所有 API 設定
   */
  async getAllApiConfigs(): Promise<ApiConfig[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig[] }> = await api.get('/api-configs');
      return response.data.data;
    } catch (error) {
      console.error('獲取所有 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 獲取所有啟用的 API 設定
   */
  async getAllActiveApiConfigs(): Promise<ApiConfig[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig[] }> = await api.get('/api-configs/active');
      return response.data.data;
    } catch (error) {
      console.error('獲取所有啟用的 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 根據 ID 獲取 API 設定
   * @param id API 設定 ID
   */
  async getApiConfigById(id: string): Promise<ApiConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig }> = await api.get(`/api-configs/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`獲取 API 設定 (ID: ${id}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 根據鍵獲取 API 設定
   * @param key API 設定鍵
   */
  async getApiConfigByKey(key: string): Promise<ApiConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig }> = await api.get(`/api-configs/key/${key}`);
      return response.data.data;
    } catch (error) {
      console.error(`獲取 API 設定 (Key: ${key}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 根據類型獲取 API 設定列表
   * @param type API 設定類型
   */
  async getApiConfigsByType(type: ApiConfigType): Promise<ApiConfig[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig[] }> = await api.get(`/api-configs/type/${type}`);
      return response.data.data;
    } catch (error) {
      console.error(`獲取 API 設定 (Type: ${type}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 創建 API 設定
   * @param data API 設定數據
   */
  async createApiConfig(data: CreateApiConfigDTO): Promise<ApiConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig }> = await api.post('/api-configs', data);
      return response.data.data;
    } catch (error) {
      console.error('創建 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 更新 API 設定
   * @param id API 設定 ID
   * @param data 更新數據
   */
  async updateApiConfig(id: string, data: UpdateApiConfigDTO): Promise<ApiConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig }> = await api.put(`/api-configs/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`更新 API 設定 (ID: ${id}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 刪除 API 設定
   * @param id API 設定 ID
   */
  async deleteApiConfig(id: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ success: boolean; message: string }> = await api.delete(`/api-configs/${id}`);
      return response.data.success;
    } catch (error) {
      console.error(`刪除 API 設定 (ID: ${id}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 獲取 API 設定值
   * @param key API 設定鍵
   * @param defaultValue 默認值
   */
  async getApiConfigValue(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { key: string; value: string } }> = await api.get(`/api-configs/value/${key}`, {
        params: { defaultValue },
      });
      return response.data.data.value;
    } catch (error) {
      console.error(`獲取 API 設定值 (Key: ${key}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 設置 API 設定值
   * @param key API 設定鍵
   * @param value API 設定值
   */
  async setApiConfigValue(key: string, value: string): Promise<ApiConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig }> = await api.put(`/api-configs/value/${key}`, { value });
      return response.data.data;
    } catch (error) {
      console.error(`設置 API 設定值 (Key: ${key}) 錯誤:`, error);
      throw error;
    }
  },

  /**
   * 批量創建 API 設定
   * @param configs API 設定數據列表
   */
  async bulkCreateApiConfigs(configs: CreateApiConfigDTO[]): Promise<ApiConfig[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig[] }> = await api.post('/api-configs/bulk', { configs });
      return response.data.data;
    } catch (error) {
      console.error('批量創建 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 批量更新 API 設定
   * @param configs API 設定數據列表
   */
  async bulkUpdateApiConfigs(configs: { id: string; data: UpdateApiConfigDTO }[]): Promise<ApiConfig[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: ApiConfig[] }> = await api.put('/api-configs/bulk', { configs });
      return response.data.data;
    } catch (error) {
      console.error('批量更新 API 設定錯誤:', error);
      throw error;
    }
  },

  /**
   * 獲取 API 設定類型列表
   */
  getApiConfigTypes(): ApiConfigType[] {
    return Object.values(ApiConfigType);
  },

  /**
   * 獲取 API 設定類型名稱
   * @param type API 設定類型
   */
  getApiConfigTypeName(type: ApiConfigType): string {
    switch (type) {
      case ApiConfigType.AI:
        return 'AI 服務';
      case ApiConfigType.PLATFORM:
        return '平台連接';
      case ApiConfigType.INTEGRATION:
        return '整合服務';
      case ApiConfigType.OTHER:
        return '其他';
      default:
        return type;
    }
  },
};

export default apiConfigService;