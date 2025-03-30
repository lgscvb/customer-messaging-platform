import express from 'express';
import { Request, Response, NextFunction } from 'express';
import MessageController from '../controllers/message-controller';
import * as authMiddleware from '../middlewares/auth';

const router = express.Router();

// 創建中間件包裝器，解決類型問題
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  return authMiddleware.authenticateJwt(req, res, next);
};

/**
 * @route GET /api/messages
 * @desc 獲取消息列表
 * @access Private
 */
router.get('/', authenticate, MessageController.getMessages);

/**
 * @route GET /api/messages/conversation/:customerId
 * @desc 獲取客戶對話
 * @access Private
 */
router.get('/conversation/:customerId', authenticate, MessageController.getCustomerConversation);

/**
 * @route POST /api/messages/send
 * @desc 發送消息
 * @access Private
 */
router.post('/send', authenticate, MessageController.sendMessage);

/**
 * @route PUT /api/messages/:messageId/read
 * @desc 標記消息為已讀
 * @access Private
 */
router.put('/:messageId/read', authenticate, MessageController.markAsRead);

/**
 * @route PUT /api/messages/customer/:customerId/read-all
 * @desc 標記客戶所有消息為已讀
 * @access Private
 */
router.put('/customer/:customerId/read-all', authenticate, MessageController.markAllAsRead);

/**
 * @route GET /api/messages/unread-count
 * @desc 獲取未讀消息數量
 * @access Private
 */
router.get('/unread-count', authenticate, MessageController.getUnreadCount);

/**
 * @route DELETE /api/messages/:messageId
 * @desc 刪除消息
 * @access Private
 */
router.delete('/:messageId', authenticate, MessageController.deleteMessage);

export default router;