import pool from '../config/database';
import { QueryResult } from 'pg';
import CustomerPlatformModel, { CustomerPlatform } from './CustomerPlatform';

// 保留舊的接口以兼容現有代碼
export interface CustomerPlatformInfo {
  platform: string;
  platformId: string;
  displayName?: string;
  profileImage?: string;
  metadata?: Record<string, any>;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  platforms?: CustomerPlatform[]; // 改為可選，並使用新的 CustomerPlatform 類型
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt?: Date;
}

export interface CreateCustomerDTO {
  name: string;
  email?: string;
  phone?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  // 移除 platforms 參數，平台關聯將通過 CustomerPlatformModel 創建
}

export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  // 移除 platforms 參數，平台關聯將通過 CustomerPlatformModel 更新
}

class CustomerModel {
  /**
   * 創建客戶
   */
  async create(customer: CreateCustomerDTO): Promise<Customer> {
    const { name, email, phone, tags = [], metadata = {} } = customer;
    
    const query = `
      INSERT INTO customers (
        name, email, phone, tags, metadata
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [name, email, phone, tags, metadata];
    
    try {
      const result: QueryResult = await pool.query(query, values);
      return this.mapToCustomer(result.rows[0]);
    } catch (error) {
      console.error('創建客戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據ID查詢客戶
   * @param id 客戶ID
   * @param includePlatforms 是否包含平台信息
   */
  async findById(id: string, includePlatforms: boolean = false): Promise<Customer | null> {
    const query = 'SELECT * FROM customers WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const customer = this.mapToCustomer(result.rows[0]);
      
      // 如果需要包含平台信息
      if (includePlatforms) {
        customer.platforms = await CustomerPlatformModel.findByCustomerId(id);
      }
      
      return customer;
    } catch (error) {
      console.error('查詢客戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據平台ID查詢客戶
   * 使用新的 CustomerPlatformModel 實現
   */
  async findByPlatformId(platform: string, platformId: string, includePlatforms: boolean = false): Promise<Customer | null> {
    try {
      // 查詢平台關聯
      const platformInfo = await CustomerPlatformModel.findByPlatformId(platform, platformId);
      
      if (!platformInfo) {
        return null;
      }
      
      // 查詢客戶
      return this.findById(platformInfo.customerId, includePlatforms);
    } catch (error) {
      console.error('根據平台ID查詢客戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新客戶信息
   */
  async update(id: string, updateData: UpdateCustomerDTO): Promise<Customer | null> {
    // 構建更新查詢
    let updateQuery = 'UPDATE customers SET ';
    const updateValues: any[] = [];
    let valueIndex = 1;
    
    // 添加要更新的字段
    const updates: string[] = [];
    
    if (updateData.name !== undefined) {
      updates.push(`name = $${valueIndex++}`);
      updateValues.push(updateData.name);
    }
    
    if (updateData.email !== undefined) {
      updates.push(`email = $${valueIndex++}`);
      updateValues.push(updateData.email);
    }
    
    if (updateData.phone !== undefined) {
      updates.push(`phone = $${valueIndex++}`);
      updateValues.push(updateData.phone);
    }
    
    if (updateData.tags !== undefined) {
      updates.push(`tags = $${valueIndex++}`);
      updateValues.push(updateData.tags);
    }
    
    if (updateData.metadata !== undefined) {
      updates.push(`metadata = $${valueIndex++}`);
      updateValues.push(updateData.metadata);
    }
    
    // 添加更新時間
    updates.push(`updated_at = NOW()`);
    
    // 如果沒有要更新的字段，則返回null
    if (updates.length === 0) {
      return null;
    }
    
    // 完成更新查詢
    updateQuery += updates.join(', ');
    updateQuery += ` WHERE id = $${valueIndex} RETURNING *`;
    updateValues.push(id);
    
    try {
      const result: QueryResult = await pool.query(updateQuery, updateValues);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToCustomer(result.rows[0]);
    } catch (error) {
      console.error('更新客戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新客戶最後互動時間
   */
  async updateLastInteraction(id: string): Promise<boolean> {
    const query = `
      UPDATE customers 
      SET last_interaction_at = NOW(), updated_at = NOW() 
      WHERE id = $1
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('更新客戶最後互動時間錯誤:', error);
      throw error;
    }
  }

  /**
   * 搜索客戶
   */
  async search(searchTerm: string, limit: number = 20, offset: number = 0, includePlatforms: boolean = false): Promise<Customer[]> {
    const query = `
      SELECT * FROM customers 
      WHERE 
        name ILIKE $1 OR 
        email ILIKE $1 OR 
        phone ILIKE $1 OR
        $1 = ANY(tags)
      ORDER BY last_interaction_at DESC NULLS LAST, created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
      const customers = result.rows.map(row => this.mapToCustomer(row));
      
      // 如果需要包含平台信息
      if (includePlatforms && customers.length > 0) {
        for (const customer of customers) {
          customer.platforms = await CustomerPlatformModel.findByCustomerId(customer.id);
        }
      }
      
      return customers;
    } catch (error) {
      console.error('搜索客戶錯誤:', error);
      throw error;
    }
  }

  /**
   * 將資料庫行映射到客戶對象
   */
  private mapToCustomer(row: any): Customer {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      tags: row.tags || [],
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastInteractionAt: row.last_interaction_at,
      // 不再從資料庫行中讀取 platforms，而是通過 CustomerPlatformModel 加載
    };
  }

  /**
   * 加載客戶的平台信息
   */
  async loadPlatforms(customerId: string): Promise<CustomerPlatform[]> {
    return CustomerPlatformModel.findByCustomerId(customerId);
  }
}

export default new CustomerModel();