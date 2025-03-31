const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const winston = require('winston');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redis = require('redis');

// 環境變量配置
require('dotenv').config();

// 創建 Express 應用
const app = express();
const PORT = process.env.PORT || 3001;

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

// 連接到 MongoDB
mongoose.connect(\`mongodb://\${process.env.DB_HOST}:\${process.env.DB_PORT}/\${process.env.DB_NAME}\`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD
})
.then(() => {
  logger.info('成功連接到 MongoDB');
})
.catch((error) => {
  logger.error('MongoDB 連接失敗', { error });
  process.exit(1);
});

// 連接到 Redis
const redisClient = redis.createClient({
  url: \`redis://\${process.env.REDIS_HOST}:\${process.env.REDIS_PORT}\`,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => {
  logger.error('Redis 連接錯誤', { error: err });
});

redisClient.connect().then(() => {
  logger.info('成功連接到 Redis');
}).catch((err) => {
  logger.error('Redis 連接失敗', { error: err });
});

// 中間件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok' });
});

// 用戶模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 路由
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 檢查用戶是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        status: 'error',
        message: '用戶名或電子郵件已存在'
      });
    }

    // 加密密碼
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 創建新用戶
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: '用戶註冊成功'
    });
  } catch (error) {
    logger.error('註冊失敗', { error });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: '註冊失敗'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用戶
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: '用戶名或密碼不正確'
      });
    }

    // 驗證密碼
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: '用戶名或密碼不正確'
      });
    }

    // 生成 JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 將 token 存儲在 Redis 中
    await redisClient.set(\`auth_\${user._id}\`, token, {
      EX: 60 * 60 * 8 // 8 小時
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('登錄失敗', { error });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: '登錄失敗'
    });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { userId } = req.body;

    // 從 Redis 中刪除 token
    await redisClient.del(\`auth_\${userId}\`);

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: '登出成功'
    });
  } catch (error) {
    logger.error('登出失敗', { error });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: '登出失敗'
    });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: '未提供 token'
      });
    }

    // 驗證 JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 檢查 token 是否在 Redis 中
    const storedToken = await redisClient.get(\`auth_\${decoded.id}\`);
    if (!storedToken || storedToken !== token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'token 無效或已過期'
      });
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      }
    });
  } catch (error) {
    logger.error('token 驗證失敗', { error });
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      message: 'token 無效或已過期'
    });
  }
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  logger.error(\`\${err.name}: \${err.message}\`, { stack: err.stack });
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: err.message || '服務器內部錯誤'
  });
});

// 啟動服務器
app.listen(PORT, () => {
  logger.info(\`Auth Service 運行在端口 \${PORT}\`);
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