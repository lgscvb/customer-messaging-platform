import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { encrypt, decrypt } from '../utils/encryption';

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
 * API 設定屬性接口
 */
export interface ApiConfigAttributes {
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建 API 設定時的可選屬性
 */
export interface ApiConfigCreationAttributes extends Optional<ApiConfigAttributes, 'id' | 'isEncrypted' | 'isActive' | 'metadata' | 'description' | 'createdAt' | 'updatedAt'> {}

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
  createdBy: string;
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
  updatedBy: string;
}

/**
 * API 設定模型類
 */
class ApiConfig extends Model<ApiConfigAttributes, ApiConfigCreationAttributes> implements ApiConfigAttributes {
  public id!: string;
  public name!: string;
  public key!: string;
  public value!: string;
  public type!: ApiConfigType;
  public isEncrypted!: boolean;
  public description!: string | null;
  public isActive!: boolean;
  public metadata!: Record<string, any>;
  public createdBy!: string;
  public updatedBy!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  /**
   * 獲取解密後的值
   */
  public getDecryptedValue(): string {
    if (this.isEncrypted) {
      return decrypt(this.value);
    }
    return this.value;
  }

  /**
   * 設置加密後的值
   */
  public setEncryptedValue(value: string): void {
    if (this.isEncrypted) {
      this.value = encrypt(value);
    } else {
      this.value = value;
    }
  }
}

// 初始化 API 設定模型
ApiConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ApiConfigType)),
      allowNull: false,
    },
    isEncrypted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ApiConfig',
    tableName: 'api_configs',
    timestamps: true,
    hooks: {
      beforeCreate: async (apiConfig: ApiConfig) => {
        if (apiConfig.isEncrypted) {
          apiConfig.value = encrypt(apiConfig.value);
        }
      },
      beforeUpdate: async (apiConfig: ApiConfig) => {
        if (apiConfig.changed('value') && apiConfig.isEncrypted) {
          apiConfig.value = encrypt(apiConfig.value);
        }
      },
    },
  }
);

/**
 * API 設定模型擴展
 */
export const ApiConfigExtension = {
  /**
   * 根據 ID 查找 API 設定
   * @param id API 設定 ID
   */
  async findById(id: string): Promise<ApiConfig | null> {
    return ApiConfig.findByPk(id);
  },

  /**
   * 根據鍵查找 API 設定
   * @param key API 設定鍵
   */
  async findByKey(key: string): Promise<ApiConfig | null> {
    return ApiConfig.findOne({
      where: {
        key,
      },
    });
  },

  /**
   * 根據類型查找 API 設定列表
   * @param type API 設定類型
   */
  async findByType(type: ApiConfigType): Promise<ApiConfig[]> {
    return ApiConfig.findAll({
      where: {
        type,
        isActive: true,
      },
    });
  },

  /**
   * 獲取所有 API 設定
   */
  async findAll(): Promise<ApiConfig[]> {
    return ApiConfig.findAll({
      order: [['type', 'ASC'], ['name', 'ASC']],
    });
  },

  /**
   * 獲取所有啟用的 API 設定
   */
  async findAllActive(): Promise<ApiConfig[]> {
    return ApiConfig.findAll({
      where: {
        isActive: true,
      },
      order: [['type', 'ASC'], ['name', 'ASC']],
    });
  },

  /**
   * 創建 API 設定
   * @param data API 設定數據
   */
  async create(data: CreateApiConfigDTO): Promise<ApiConfig> {
    return ApiConfig.create({
      ...data,
      updatedBy: data.createdBy,
    } as ApiConfigCreationAttributes);
  },

  /**
   * 更新 API 設定
   * @param id API 設定 ID
   * @param data 更新數據
   */
  async update(id: string, data: UpdateApiConfigDTO): Promise<ApiConfig | null> {
    const apiConfig = await ApiConfig.findByPk(id);
    
    if (!apiConfig) {
      return null;
    }
    
    await apiConfig.update(data);
    return apiConfig;
  },

  /**
   * 刪除 API 設定
   * @param id API 設定 ID
   */
  async delete(id: string): Promise<boolean> {
    const apiConfig = await ApiConfig.findByPk(id);
    
    if (!apiConfig) {
      return false;
    }
    
    await apiConfig.destroy();
    return true;
  },

  /**
   * 獲取 API 設定值
   * @param key API 設定鍵
   * @param defaultValue 默認值
   */
  async getValue(key: string, defaultValue: string = ''): Promise<string> {
    const apiConfig = await ApiConfig.findOne({
      where: {
        key,
        isActive: true,
      },
    });
    
    if (!apiConfig) {
      return defaultValue;
    }
    
    return apiConfig.getDecryptedValue();
  },

  /**
   * 設置 API 設定值
   * @param key API 設定鍵
   * @param value API 設定值
   * @param userId 用戶 ID
   */
  async setValue(key: string, value: string, userId: string): Promise<ApiConfig> {
    const apiConfig = await ApiConfig.findOne({
      where: {
        key,
      },
    });
    
    if (apiConfig) {
      apiConfig.setEncryptedValue(value);
      apiConfig.updatedBy = userId;
      await apiConfig.save();
      return apiConfig;
    }
    
    throw new Error(`API 設定 ${key} 不存在`);
  },
};

export default ApiConfig;