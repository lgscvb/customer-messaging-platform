import winston from 'winston';
import path from 'path';
import fs from 'fs';

// 確保日誌目錄存在
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定義日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 定義控制台輸出格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { level, message, timestamp, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
  })
);

// 創建 Winston 日誌實例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'customer-messaging-platform' },
  transports: [
    // 寫入所有日誌到 combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
    // 寫入錯誤日誌到 error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  ],
});

// 在非生產環境下，同時輸出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// 創建一個流，用於 Morgan 日誌中間件
const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

(logger as any).stream = loggerStream;

/**
 * 創建一個帶有上下文的日誌記錄器
 * @param context 上下文名稱
 * @returns 帶有上下文的日誌記錄器
 */
export const createContextLogger = (context: string) => {
  return {
    error: (message: string, meta?: Record<string, any>) => logger.error(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: Record<string, any>) => logger.warn(`[${context}] ${message}`, meta),
    info: (message: string, meta?: Record<string, any>) => logger.info(`[${context}] ${message}`, meta),
    debug: (message: string, meta?: Record<string, any>) => logger.debug(`[${context}] ${message}`, meta),
    verbose: (message: string, meta?: Record<string, any>) => logger.verbose(`[${context}] ${message}`, meta),
  };
};

export default logger;