import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { PlatformType } from '../types/platform';
import { Customer } from './Customer';

/**
 * 客戶平台屬性接口
 */
interface CustomerPlatformAttributes {
  id: string;
  customerId: string;
  platformId: string;
  platformType: PlatformType;
  platformData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建客戶平台時的可選屬性
 */
interface CustomerPlatformCreationAttributes extends Optional<CustomerPlatformAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * 客戶平台模型類
 */
class CustomerPlatform extends Model<CustomerPlatformAttributes, CustomerPlatformCreationAttributes> implements CustomerPlatformAttributes {
  public id!: string;
  public customerId!: string;
  public platformId!: string;
  public platformType!: PlatformType;
  public platformData!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // 關聯
  public customer?: Customer;
}

// 初始化客戶平台模型
CustomerPlatform.init(
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
    platformId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    platformType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(PlatformType)],
      },
    },
    platformData: {
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
    modelName: 'CustomerPlatform',
    tableName: 'customer_platforms',
    timestamps: true,
    indexes: [
      {
        name: 'customer_platforms_customer_id_idx',
        fields: ['customer_id'],
      },
      {
        name: 'customer_platforms_platform_id_platform_type_idx',
        fields: ['platform_id', 'platform_type'],
        unique: true,
      },
      {
        name: 'customer_platforms_platform_type_idx',
        fields: ['platform_type'],
      },
    ],
  }
);

// 設置關聯
CustomerPlatform.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

Customer.hasMany(CustomerPlatform, {
  foreignKey: 'customerId',
  as: 'platforms',
});

export { CustomerPlatform };