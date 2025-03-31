/**
 * 緩存工具類
 * 提供內存緩存功能，用於優化 API 響應時間
 */

interface CacheItem<T> {
  value: T;
  expiry: number | null; // null 表示永不過期
}

class Cache {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number; // 默認過期時間（毫秒）

  /**
   * 創建緩存實例
   * @param defaultTTL 默認過期時間（毫秒），默認為 5 分鐘
   */
  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 設置緩存項
   * @param key 緩存鍵
   * @param value 緩存值
   * @param ttl 過期時間（毫秒），如果為 null 則永不過期
   */
  set<T>(key: string, value: T, ttl: number | null = this.defaultTTL): void {
    const expiry = ttl === null ? null : Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  /**
   * 獲取緩存項
   * @param key 緩存鍵
   * @returns 緩存值，如果不存在或已過期則返回 null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // 如果緩存項不存在，返回 null
    if (!item) {
      return null;
    }
    
    // 如果緩存項已過期，刪除並返回 null
    if (item.expiry !== null && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * 刪除緩存項
   * @param key 緩存鍵
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空緩存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 刪除指定前綴的所有緩存項
   * @param prefix 緩存鍵前綴
   */
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 獲取緩存項，如果不存在則使用提供的函數獲取值並緩存
   * @param key 緩存鍵
   * @param fetcher 獲取值的函數
   * @param ttl 過期時間（毫秒），如果為 null 則永不過期
   * @returns 緩存值或函數返回值
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl: number | null = this.defaultTTL): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }
}

// 創建一個全局緩存實例
const cache = new Cache();

export default cache;