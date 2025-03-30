import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Customer } from './Customer';
import { Message } from './Message';

/**
 * 購買記錄屬性接口
 */
interface PurchaseAttributes {
  id: string;
  customerId: string;
  conversationId: string | null;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建購買記錄時的可選屬性
 */
interface PurchaseCreationAttributes extends Optional<PurchaseAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * 購買記錄模型類
 */
class Purchase extends Model<PurchaseAttributes, PurchaseCreationAttributes> implements PurchaseAttributes {
  public id!: string;
  public customerId!: string;
  public conversationId!: string | null;
  public amount!: number;
  public currency!: string;
  public status!: string;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // 關聯
  public customer?: Customer;
  public items?: PurchaseItem[];
}

// 初始化購買記錄模型
Purchase.init(
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
    conversationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'TWD',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'completed',
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
    modelName: 'Purchase',
    tableName: 'purchases',
    timestamps: true,
    indexes: [
      {
        name: 'purchases_customer_id_idx',
        fields: ['customer_id'],
      },
      {
        name: 'purchases_conversation_id_idx',
        fields: ['conversation_id'],
      },
      {
        name: 'purchases_created_at_idx',
        fields: ['created_at'],
      },
    ],
  }
);

/**
 * 購買項目屬性接口
 */
interface PurchaseItemAttributes {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建購買項目時的可選屬性
 */
interface PurchaseItemCreationAttributes extends Optional<PurchaseItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * 購買項目模型類
 */
class PurchaseItem extends Model<PurchaseItemAttributes, PurchaseItemCreationAttributes> implements PurchaseItemAttributes {
  public id!: string;
  public purchaseId!: string;
  public productId!: string;
  public productName!: string;
  public quantity!: number;
  public unitPrice!: number;
  public amount!: number;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // 關聯
  public purchase?: Purchase;
}

// 初始化購買項目模型
PurchaseItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    purchaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'purchases',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    modelName: 'PurchaseItem',
    tableName: 'purchase_items',
    timestamps: true,
    indexes: [
      {
        name: 'purchase_items_purchase_id_idx',
        fields: ['purchase_id'],
      },
      {
        name: 'purchase_items_product_id_idx',
        fields: ['product_id'],
      },
    ],
  }
);

// 設置關聯
Purchase.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

Customer.hasMany(Purchase, {
  foreignKey: 'customerId',
  as: 'purchases',
});

Purchase.hasMany(PurchaseItem, {
  foreignKey: 'purchaseId',
  as: 'items',
});

PurchaseItem.belongsTo(Purchase, {
  foreignKey: 'purchaseId',
  as: 'purchase',
});

export { Purchase, PurchaseItem, PurchaseAttributes, PurchaseItemAttributes };