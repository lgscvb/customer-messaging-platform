import { QueryInterface, DataTypes } from 'sequelize';

/**
 * 創建嵌入向量表的遷移文件
 */
module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // 創建嵌入向量類型枚舉
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_embeddings_source_type" AS ENUM ('knowledge_item', 'message', 'document');
    `);

    // 創建嵌入向量表
    await queryInterface.createTable('embeddings', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      source_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      source_type: {
        type: DataTypes.ENUM,
        values: ['knowledge_item', 'message', 'document'],
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // 創建索引
    await queryInterface.addIndex('embeddings', ['source_id', 'source_type'], {
      name: 'embeddings_source_id_source_type_idx',
    });

    await queryInterface.addIndex('embeddings', ['model'], {
      name: 'embeddings_model_idx',
    });

    // 創建 GIN 索引用於向量搜索
    await queryInterface.sequelize.query(`
      CREATE INDEX embeddings_vector_idx ON embeddings USING gin(vector);
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // 刪除表
    await queryInterface.dropTable('embeddings');

    // 刪除枚舉類型
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_embeddings_source_type";
    `);
  },
};