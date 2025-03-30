import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import sequelize from '../config/database';
import { PlatformType, MessageDirection, MessageType } from '../types/platform';
import { Customer } from './Customer';

/**
 * 消息屬性接口
 */
interface MessageAttributes {
  id: string;
  customerId: string;
  direction: MessageDirection;
  platformType: PlatformType;
  platformMessageId?: string;
  messageType: MessageType;
  content: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // 分析相關字段
  isFromCustomer: boolean;
  isAiGenerated: boolean;
  aiConfidence: number | null;
  isEdited: boolean;
  category: string | null;
  hasProductRecommendation: boolean;
  conversationId: string | null;
}

/**
 * 創建消息時的可選屬性
 */
interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'platformMessageId' | 'isRead' | 'readAt' | 'createdAt' | 'updatedAt' | 'isFromCustomer' | 'isAiGenerated' | 'aiConfidence' | 'isEdited' | 'category' | 'hasProductRecommendation' | 'conversationId'> {}

/**
 * 消息模型類
 */
class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public customerId!: string;
  public direction!: MessageDirection;
  public platformType!: PlatformType;
  public platformMessageId?: string;
  public messageType!: MessageType;
  public content!: string | null;
  public metadata!: Record<string, any>;
  public isRead!: boolean;
  public readAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // 分析相關字段
  public isFromCustomer!: boolean;
  public isAiGenerated!: boolean;
  public aiConfidence!: number | null;
  public isEdited!: boolean;
  public category!: string | null;
  public hasProductRecommendation!: boolean;
  public conversationId!: string | null;
  
  // 關聯
  public customer?: Customer;
  
  // 添加靜態 sequelize 屬性
  public static readonly sequelize: Sequelize = sequelize;
}

// 初始化消息模型
Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    direction: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(MessageDirection)],
      },
    },
    platformType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(PlatformType)],
      },
    },
    platformMessageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    messageType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(MessageType)],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    // 分析相關字段
    isFromCustomer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isAiGenerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    aiConfidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hasProductRecommendation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        name: 'messages_customer_id_idx',
        fields: ['customer_id'],
      },
      {
        name: 'messages_platform_type_idx',
        fields: ['platform_type'],
      },
      {
        name: 'messages_platform_message_id_idx',
        fields: ['platform_message_id'],
      },
      {
        name: 'messages_message_type_idx',
        fields: ['message_type'],
      },
      {
        name: 'messages_direction_idx',
        fields: ['direction'],
      },
      {
        name: 'messages_is_read_idx',
        fields: ['is_read'],
      },
      {
        name: 'messages_created_at_idx',
        fields: ['created_at'],
      },
      {
        name: 'messages_is_from_customer_idx',
        fields: ['is_from_customer'],
      },
      {
        name: 'messages_is_ai_generated_idx',
        fields: ['is_ai_generated'],
      },
      {
        name: 'messages_conversation_id_idx',
        fields: ['conversation_id'],
      },
    ],
  }
);

// 設置關聯
Message.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

Customer.hasMany(Message, {
  foreignKey: 'customerId',
  as: 'messages',
});

export { Message, MessageAttributes };