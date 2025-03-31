import { Request, Response } from 'express';
import messageController from '../message-controller';
import messageService from '../../services/message-service';
import { PlatformType, MessageDirection, MessageType } from '../../types/platform';
import logger from '../../utils/logger';

// 模擬依賴
jest.mock('../../services/message-service');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('MessageController', () => {
  // 模擬 Request 和 Response 對象
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();

    // 設置 Response 模擬
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('getMessages', () => {
    it('應該獲取消息列表', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          direction: MessageDirection.INBOUND,
          isRead: 'false',
          limit: '10',
          offset: '0',
        },
      };

      // 模擬消息數據
      const mockMessages = [
        {
          id: 'message-1',
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          direction: MessageDirection.INBOUND,
          messageType: MessageType.TEXT,
          content: '您好，我想了解智能家居系統',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'message-2',
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          direction: MessageDirection.INBOUND,
          messageType: MessageType.TEXT,
          content: '請問基礎版的價格是多少？',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      // 設置模擬函數的返回值
      (messageService.getMessages as jest.Mock).mockResolvedValue(mockMessages);

      // 執行測試
      await messageController.getMessages(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getMessages 被調用
      expect(messageService.getMessages).toHaveBeenCalledTimes(1);
      expect(messageService.getMessages).toHaveBeenCalledWith({
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.INBOUND,
        isRead: false,
        limit: 10,
        offset: 0,
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockMessages);
    });

    it('應該處理日期範圍查詢', async () => {
      // 模擬請求參數
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      mockRequest = {
        query: {
          startDate,
          endDate,
        },
      };

      // 模擬消息數據
      const mockMessages = [
        {
          id: 'message-1',
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          direction: MessageDirection.INBOUND,
          messageType: MessageType.TEXT,
          content: '您好，我想了解智能家居系統',
          isRead: false,
          createdAt: new Date('2025-01-15'),
        },
      ];

      // 設置模擬函數的返回值
      (messageService.getMessages as jest.Mock).mockResolvedValue(mockMessages);

      // 執行測試
      await messageController.getMessages(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getMessages 被調用
      expect(messageService.getMessages).toHaveBeenCalledTimes(1);
      expect(messageService.getMessages).toHaveBeenCalledWith({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockMessages);
    });

    it('應該處理獲取消息列表時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {},
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (messageService.getMessages as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await messageController.getMessages(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getMessages 被調用
      expect(messageService.getMessages).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '資料庫連接錯誤' });
    });

    it('應該處理未知錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {},
      };

      // 模擬錯誤
      (messageService.getMessages as jest.Mock).mockRejectedValue('未知錯誤');

      // 執行測試
      await messageController.getMessages(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getMessages 被調用
      expect(messageService.getMessages).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取消息列表時發生錯誤' });
    });
  });

  describe('getCustomerConversation', () => {
    it('應該獲取客戶對話', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          customerId: 'customer-123',
        },
        query: {
          limit: '20',
          offset: '10',
        },
      };

      // 模擬消息數據
      const mockMessages = [
        {
          id: 'message-1',
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          direction: MessageDirection.INBOUND,
          messageType: MessageType.TEXT,
          content: '您好，我想了解智能家居系統',
          isRead: true,
          createdAt: new Date(),
        },
        {
          id: 'message-2',
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          direction: MessageDirection.OUTBOUND,
          messageType: MessageType.TEXT,
          content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      // 設置模擬函數的返回值
      (messageService.getCustomerConversation as jest.Mock).mockResolvedValue(mockMessages);

      // 執行測試
      await messageController.getCustomerConversation(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerConversation 被調用
      expect(messageService.getCustomerConversation).toHaveBeenCalledTimes(1);
      expect(messageService.getCustomerConversation).toHaveBeenCalledWith('customer-123', 20, 10);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockMessages);
    });

    it('應該處理缺少客戶 ID 的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {},
        query: {},
      };

      // 執行測試
      await messageController.getCustomerConversation(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerConversation 沒有被調用
      expect(messageService.getCustomerConversation).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '客戶 ID 為必填項' });
    });

    it('應該處理獲取客戶對話時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          customerId: 'customer-123',
        },
        query: {},
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (messageService.getCustomerConversation as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await messageController.getCustomerConversation(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerConversation 被調用
      expect(messageService.getCustomerConversation).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '資料庫連接錯誤' });
    });
  });

  describe('sendMessage', () => {
    it('應該發送消息', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          messageType: MessageType.TEXT,
          content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
          metadata: {
            source: 'admin',
          },
        },
      };

      // 模擬平台 ID
      const mockPlatformId = 'line-user-id';

      // 模擬創建的消息
      const mockMessage = {
        id: 'message-1',
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        metadata: {
          source: 'admin',
          response: { messageId: 'line-message-id' },
        },
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (messageService.getCustomerPlatformId as jest.Mock).mockResolvedValue(mockPlatformId);
      (messageService.sendMessage as jest.Mock).mockResolvedValue(mockMessage);

      // 執行測試
      await messageController.sendMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 被調用
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledTimes(1);
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledWith('customer-123', PlatformType.LINE);

      // 驗證 messageService.sendMessage 被調用
      expect(messageService.sendMessage).toHaveBeenCalledTimes(1);
      expect(messageService.sendMessage).toHaveBeenCalledWith({
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        platformId: mockPlatformId,
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        metadata: {
          source: 'admin',
        },
      });

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockMessage);
    });

    it('應該處理缺少必填參數的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          // 缺少 platformType, messageType, content
        },
      };

      // 執行測試
      await messageController.sendMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 沒有被調用
      expect(messageService.getCustomerPlatformId).not.toHaveBeenCalled();

      // 驗證 messageService.sendMessage 沒有被調用
      expect(messageService.sendMessage).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '客戶 ID、平台類型、消息類型和內容為必填項' });
    });

    it('應該處理找不到客戶平台 ID 的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          messageType: MessageType.TEXT,
          content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        },
      };

      // 設置模擬函數的返回值
      (messageService.getCustomerPlatformId as jest.Mock).mockResolvedValue(null);

      // 執行測試
      await messageController.sendMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 被調用
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledTimes(1);

      // 驗證 messageService.sendMessage 沒有被調用
      expect(messageService.sendMessage).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到客戶的平台 ID' });
    });

    it('應該處理發送消息時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        body: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          messageType: MessageType.TEXT,
          content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        },
      };

      // 模擬平台 ID
      const mockPlatformId = 'line-user-id';

      // 模擬錯誤
      const mockError = new Error('發送消息失敗');
      (messageService.getCustomerPlatformId as jest.Mock).mockResolvedValue(mockPlatformId);
      (messageService.sendMessage as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await messageController.sendMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getCustomerPlatformId 被調用
      expect(messageService.getCustomerPlatformId).toHaveBeenCalledTimes(1);

      // 驗證 messageService.sendMessage 被調用
      expect(messageService.sendMessage).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '發送消息失敗' });
    });
  });

  describe('markAsRead', () => {
    it('應該標記消息為已讀', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          messageId: 'message-1',
        },
      };

      // 設置模擬函數的返回值
      (messageService.markAsRead as jest.Mock).mockResolvedValue(true);

      // 執行測試
      await messageController.markAsRead(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.markAsRead 被調用
      expect(messageService.markAsRead).toHaveBeenCalledTimes(1);
      expect(messageService.markAsRead).toHaveBeenCalledWith('message-1');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: '消息已標記為已讀' });
    });

    it('應該處理找不到消息或消息已標記為已讀的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          messageId: 'message-1',
        },
      };

      // 設置模擬函數的返回值
      (messageService.markAsRead as jest.Mock).mockResolvedValue(false);

      // 執行測試
      await messageController.markAsRead(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.markAsRead 被調用
      expect(messageService.markAsRead).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到消息或消息已標記為已讀' });
    });

    it('應該處理缺少消息 ID 的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {},
      };

      // 執行測試
      await messageController.markAsRead(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.markAsRead 沒有被調用
      expect(messageService.markAsRead).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '消息 ID 為必填項' });
    });

    it('應該處理標記消息為已讀時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          messageId: 'message-1',
        },
      };

      // 模擬錯誤
      const mockError = new Error('標記消息為已讀失敗');
      (messageService.markAsRead as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await messageController.markAsRead(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.markAsRead 被調用
      expect(messageService.markAsRead).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '標記消息為已讀失敗' });
    });
  });

  describe('markAllAsRead', () => {
    it('應該標記客戶所有消息為已讀', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          customerId: 'customer-123',
        },
      };

      // 設置模擬函數的返回值
      (messageService.markAllAsRead as jest.Mock).mockResolvedValue(5);

      // 執行測試
      await messageController.markAllAsRead(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.markAllAsRead 被調用
      expect(messageService.markAllAsRead).toHaveBeenCalledTimes(1);
      expect(messageService.markAllAsRead).toHaveBeenCalledWith('customer-123');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: '已標記 5 條消息為已讀' });
    });

    it('應該處理缺少客戶 ID 的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {},
      };

      // 執行測試
      await messageController.markAllAsRead(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.markAllAsRead 沒有被調用
      expect(messageService.markAllAsRead).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '客戶 ID 為必填項' });
    });

    it('應該處理標記客戶所有消息為已讀時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          customerId: 'customer-123',
        },
      };

      // 模擬錯誤
      const mockError = new Error('標記客戶所有消息為已讀失敗');
      (messageService.markAllAsRead as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await messageController.markAllAsRead(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.markAllAsRead 被調用
      expect(messageService.markAllAsRead).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '標記客戶所有消息為已讀失敗' });
    });
  });

  describe('getUnreadCount', () => {
    it('應該獲取所有未讀消息數量', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {},
      };

      // 設置模擬函數的返回值
      (messageService.getUnreadCount as jest.Mock).mockResolvedValue(10);

      // 執行測試
      await messageController.getUnreadCount(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getUnreadCount 被調用
      expect(messageService.getUnreadCount).toHaveBeenCalledTimes(1);
      expect(messageService.getUnreadCount).toHaveBeenCalledWith(undefined);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ count: 10 });
    });

    it('應該獲取特定客戶的未讀消息數量', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {
          customerId: 'customer-123',
        },
      };

      // 設置模擬函數的返回值
      (messageService.getUnreadCount as jest.Mock).mockResolvedValue(5);

      // 執行測試
      await messageController.getUnreadCount(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getUnreadCount 被調用
      expect(messageService.getUnreadCount).toHaveBeenCalledTimes(1);
      expect(messageService.getUnreadCount).toHaveBeenCalledWith('customer-123');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ count: 5 });
    });

    it('應該處理獲取未讀消息數量時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        query: {},
      };

      // 模擬錯誤
      const mockError = new Error('獲取未讀消息數量失敗');
      (messageService.getUnreadCount as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await messageController.getUnreadCount(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.getUnreadCount 被調用
      expect(messageService.getUnreadCount).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '獲取未讀消息數量失敗' });
    });
  });

  describe('deleteMessage', () => {
    it('應該刪除消息', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          messageId: 'message-1',
        },
      };

      // 設置模擬函數的返回值
      (messageService.deleteMessage as jest.Mock).mockResolvedValue(true);

      // 執行測試
      await messageController.deleteMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.deleteMessage 被調用
      expect(messageService.deleteMessage).toHaveBeenCalledTimes(1);
      expect(messageService.deleteMessage).toHaveBeenCalledWith('message-1');

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: '消息已刪除' });
    });

    it('應該處理找不到消息的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          messageId: 'non-existent-message',
        },
      };

      // 設置模擬函數的返回值
      (messageService.deleteMessage as jest.Mock).mockResolvedValue(false);

      // 執行測試
      await messageController.deleteMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.deleteMessage 被調用
      expect(messageService.deleteMessage).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: '找不到消息' });
    });

    it('應該處理缺少消息 ID 的情況', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {},
      };

      // 執行測試
      await messageController.deleteMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.deleteMessage 沒有被調用
      expect(messageService.deleteMessage).not.toHaveBeenCalled();

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '消息 ID 為必填項' });
    });

    it('應該處理刪除消息時的錯誤', async () => {
      // 模擬請求參數
      mockRequest = {
        params: {
          messageId: 'message-1',
        },
      };

      // 模擬錯誤
      const mockError = new Error('刪除消息失敗');
      (messageService.deleteMessage as jest.Mock).mockRejectedValue(mockError);

      // 執行測試
      await messageController.deleteMessage(mockRequest as Request, mockResponse as Response);

      // 驗證 messageService.deleteMessage 被調用
      expect(messageService.deleteMessage).toHaveBeenCalledTimes(1);

      // 驗證響應
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: '刪除消息失敗' });
    });
  });
});