import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 知識項目屬性接口
 */
export interface KnowledgeItemAttributes {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl?: string;
  createdBy: string;
  updatedBy: string;
  isPublished: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建知識項目時的可選屬性
 */
export interface KnowledgeItemCreationAttributes extends Optional<KnowledgeItemAttributes, 'id' | 'tags' | 'sourceUrl' | 'metadata' | 'createdAt' | 'updatedAt'> {}

/**
 * 創建知識項目 DTO
 */
export interface CreateKnowledgeItemDTO {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  source: string;
  sourceUrl?: string;
  isPublished?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 更新知識項目 DTO
 */
export interface UpdateKnowledgeItemDTO {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  source?: string;
  sourceUrl?: string;
  isPublished?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 知識項目模型類
 */
class KnowledgeItem extends Model<KnowledgeItemAttributes, KnowledgeItemCreationAttributes> implements KnowledgeItemAttributes {
  public id!: string;
  public title!: string;
  public content!: string;
  public category!: string;
  public tags!: string[];
  public source!: string;
  public sourceUrl!: string | undefined;
  public createdBy!: string;
  public updatedBy!: string;
  public isPublished!: boolean;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
}

// 初始化知識項目模型
KnowledgeItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sourceUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: 'KnowledgeItem',
    tableName: 'knowledge_items',
    timestamps: true,
    indexes: [
      {
        name: 'knowledge_items_category_idx',
        fields: ['category'],
      },
      {
        name: 'knowledge_items_tags_idx',
        fields: ['tags'],
        using: 'gin',
      },
      {
        name: 'knowledge_items_is_published_idx',
        fields: ['is_published'],
      },
    ],
  }
);

// 導出默認模型
export default KnowledgeItem;