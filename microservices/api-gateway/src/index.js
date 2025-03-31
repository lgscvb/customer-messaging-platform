const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const proxy = require('express-http-proxy');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');

// 環境變量配置
require('dotenv').config();

// 創建 Express 應用
const app = express();
const PORT = process.env.PORT || 3000;

// 配置日誌
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 中間件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 每個 IP 限制 100 個請求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: '請求過多，請稍後再試'
  }
});

// 健康檢查端點
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok' });
});

// 服務路由
app.use('/api/auth', apiLimiter, proxy(process.env.AUTH_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/auth${req.url}`
}));

app.use('/api/messages', proxy(process.env.MESSAGE_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/messages${req.url}`
}));

app.use('/api/ai', proxy(process.env.AI_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/ai${req.url}`
}));

app.use('/api/knowledge', proxy(process.env.KNOWLEDGE_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/knowledge${req.url}`
}));

app.use('/api/platforms', proxy(process.env.PLATFORM_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/platforms${req.url}`
}));

app.use('/api/analytics', proxy(process.env.ANALYTICS_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/analytics${req.url}`
}));

// 錯誤處理中間件
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: err.message || '服務器內部錯誤'
  });
});

// 啟動服務器
app.listen(PORT, () => {
  logger.info(`API Gateway 運行在端口 ${PORT}`);
});

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  logger.error('未捕獲的異常', { error });
  process.exit(1);
});

// 處理未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未處理的 Promise 拒絕', { reason });
});

module.exports = app;