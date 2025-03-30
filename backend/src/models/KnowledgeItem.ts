import pool from '../config/database';
import { QueryResult } from 'pg';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  vectorEmbedding?: number[];
  metadata: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKnowledgeItemDTO {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  vectorEmbedding?: number[];
  metadata?: Record<string, any>;
  createdBy: string;
}

export interface UpdateKnowledgeItemDTO {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  vectorEmbedding?: number[];
  metadata?: Record<string, any>;
  updatedBy: string;
}

class KnowledgeItemModel {
  /**
   * 創建知識條目
   */
  async create(item: CreateKnowledgeItemDTO): Promise<KnowledgeItem> {
    const { title, content, category, tags = [], vectorEmbedding, metadata = {}, createdBy } = item;
    
    const query = `
      INSERT INTO knowledge_items (
        title, content, category, tags, vector_embedding, metadata, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING *
    `;
    
    const values = [title, content, category, tags, vectorEmbedding, metadata, createdBy];
    
    try {
      const result: QueryResult = await pool.query(query, values);
      return this.mapToKnowledgeItem(result.rows[0]);
    } catch (error) {
      console.error('創建知識條目錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據ID查詢知識條目
   */
  async findById(id: string): Promise<KnowledgeItem | null> {
    const query = 'SELECT * FROM knowledge_items WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToKnowledgeItem(result.rows[0]);
    } catch (error) {
      console.error('查詢知識條目錯誤:', error);
      throw error;
    }
  }

  /**
   * 更新知識條目
   */
  async update(id: string, updateData: UpdateKnowledgeItemDTO): Promise<KnowledgeItem | null> {
    // 構建更新查詢
    let updateQuery = 'UPDATE knowledge_items SET ';
    const updateValues: any[] = [];
    let valueIndex = 1;
    
    // 添加要更新的字段
    const updates: string[] = [];
    
    if (updateData.title !== undefined) {
      updates.push(`title = $${valueIndex++}`);
      updateValues.push(updateData.title);
    }
    
    if (updateData.content !== undefined) {
      updates.push(`content = $${valueIndex++}`);
      updateValues.push(updateData.content);
    }
    
    if (updateData.category !== undefined) {
      updates.push(`category = $${valueIndex++}`);
      updateValues.push(updateData.category);
    }
    
    if (updateData.tags !== undefined) {
      updates.push(`tags = $${valueIndex++}`);
      updateValues.push(updateData.tags);
    }
    
    if (updateData.vectorEmbedding !== undefined) {
      updates.push(`vector_embedding = $${valueIndex++}`);
      updateValues.push(updateData.vectorEmbedding);
    }
    
    if (updateData.metadata !== undefined) {
      updates.push(`metadata = $${valueIndex++}`);
      updateValues.push(updateData.metadata);
    }
    
    // 添加更新者和更新時間
    updates.push(`updated_by = $${valueIndex++}`);
    updateValues.push(updateData.updatedBy);
    
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
      
      return this.mapToKnowledgeItem(result.rows[0]);
    } catch (error) {
      console.error('更新知識條目錯誤:', error);
      throw error;
    }
  }

  /**
   * 刪除知識條目
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM knowledge_items WHERE id = $1';
    
    try {
      const result: QueryResult = await pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('刪除知識條目錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據類別查詢知識條目
   */
  async findByCategory(category: string, limit: number = 50, offset: number = 0): Promise<KnowledgeItem[]> {
    const query = `
      SELECT * FROM knowledge_items 
      WHERE category = $1 
      ORDER BY updated_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [category, limit, offset]);
      return result.rows.map(row => this.mapToKnowledgeItem(row));
    } catch (error) {
      console.error('根據類別查詢知識條目錯誤:', error);
      throw error;
    }
  }

  /**
   * 根據標籤查詢知識條目
   */
  async findByTag(tag: string, limit: number = 50, offset: number = 0): Promise<KnowledgeItem[]> {
    const query = `
      SELECT * FROM knowledge_items 
      WHERE $1 = ANY(tags) 
      ORDER BY updated_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [tag, limit, offset]);
      return result.rows.map(row => this.mapToKnowledgeItem(row));
    } catch (error) {
      console.error('根據標籤查詢知識條目錯誤:', error);
      throw error;
    }
  }

  /**
   * 搜索知識條目
   */
  async search(searchTerm: string, limit: number = 50, offset: number = 0): Promise<KnowledgeItem[]> {
    const query = `
      SELECT * FROM knowledge_items 
      WHERE 
        title ILIKE $1 OR 
        content ILIKE $1 OR 
        category ILIKE $1 OR
        $1 = ANY(tags)
      ORDER BY updated_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result: QueryResult = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
      return result.rows.map(row => this.mapToKnowledgeItem(row));
    } catch (error) {
      console.error('搜索知識條目錯誤:', error);
      throw error;
    }
  }

  /**
   * 將資料庫行映射到知識條目對象
   */
  private mapToKnowledgeItem(row: any): KnowledgeItem {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags || [],
      vectorEmbedding: row.vector_embedding,
      metadata: row.metadata || {},
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default new KnowledgeItemModel();