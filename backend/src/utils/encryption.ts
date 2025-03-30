import crypto from 'crypto';

// 加密密鑰和初始化向量
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-characters';
const IV_LENGTH = 16; // AES 區塊大小為 16 字節

/**
 * 加密字符串
 * @param text 要加密的文本
 * @returns 加密後的文本（Base64 編碼）
 */
export function encrypt(text: string): string {
  try {
    // 生成隨機初始化向量
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // 創建加密器
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // 加密文本
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // 將初始化向量與加密文本組合，以便解密時使用
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('加密錯誤:', error);
    return text; // 如果加密失敗，返回原始文本
  }
}

/**
 * 解密字符串
 * @param encryptedText 加密的文本（Base64 編碼）
 * @returns 解密後的文本
 */
export function decrypt(encryptedText: string): string {
  try {
    // 分離初始化向量和加密文本
    const textParts = encryptedText.split(':');
    
    // 如果格式不正確，返回原始文本
    if (textParts.length !== 2) {
      return encryptedText;
    }
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];
    
    // 創建解密器
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    // 解密文本
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('解密錯誤:', error);
    return encryptedText; // 如果解密失敗，返回原始文本
  }
}

/**
 * 生成隨機密鑰
 * @param length 密鑰長度
 * @returns 隨機密鑰
 */
export function generateRandomKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 計算哈希值
 * @param text 要計算哈希的文本
 * @param algorithm 哈希算法
 * @returns 哈希值
 */
export function hash(text: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(text).digest('hex');
}

/**
 * 比較哈希值
 * @param text 原始文本
 * @param hashedText 哈希後的文本
 * @param algorithm 哈希算法
 * @returns 是否匹配
 */
export function compareHash(text: string, hashedText: string, algorithm: string = 'sha256'): boolean {
  const newHash = hash(text, algorithm);
  return newHash === hashedText;
}