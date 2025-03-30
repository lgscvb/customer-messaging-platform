import { Model, DataTypes, Optional, Op } from 'sequelize';
import sequelize from '../config/database';
import { CustomerStatus } from '../types/platform';

/**
 * 客戶屬性接口
 */
interface CustomerAttributes {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建客戶時的可選屬性
 */
interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * 客戶模型類
 */
class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: string;
  public name!: string;
  public email!: string | null;
  public phone!: string | null;
  public status!: string;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // 關聯方法將在模型初始化後定義
}

// 初始化客戶模型
Customer.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: CustomerStatus.ACTIVE,
      validate: {
        isIn: [Object.values(CustomerStatus)],
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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
    modelName: 'Customer',
    tableName: 'customers',
    timestamps: true,
    indexes: [
      {
        name: 'customers_email_idx',
        fields: ['email'],
        unique: true,
        where: {
          email: { [Op.ne]: null },
        },
      },
      {
        name: 'customers_phone_idx',
        fields: ['phone'],
        unique: true,
        where: {
          phone: { [Op.ne]: null },
        },
      },
      {
        name: 'customers_status_idx',
        fields: ['status'],
      },
    ],
  }
);

export { Customer };