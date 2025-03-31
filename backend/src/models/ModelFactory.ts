/**
 * 資料庫模型工廠
 * 
 * 此類用於根據操作類型（讀/寫）選擇適當的資料庫連接，實現讀寫分離
 */

import { Model, ModelCtor, Sequelize } from 'sequelize';
import dbShardingManager from '../config/database-sharding';
import logger from '../utils/logger';

/**
 * 模型工廠類
 * 提供根據操作類型獲取模型實例的功能
 */
class ModelFactory {
  /**
   * 獲取模型實例
   * @param modelClass 模型類
   * @param isWrite 是否為寫操作
   * @returns 模型實例
   */
  static getModel<T extends Model>(modelClass: ModelCtor<T>, isWrite: boolean = false): ModelCtor<T> {
    try {
      // 獲取適當的資料庫連接
      const sequelize = dbShardingManager.getConnection(isWrite);
      
      // 獲取模型名稱
      const modelName = modelClass.name;
      
      // 檢查模型是否已在此連接上定義
      if (sequelize.isDefined(modelName)) {
        return sequelize.model(modelName) as ModelCtor<T>;
      }
      
      // 如果模型尚未在此連接上定義，則重新定義
      // 注意：這裡假設模型的初始化函數是可用的，實際情況可能需要調整
      logger.warn(`模型 ${modelName} 尚未在連接上定義，嘗試重新定義`);
      
      // 這裡需要根據實際情況調整，可能需要從原始模型獲取屬性和選項
      // 這只是一個簡化的示例
      return modelClass.init(
        (modelClass as any).getAttributes(),
        {
          ...(modelClass as any).options,
          sequelize
        }
      );
    } catch (error) {
      logger.error(`獲取模型 ${modelClass.name} 實例時出錯:`, error);
      throw error;
    }
  }
  
  /**
   * 獲取讀操作模型實例
   * @param modelClass 模型類
   * @returns 讀操作模型實例
   */
  static getReadModel<T extends Model>(modelClass: ModelCtor<T>): ModelCtor<T> {
    return this.getModel(modelClass, false);
  }
  
  /**
   * 獲取寫操作模型實例
   * @param modelClass 模型類
   * @returns 寫操作模型實例
   */
  static getWriteModel<T extends Model>(modelClass: ModelCtor<T>): ModelCtor<T> {
    return this.getModel(modelClass, true);
  }
  
  /**
   * 執行讀操作
   * @param modelClass 模型類
   * @param operation 操作函數
   * @returns 操作結果
   */
  static async read<T extends Model, R>(modelClass: ModelCtor<T>, operation: (model: ModelCtor<T>) => Promise<R>): Promise<R> {
    const model = this.getReadModel(modelClass);
    return operation(model);
  }
  
  /**
   * 執行寫操作
   * @param modelClass 模型類
   * @param operation 操作函數
   * @returns 操作結果
   */
  static async write<T extends Model, R>(modelClass: ModelCtor<T>, operation: (model: ModelCtor<T>) => Promise<R>): Promise<R> {
    const model = this.getWriteModel(modelClass);
    return operation(model);
  }
  
  /**
   * 執行事務操作
   * @param operation 事務操作函數
   * @returns 操作結果
   */
  static async transaction<R>(operation: (transaction: any) => Promise<R>): Promise<R> {
    // 事務必須在主庫（寫庫）上執行
    const sequelize = dbShardingManager.getMaster();
    return sequelize.transaction(operation);
  }
}

export default ModelFactory;