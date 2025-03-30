import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { PlatformType, SyncStatus } from '../types/platform';

/**
 * 同步歷史記錄屬性接口
 */
export interface SyncHistoryAttributes {
  id: string;
  platformId: string;
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  customerCount: number;
  errorMessage?: string;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 同步歷史記錄創建屬性接口
 */
export type SyncHistoryCreationAttributes = Optional<SyncHistoryAttributes, 'endTime' | 'errorMessage' | 'details' | 'createdAt' | 'updatedAt'>;

/**
 * 同步歷史記錄模型
 */
class SyncHistory extends Model<SyncHistoryAttributes, SyncHistoryCreationAttributes> implements SyncHistoryAttributes {
  public id!: string;
  public platformId!: string;
  public status!: SyncStatus;
  public startTime!: Date;
  public endTime?: Date;
  public messageCount!: number;
  public customerCount!: number;
  public errorMessage?: string;
  public details?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SyncHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    platformId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SyncStatus)),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    customerCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sync_histories',
    modelName: 'SyncHistory',
  }
);

export default SyncHistory;