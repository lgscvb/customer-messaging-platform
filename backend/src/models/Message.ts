import { Model, DataTypes, Optional } from 'sequelize';
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
  messageType: MessageType;
  content: string | null;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建消息時的可選屬性
 */
interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'isRead' | 'readAt' | 'createdAt' | 'updatedAt'> {}

/**
 * 消息模型類
 */
class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public customerId!: string;
  public direction!: MessageDirection;
  public platformType!: PlatformType;
  public messageType!: MessageType;
  public content!: string | null;
  public metadata!: Record<string, any>;
  public isRead!: boolean;
  public readAt!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // 關聯
  public customer?: Customer;
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

export { Message };