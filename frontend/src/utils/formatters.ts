/**
 * 格式化日期
 * @param date 日期對象或日期字符串
 * @param options 格式化選項
 * @returns 格式化後的日期字符串
 */
export const formatDate = (date: Date | string, options: Intl.DateTimeFormatOptions = { 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit' 
}): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-TW', options).format(dateObj);
};

/**
 * 格式化數字
 * @param value 數字
 * @param options 格式化選項
 * @returns 格式化後的數字字符串
 */
export const formatNumber = (value: number, options: Intl.NumberFormatOptions = { 
  maximumFractionDigits: 2 
}): string => {
  return new Intl.NumberFormat('zh-TW', options).format(value);
};

/**
 * 格式化貨幣
 * @param value 金額
 * @param currency 貨幣代碼
 * @param options 格式化選項
 * @returns 格式化後的貨幣字符串
 */
export const formatCurrency = (
  value: number, 
  currency: string = 'TWD', 
  options: Intl.NumberFormatOptions = {}
): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    ...options
  }).format(value);
};

/**
 * 格式化百分比
 * @param value 百分比值（0-1）
 * @param options 格式化選項
 * @returns 格式化後的百分比字符串
 */
export const formatPercent = (
  value: number, 
  options: Intl.NumberFormatOptions = { 
    maximumFractionDigits: 1 
  }
): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'percent',
    ...options
  }).format(value);
};

/**
 * 格式化文件大小
 * @param bytes 字節數
 * @param decimals 小數位數
 * @returns 格式化後的文件大小字符串
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * 格式化持續時間（毫秒）
 * @param milliseconds 毫秒數
 * @returns 格式化後的持續時間字符串
 */
export const formatDuration = (milliseconds: number): string => {
  // 轉換為秒
  const seconds = Math.floor(milliseconds / 1000);
  
  // 計算小時、分鐘和秒
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  // 格式化輸出
  if (hours > 0) {
    return `${hours}小時 ${minutes}分鐘`;
  } else if (minutes > 0) {
    return `${minutes}分鐘 ${remainingSeconds}秒`;
  } else {
    return `${remainingSeconds}秒`;
  }
};

/**
 * 格式化電話號碼
 * @param phoneNumber 電話號碼
 * @returns 格式化後的電話號碼
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // 移除所有非數字字符
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // 台灣手機號碼格式化 (09xx-xxx-xxx)
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // 台灣市話格式化 (0x-xxxx-xxxx)
  if (cleaned.length === 9 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // 如果不符合已知格式，返回原始號碼
  return phoneNumber;
};