import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// 加載環境變量
dotenv.config();

// 導入路由
import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
import messageRoutes from './routes/messages';
import platformRoutes from './routes/platforms';
import knowledgeRoutes from './routes/knowledge';
import analyticsRoutes from './routes/analytics';
import webhookRoutes from './routes/webhooks';
import aiRoutes from './routes/ai';
import knowledgeExtractionRoutes from './routes/knowledge-extraction';
import knowledgeOrganizationRoutes from './routes/knowledge-organization';
import apiConfigRoutes from './routes/api-configs';

// 創建 Express 應用
const app = express();

// 創建 HTTP 服務器
const server = createServer(app);

// 創建 Socket.IO 服務器
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 中間件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/knowledge-extraction', knowledgeExtractionRoutes);
app.use('/api/knowledge-organization', knowledgeOrganizationRoutes);
app.use('/api/api-configs', apiConfigRoutes);

// 健康檢查端點
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 處理
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: '找不到請求的資源' });
});

// 錯誤處理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('應用錯誤:', err);
  
  res.status(500).json({
    message: '服務器內部錯誤',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log('新的 Socket.IO 連接:', socket.id);
  
  // 加入房間
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} 加入房間: ${room}`);
  });
  
  // 離開房間
  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} 離開房間: ${room}`);
  });
  
  // 斷開連接
  socket.on('disconnect', () => {
    console.log('Socket.IO 連接斷開:', socket.id);
  });
});

// 導出 Express 應用和 HTTP 服務器
export { app, server, io };