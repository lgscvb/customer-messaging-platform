import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 嵌入向量屬性接口
 */
export interface EmbeddingAttributes {
  id: string;
  sourceId: string;
  sourceType: 'knowledge_item' | 'message' | 'document';
  vector: number[];
  dimensions: number;
  model: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建嵌入向量時的可選屬性
 */
export interface EmbeddingCreationAttributes extends Optional<EmbeddingAttributes, 'id' | 'metadata' | 'createdAt' | 'updatedAt'> {}

/**
 * 嵌入向量模型類
 */
class Embedding extends Model<EmbeddingAttributes, EmbeddingCreationAttributes> implements EmbeddingAttributes {
  public id!: string;
  public sourceId!: string;
  public sourceType!: 'knowledge_item' | 'message' | 'document';
  public vector!: number[];
  public dimensions!: number;
  public model!: string;
  public metadata!: Record<string, any>;
  public createdAt!: Date;
  public updatedAt!: Date;
}

// 初始化嵌入向量模型
Embedding.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sourceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sourceType: {
      type: DataTypes.ENUM('knowledge_item', 'message', 'document'),
      allowNull: false,
    },
    vector: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: false,
    },
    dimensions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
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
    modelName: 'Embedding',
    tableName: 'embeddings',
    timestamps: true,
    indexes: [
      {
        name: 'embeddings_source_id_source_type_idx',
        fields: ['source_id', 'source_type'],
      },
      {
        name: 'embeddings_model_idx',
        fields: ['model'],
      },
    ],
  }
);

/**
 * 嵌入向量模型擴展
 */
export const EmbeddingExtension = {
  /**
   * 根據源 ID 和源類型查找嵌入向量
   * @param sourceId 源 ID
   * @param sourceType 源類型
   */
  async findBySource(sourceId: string, sourceType: 'knowledge_item' | 'message' | 'document'): Promise<Embedding | null> {
    return Embedding.findOne({
      where: {
        sourceId,
        sourceType,
      },
    });
  },

  /**
   * 創建或更新嵌入向量
   * @param sourceId 源 ID
   * @param sourceType 源類型
   * @param vector 向量
   * @param model 模型
   * @param metadata 元數據
   */
  async createOrUpdate(
    sourceId: string,
    sourceType: 'knowledge_item' | 'message' | 'document',
    vector: number[],
    model: string,
    metadata: Record<string, any> = {}
  ): Promise<Embedding> {
    const existing = await this.findBySource(sourceId, sourceType);

    if (existing) {
      await existing.update({
        vector,
        dimensions: vector.length,
        model,
        metadata,
      });
      return existing;
    } else {
      return Embedding.create({
        sourceId,
        sourceType,
        vector,
        dimensions: vector.length,
        model,
        metadata,
      });
    }
  },

  /**
   * 計算向量相似度（餘弦相似度）
   * @param vector1 向量 1
   * @param vector2 向量 2
   */
  calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('向量維度不匹配');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  },

  /**
   * 查找最相似的嵌入向量
   * @param vector 查詢向量
   * @param sourceType 源類型
   * @param limit 限制數量
   * @param threshold 相似度閾值
   */
  async findSimilar(
    vector: number[],
    sourceType: 'knowledge_item' | 'message' | 'document',
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<Array<{ embedding: Embedding; similarity: number }>> {
    // 獲取所有指定類型的嵌入向量
    const embeddings = await Embedding.findAll({
      where: {
        sourceType,
        dimensions: vector.length,
      },
    });

    // 計算相似度
    const similarities = embeddings.map(embedding => ({
      embedding,
      similarity: this.calculateCosineSimilarity(vector, embedding.vector),
    }));

    // 過濾並排序
    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  },

  /**
   * 刪除嵌入向量
   * @param sourceId 源 ID
   * @param sourceType 源類型
   */
  async deleteBySource(sourceId: string, sourceType: 'knowledge_item' | 'message' | 'document'): Promise<boolean> {
    const deleted = await Embedding.destroy({
      where: {
        sourceId,
        sourceType,
      },
    });

    return deleted > 0;
  },
};

export default Embedding;