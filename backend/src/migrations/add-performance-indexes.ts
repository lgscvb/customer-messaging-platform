import { QueryInterface } from 'sequelize';

/**
 * 添加性能優化索引的遷移文件
 */
module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // 為 messages 表添加複合索引
    await queryInterface.addIndex('messages', ['customer_id', 'created_at'], {
      name: 'messages_customer_id_created_at_idx',
    });

    await queryInterface.addIndex('messages', ['customer_id', 'is_read'], {
      name: 'messages_customer_id_is_read_idx',
    });

    await queryInterface.addIndex('messages', ['conversation_id', 'created_at'], {
      name: 'messages_conversation_id_created_at_idx',
    });

    // 為 knowledge_items 表添加全文搜索索引
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS knowledge_items_title_content_idx ON knowledge_items USING gin(to_tsvector('english', title || ' ' || content));
    `);

    await queryInterface.addIndex('knowledge_items', ['category', 'is_published'], {
      name: 'knowledge_items_category_is_published_idx',
    });

    // 為 api_configs 表添加索引
    await queryInterface.addIndex('api_configs', ['type', 'is_active'], {
      name: 'api_configs_type_is_active_idx',
    });

    // 為 customers 表添加索引
    await queryInterface.addIndex('customers', ['platform_type', 'platform_id'], {
      name: 'customers_platform_type_platform_id_idx',
    });

    await queryInterface.addIndex('customers', ['email'], {
      name: 'customers_email_idx',
    });

    // 為 customer_platforms 表添加複合索引
    await queryInterface.addIndex('customer_platforms', ['customer_id', 'platform_type'], {
      name: 'customer_platforms_customer_id_platform_type_idx',
    });

    // 為 sync_histories 表添加索引
    await queryInterface.addIndex('sync_histories', ['platform_id', 'created_at'], {
      name: 'sync_histories_platform_id_created_at_idx',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // 刪除 messages 表的索引
    await queryInterface.removeIndex('messages', 'messages_customer_id_created_at_idx');
    await queryInterface.removeIndex('messages', 'messages_customer_id_is_read_idx');
    await queryInterface.removeIndex('messages', 'messages_conversation_id_created_at_idx');

    // 刪除 knowledge_items 表的索引
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS knowledge_items_title_content_idx;
    `);
    await queryInterface.removeIndex('knowledge_items', 'knowledge_items_category_is_published_idx');

    // 刪除 api_configs 表的索引
    await queryInterface.removeIndex('api_configs', 'api_configs_type_is_active_idx');

    // 刪除 customers 表的索引
    await queryInterface.removeIndex('customers', 'customers_platform_type_platform_id_idx');
    await queryInterface.removeIndex('customers', 'customers_email_idx');

    // 刪除 customer_platforms 表的索引
    await queryInterface.removeIndex('customer_platforms', 'customer_platforms_customer_id_platform_type_idx');

    // 刪除 sync_histories 表的索引
    await queryInterface.removeIndex('sync_histories', 'sync_histories_platform_id_created_at_idx');
  },
};