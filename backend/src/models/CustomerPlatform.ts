import pool from '../config/database';
import { QueryResult } from 'pg';

/**
 * 客戶平台信息接口
 */
export interface CustomerPlatform {
  id: string;
  customerId: string;
  platform: string;
  platformId: string;
  displayName?: string;
  profileImage?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建客戶平台關聯的數據傳輸對象
 */
export interface CreateCustomerPlatformDTO {
  customerId: string;
  platform: string;
  platformId: string;
  displayName?: string;
  profileImage?: string;
  metadata?: Record<string, any>;
}

/**
 * 更新客戶平台關聯的數據傳輸對象
 */
export interface UpdateCustomerPlatformDTO {
  displayName?: string;
  profileImage?: string;
  metadata?: Record<string, any>;
}

/**
 * 客戶平台關聯模型
 * 處理客戶與各平台之間的關聯關係
 */
class CustomerPlatformModel {
  /**
   * 創建客戶平台關聯
   */
  async create(data: CreateCustomerPlatformDTO): Promise<CustomerPlatform> {
    const { customerId, platform, platformId, displayName, profileImage, metadata = {} } = data;
    
    const query = `
      INSERT INTO customer_platforms (
        customer_id, platform, platform_id, display_name, profile_image, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [customerId, platform, platformId, displayName, profileImage, metadata];
    
    try {
      const result: QueryResult = await pool.query(query, values);
      return this.mapToCustomerPlatform(result.rows[0]);
    } catch (error) {
      console.error('創建客戶平台關聯錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據平台和平台ID查找客戶平台關聯
   */
  async findByPlatformId(platform: string, platformId: string): Promise<CustomerPlatform | null> {
    const query = `
      SELECT * FROM customer_platforms 
      WHERE platform = $1 AND platform_id = $2
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [platform, platformId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToCustomerPlatform(result.rows[0]);
    } catch (error) {
      console.error('查詢客戶平台關聯錯誤:', error);
      throw error;
    }
  }

  /**
   * 查找或創建客戶平台關聯（使用 upsert 操作）
   */
  async findOrCreate(
    platform: string, 
    platformId: string, 
    customerData: { 
      customerId: string; 
      displayName?: string; 
      profileImage?: string; 
      metadata?: Record<string, any>;
    }
  ): Promise<{ customerPlatform: CustomerPlatform; created: boolean }> {
    const { customerId, displayName, profileImage, metadata = {} } = customerData;
    
    const query = `
      INSERT INTO customer_platforms (
        customer_id, platform, platform_id, display_name, profile_image, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (platform, platform_id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, customer_platforms.display_name),
        profile_image = COALESCE(EXCLUDED.profile_image, customer_platforms.profile_image),
        metadata = customer_platforms.metadata || EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *, (xmax = 0) AS created
    `;
    
    const values = [customerId, platform, platformId, displayName, profileImage, metadata];
    
    try {
      const result: QueryResult = await pool.query(query, values);
      const customerPlatform = this.mapToCustomerPlatform(result.rows[0]);
      const created = result.rows[0].created;
      
      return { customerPlatform, created };
    } catch (error) {
      console.error('查找或創建客戶平台關聯錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據客戶ID查找所有平台關聯
   */
  async findByCustomerId(customerId: string): Promise<CustomerPlatform[]> {
    const query = `
      SELECT * FROM customer_platforms 
      WHERE customer_id = $1
      ORDER BY updated_at DESC
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [customerId]);
      return result.rows.map(row => this.mapToCustomerPlatform(row));
    } catch (error) {
      console.error('查詢客戶平台關聯錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新客戶平台關聯
   */
  async update(
    platform: string, 
    platformId: string, 
    updateData: UpdateCustomerPlatformDTO
  ): Promise<CustomerPlatform | null> {
    const { displayName, profileImage, metadata } = updateData;
    
    // 構建更新查詢
    let updateQuery = 'UPDATE customer_platforms SET ';
    const updateValues: any[] = [];
    let valueIndex = 1;
    
    // 添加要更新的字段
    const updates: string[] = [];
    
    if (displayName !== undefined) {
      updates.push(`display_name = $${valueIndex++}`);
      updateValues.push(displayName);
    }
    
    if (profileImage !== undefined) {
      updates.push(`profile_image = $${valueIndex++}`);
      updateValues.push(profileImage);
    }
    
    if (metadata !== undefined) {
      updates.push(`metadata = customer_platforms.metadata || $${valueIndex++}`);
      updateValues.push(metadata);
    }
    
    // 添加更新時間
    updates.push(`updated_at = NOW()`);
    
    // 如果沒有要更新的字段，則返回null
    if (updates.length === 0) {
      return null;
    }
    
    // 完成更新查詢
    updateQuery += updates.join(', ');
    updateQuery += ` WHERE platform = $${valueIndex++} AND platform_id = $${valueIndex++} RETURNING *`;
    updateValues.push(platform, platformId);
    
    try {
      const result: QueryResult = await pool.query(updateQuery, updateValues);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToCustomerPlatform(result.rows[0]);
    } catch (error) {
      console.error('更新客戶平台關聯錯誤:', error);
      throw error;
    }
  }

  /**
   * 刪除客戶平台關聯
   */
  async delete(platform: string, platformId: string): Promise<boolean> {
    const query = `
      DELETE FROM customer_platforms 
      WHERE platform = $1 AND platform_id = $2
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [platform, platformId]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('刪除客戶平台關聯錯誤:', error);
      throw error;
    }
  }

  /**
   * 將資料庫行映射到客戶平台關聯對象
   */
  private mapToCustomerPlatform(row: any): CustomerPlatform {
    return {
      id: row.id,
      customerId: row.customer_id,
      platform: row.platform,
      platformId: row.platform_id,
      displayName: row.display_name,
      profileImage: row.profile_image,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new CustomerPlatformModel();