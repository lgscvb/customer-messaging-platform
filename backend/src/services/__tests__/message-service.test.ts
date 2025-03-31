import MessageService, { MessageFilterOptions, MessageCreateOptions, MessageSendOptions } from '../message-service';
import { Message } from '../../models/Message';
import { Customer } from '../../models/Customer';
import { CustomerPlatform } from '../../models/CustomerPlatform';
import { PlatformType, MessageDirection, MessageType } from '../../types/platform';
import ConnectorFactory from '../../connectors';
import LineConnector from '../../connectors/line';
import FacebookConnector from '../../connectors/facebook';
import WebsiteConnector from '../../connectors/website';

// 模擬依賴
jest.mock('../../models/Message');
jest.mock('../../models/Customer');
jest.mock('../../models/CustomerPlatform');
jest.mock('../../connectors');
jest.mock('../../connectors/line');
jest.mock('../../connectors/facebook');
jest.mock('../../connectors/website');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('MessageService', () => {
  // 在每個測試前重置所有模擬
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('應該獲取消息列表', async () => {
      // 模擬過濾選項
      const options: MessageFilterOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.INBOUND,
        isRead: false,
        limit: 10,
        offset: 0,
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
          customer: {
            id: 'customer-123',
            name: '張先生',
            email: 'zhang@example.com',
          },
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
          customer: {
            id: 'customer-123',
            name: '張先生',
            email: 'zhang@example.com',
          },
        },
      ];

      // 設置模擬函數的返回值
      (Message.findAll as jest.Mock).mockResolvedValue(mockMessages);

      // 執行測試
      const result = await MessageService.getMessages(options);

      // 驗證結果
      expect(result).toEqual(mockMessages);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 'message-1');
      expect(result[1]).toHaveProperty('id', 'message-2');

      // 驗證 Message.findAll 被調用
      expect(Message.findAll).toHaveBeenCalledTimes(1);
      expect(Message.findAll).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
          platformType: PlatformType.LINE,
          direction: MessageDirection.INBOUND,
          isRead: false,
        },
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });
    });

    it('應該處理日期範圍查詢', async () => {
      // 模擬過濾選項
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const options: MessageFilterOptions = {
        startDate,
        endDate,
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
      (Message.findAll as jest.Mock).mockResolvedValue(mockMessages);

      // 執行測試
      const result = await MessageService.getMessages(options);

      // 驗證結果
      expect(result).toEqual(mockMessages);

      // 驗證 Message.findAll 被調用
      expect(Message.findAll).toHaveBeenCalledTimes(1);
      expect(Message.findAll).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        limit: 50,
        offset: 0,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });
    });

    it('應該處理獲取消息列表時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (Message.findAll as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.getMessages()).rejects.toThrow('資料庫連接錯誤');

      // 驗證 Message.findAll 被調用
      expect(Message.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCustomerConversation', () => {
    it('應該獲取客戶對話', async () => {
      // 模擬參數
      const customerId = 'customer-123';
      const limit = 20;
      const offset = 10;

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
      (Message.findAll as jest.Mock).mockResolvedValue(mockMessages);

      // 執行測試
      const result = await MessageService.getCustomerConversation(customerId, limit, offset);

      // 驗證結果
      expect(result).toEqual(mockMessages);
      expect(result).toHaveLength(2);

      // 驗證 Message.findAll 被調用
      expect(Message.findAll).toHaveBeenCalledTimes(1);
      expect(Message.findAll).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
        },
        limit: 20,
        offset: 10,
        order: [['createdAt', 'DESC']],
      });
    });

    it('應該處理獲取客戶對話時的錯誤', async () => {
      // 模擬參數
      const customerId = 'customer-123';

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (Message.findAll as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.getCustomerConversation(customerId)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 Message.findAll 被調用
      expect(Message.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('createMessage', () => {
    it('應該創建消息', async () => {
      // 模擬創建選項
      const options: MessageCreateOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.INBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我想了解智能家居系統',
        metadata: {
          source: 'LINE App',
        },
      };

      // 模擬創建的消息
      const mockMessage = {
        id: 'message-1',
        ...options,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);

      // 執行測試
      const result = await MessageService.createMessage(options);

      // 驗證結果
      expect(result).toEqual(mockMessage);
      expect(result).toHaveProperty('id', 'message-1');
      expect(result).toHaveProperty('customerId', 'customer-123');
      expect(result).toHaveProperty('platformType', PlatformType.LINE);
      expect(result).toHaveProperty('direction', MessageDirection.INBOUND);
      expect(result).toHaveProperty('messageType', MessageType.TEXT);
      expect(result).toHaveProperty('content', '您好，我想了解智能家居系統');
      expect(result).toHaveProperty('metadata', { source: 'LINE App' });
      expect(result).toHaveProperty('isRead', false);
      expect(result).toHaveProperty('readAt', null);

      // 驗證 Message.create 被調用
      expect(Message.create).toHaveBeenCalledTimes(1);
      expect(Message.create).toHaveBeenCalledWith({
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.INBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我想了解智能家居系統',
        metadata: {
          source: 'LINE App',
        },
        isRead: false,
        readAt: null,
      });
    });

    it('應該為發出的消息設置已讀狀態', async () => {
      // 模擬創建選項
      const options: MessageCreateOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
      };

      // 模擬創建的消息
      const mockMessage = {
        id: 'message-1',
        ...options,
        isRead: true,
        readAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);

      // 執行測試
      const result = await MessageService.createMessage(options);

      // 驗證結果
      expect(result).toEqual(mockMessage);
      expect(result).toHaveProperty('isRead', true);
      expect(result).toHaveProperty('readAt');

      // 驗證 Message.create 被調用
      expect(Message.create).toHaveBeenCalledTimes(1);
      expect(Message.create).toHaveBeenCalledWith({
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        metadata: {},
        isRead: true,
        readAt: expect.any(Date),
      });
    });

    it('應該處理創建消息時的錯誤', async () => {
      // 模擬創建選項
      const options: MessageCreateOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.INBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我想了解智能家居系統',
      };

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (Message.create as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.createMessage(options)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 Message.create 被調用
      expect(Message.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendMessage', () => {
    it('應該發送 LINE 消息', async () => {
      // 模擬發送選項
      const options: MessageSendOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        platformId: 'line-user-id',
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
      };

      // 模擬連接器工廠和 LINE 連接器
      const mockConnectorFactory = {
        getConnector: jest.fn(),
      };
      const mockLineConnector = {
        sendMessage: jest.fn(),
      };
      (ConnectorFactory.getInstance as jest.Mock).mockReturnValue(mockConnectorFactory);
      mockConnectorFactory.getConnector.mockReturnValue(mockLineConnector);
      mockLineConnector.sendMessage.mockResolvedValue({ messageId: 'line-message-id' });

      // 模擬創建的消息
      const mockMessage = {
        id: 'message-1',
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        metadata: {
          response: { messageId: 'line-message-id' },
        },
        isRead: true,
        readAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);

      // 執行測試
      const result = await MessageService.sendMessage(options);

      // 驗證結果
      expect(result).toEqual(mockMessage);

      // 驗證連接器工廠和 LINE 連接器被調用
      expect(ConnectorFactory.getInstance).toHaveBeenCalledTimes(1);
      expect(mockConnectorFactory.getConnector).toHaveBeenCalledTimes(1);
      expect(mockConnectorFactory.getConnector).toHaveBeenCalledWith(PlatformType.LINE);
      expect(mockLineConnector.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockLineConnector.sendMessage).toHaveBeenCalledWith(
        'line-user-id',
        '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？'
      );

      // 驗證 Message.create 被調用
      expect(Message.create).toHaveBeenCalledTimes(1);
      expect(Message.create).toHaveBeenCalledWith({
        customerId: 'customer-123',
        platformType: PlatformType.LINE,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        metadata: {
          response: { messageId: 'line-message-id' },
        },
        isRead: true,
        readAt: expect.any(Date),
      });
    });

    it('應該發送 Facebook 文本消息', async () => {
      // 模擬發送選項
      const options: MessageSendOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.FACEBOOK,
        platformId: 'fb-user-id',
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
      };

      // 模擬連接器工廠和 Facebook 連接器
      const mockConnectorFactory = {
        getConnector: jest.fn(),
      };
      const mockFacebookConnector = {
        sendTextMessage: jest.fn(),
        sendTemplateMessage: jest.fn(),
      };
      (ConnectorFactory.getInstance as jest.Mock).mockReturnValue(mockConnectorFactory);
      mockConnectorFactory.getConnector.mockReturnValue(mockFacebookConnector);
      mockFacebookConnector.sendTextMessage.mockResolvedValue({ messageId: 'fb-message-id' });

      // 模擬創建的消息
      const mockMessage = {
        id: 'message-1',
        customerId: 'customer-123',
        platformType: PlatformType.FACEBOOK,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEXT,
        content: '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？',
        metadata: {
          response: { messageId: 'fb-message-id' },
        },
        isRead: true,
        readAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);

      // 執行測試
      const result = await MessageService.sendMessage(options);

      // 驗證結果
      expect(result).toEqual(mockMessage);

      // 驗證連接器工廠和 Facebook 連接器被調用
      expect(ConnectorFactory.getInstance).toHaveBeenCalledTimes(1);
      expect(mockConnectorFactory.getConnector).toHaveBeenCalledTimes(1);
      expect(mockConnectorFactory.getConnector).toHaveBeenCalledWith(PlatformType.FACEBOOK);
      expect(mockFacebookConnector.sendTextMessage).toHaveBeenCalledTimes(1);
      expect(mockFacebookConnector.sendTextMessage).toHaveBeenCalledWith(
        'fb-user-id',
        '您好，我們提供多種智能家居系統方案，請問您對哪種方案感興趣？'
      );
      expect(mockFacebookConnector.sendTemplateMessage).not.toHaveBeenCalled();

      // 驗證 Message.create 被調用
      expect(Message.create).toHaveBeenCalledTimes(1);
    });

    it('應該發送 Facebook 模板消息', async () => {
      // 模擬發送選項
      const templateContent = JSON.stringify({
        template_type: 'generic',
        elements: [
          {
            title: '智能家居系統基礎版',
            subtitle: '適合小型公寓，包含智能照明、溫度控制和基本安全功能',
            image_url: 'https://example.com/images/basic.jpg',
            buttons: [
              {
                type: 'postback',
                title: '了解更多',
                payload: 'LEARN_MORE_BASIC',
              },
            ],
          },
        ],
      });

      const options: MessageSendOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.FACEBOOK,
        platformId: 'fb-user-id',
        messageType: MessageType.TEMPLATE,
        content: templateContent,
      };

      // 模擬連接器工廠和 Facebook 連接器
      const mockConnectorFactory = {
        getConnector: jest.fn(),
      };
      const mockFacebookConnector = {
        sendTextMessage: jest.fn(),
        sendTemplateMessage: jest.fn(),
      };
      (ConnectorFactory.getInstance as jest.Mock).mockReturnValue(mockConnectorFactory);
      mockConnectorFactory.getConnector.mockReturnValue(mockFacebookConnector);
      mockFacebookConnector.sendTemplateMessage.mockResolvedValue({ messageId: 'fb-template-id' });

      // 模擬創建的消息
      const mockMessage = {
        id: 'message-1',
        customerId: 'customer-123',
        platformType: PlatformType.FACEBOOK,
        direction: MessageDirection.OUTBOUND,
        messageType: MessageType.TEMPLATE,
        content: templateContent,
        metadata: {
          response: { messageId: 'fb-template-id' },
        },
        isRead: true,
        readAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 設置模擬函數的返回值
      (Message.create as jest.Mock).mockResolvedValue(mockMessage);

      // 執行測試
      const result = await MessageService.sendMessage(options);

      // 驗證結果
      expect(result).toEqual(mockMessage);

      // 驗證連接器工廠和 Facebook 連接器被調用
      expect(ConnectorFactory.getInstance).toHaveBeenCalledTimes(1);
      expect(mockConnectorFactory.getConnector).toHaveBeenCalledTimes(1);
      expect(mockConnectorFactory.getConnector).toHaveBeenCalledWith(PlatformType.FACEBOOK);
      expect(mockFacebookConnector.sendTextMessage).not.toHaveBeenCalled();
      expect(mockFacebookConnector.sendTemplateMessage).toHaveBeenCalledTimes(1);
      expect(mockFacebookConnector.sendTemplateMessage).toHaveBeenCalledWith(
        'fb-user-id',
        JSON.parse(templateContent)
      );

      // 驗證 Message.create 被調用
      expect(Message.create).toHaveBeenCalledTimes(1);
    });

    it('應該處理不支持的平台類型', async () => {
      // 模擬發送選項
      const options: MessageSendOptions = {
        customerId: 'customer-123',
        platformType: 'UNSUPPORTED' as PlatformType,
        platformId: 'user-id',
        messageType: MessageType.TEXT,
        content: '您好',
      };

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.sendMessage(options)).rejects.toThrow('不支持的平台類型: UNSUPPORTED');

      // 驗證 Message.create 沒有被調用
      expect(Message.create).not.toHaveBeenCalled();
    });

    it('應該處理不支持的消息類型', async () => {
      // 模擬發送選項
      const options: MessageSendOptions = {
        customerId: 'customer-123',
        platformType: PlatformType.FACEBOOK,
        platformId: 'fb-user-id',
        messageType: 'UNSUPPORTED' as MessageType,
        content: '您好',
      };

      // 模擬連接器工廠和 Facebook 連接器
      const mockConnectorFactory = {
        getConnector: jest.fn(),
      };
      const mockFacebookConnector = {
        sendTextMessage: jest.fn(),
        sendTemplateMessage: jest.fn(),
      };
      (ConnectorFactory.getInstance as jest.Mock).mockReturnValue(mockConnectorFactory);
      mockConnectorFactory.getConnector.mockReturnValue(mockFacebookConnector);

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.sendMessage(options)).rejects.toThrow('Facebook 連接器不支持的消息類型: UNSUPPORTED');

      // 驗證 Message.create 沒有被調用
      expect(Message.create).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('應該標記消息為已讀', async () => {
      // 模擬參數
      const messageId = 'message-1';

      // 模擬更新結果
      const mockUpdateResult = [1];

      // 設置模擬函數的返回值
      (Message.update as jest.Mock).mockResolvedValue(mockUpdateResult);

      // 執行測試
      const result = await MessageService.markAsRead(messageId);

      // 驗證結果
      expect(result).toBe(true);

      // 驗證 Message.update 被調用
      expect(Message.update).toHaveBeenCalledTimes(1);
      expect(Message.update).toHaveBeenCalledWith(
        {
          isRead: true,
          readAt: expect.any(Date),
        },
        {
          where: {
            id: messageId,
            isRead: false,
          },
        }
      );
    });

    it('應該處理消息已經被標記為已讀的情況', async () => {
      // 模擬參數
      const messageId = 'message-1';

      // 模擬更新結果（沒有更新任何行）
      const mockUpdateResult = [0];

      // 設置模擬函數的返回值
      (Message.update as jest.Mock).mockResolvedValue(mockUpdateResult);

      // 執行測試
      const result = await MessageService.markAsRead(messageId);

      // 驗證結果
      expect(result).toBe(false);

      // 驗證 Message.update 被調用
      expect(Message.update).toHaveBeenCalledTimes(1);
    });

    it('應該處理標記消息為已讀時的錯誤', async () => {
      // 模擬參數
      const messageId = 'message-1';

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (Message.update as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.markAsRead(messageId)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 Message.update 被調用
      expect(Message.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('markAllAsRead', () => {
    it('應該標記客戶所有消息為已讀', async () => {
      // 模擬參數
      const customerId = 'customer-123';

      // 模擬更新結果
      const mockUpdateResult = [5];

      // 設置模擬函數的返回值
      (Message.update as jest.Mock).mockResolvedValue(mockUpdateResult);

      // 執行測試
      const result = await MessageService.markAllAsRead(customerId);

      // 驗證結果
      expect(result).toBe(5);

      // 驗證 Message.update 被調用
      expect(Message.update).toHaveBeenCalledTimes(1);
      expect(Message.update).toHaveBeenCalledWith(
        {
          isRead: true,
          readAt: expect.any(Date),
        },
        {
          where: {
            customerId,
            direction: MessageDirection.INBOUND,
            isRead: false,
          },
        }
      );
    });

    it('應該處理標記客戶所有消息為已讀時的錯誤', async () => {
      // 模擬參數
      const customerId = 'customer-123';

      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (Message.update as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.markAllAsRead(customerId)).rejects.toThrow('資料庫連接錯誤');

      // 驗證 Message.update 被調用
      expect(Message.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUnreadCount', () => {
    it('應該獲取所有未讀消息數量', async () => {
      // 模擬計數結果
      const mockCount = 10;

      // 設置模擬函數的返回值
      (Message.count as jest.Mock).mockResolvedValue(mockCount);

      // 執行測試
      const result = await MessageService.getUnreadCount();

      // 驗證結果
      expect(result).toBe(10);

      // 驗證 Message.count 被調用
      expect(Message.count).toHaveBeenCalledTimes(1);
      expect(Message.count).toHaveBeenCalledWith({
        where: {
          direction: MessageDirection.INBOUND,
          isRead: false,
        },
      });
    
      describe('deleteMessage', () => {
        it('應該刪除消息', async () => {
          // 模擬參數
          const messageId = 'message-1';
    
          // 模擬刪除結果
          const mockDeleteResult = 1;
    
          // 設置模擬函數的返回值
          (Message.destroy as jest.Mock).mockResolvedValue(mockDeleteResult);
    
          // 執行測試
          const result = await MessageService.deleteMessage(messageId);
    
          // 驗證結果
          expect(result).toBe(true);
    
          // 驗證 Message.destroy 被調用
          expect(Message.destroy).toHaveBeenCalledTimes(1);
          expect(Message.destroy).toHaveBeenCalledWith({
            where: {
              id: messageId,
            },
          });
        });
    
        it('應該處理消息不存在的情況', async () => {
          // 模擬參數
          const messageId = 'non-existent-message';
    
          // 模擬刪除結果（沒有刪除任何行）
          const mockDeleteResult = 0;
    
          // 設置模擬函數的返回值
          (Message.destroy as jest.Mock).mockResolvedValue(mockDeleteResult);
    
          // 執行測試
          const result = await MessageService.deleteMessage(messageId);
    
          // 驗證結果
          expect(result).toBe(false);
    
          // 驗證 Message.destroy 被調用
          expect(Message.destroy).toHaveBeenCalledTimes(1);
        });
    
        it('應該處理刪除消息時的錯誤', async () => {
          // 模擬參數
          const messageId = 'message-1';
    
          // 模擬錯誤
          const mockError = new Error('資料庫連接錯誤');
          (Message.destroy as jest.Mock).mockRejectedValue(mockError);
    
          // 執行測試並驗證錯誤被拋出
          await expect(MessageService.deleteMessage(messageId)).rejects.toThrow('資料庫連接錯誤');
    
          // 驗證 Message.destroy 被調用
          expect(Message.destroy).toHaveBeenCalledTimes(1);
        });
      });
    
      describe('getCustomerPlatformId', () => {
        it('應該獲取客戶平台 ID', async () => {
          // 模擬參數
          const customerId = 'customer-123';
          const platformType = PlatformType.LINE;
    
          // 模擬客戶平台數據
          const mockCustomerPlatform = {
            id: 'platform-1',
            customerId: 'customer-123',
            platformType: PlatformType.LINE,
            platformId: 'line-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
    
          // 設置模擬函數的返回值
          (CustomerPlatform.findOne as jest.Mock).mockResolvedValue(mockCustomerPlatform);
    
          // 執行測試
          const result = await MessageService.getCustomerPlatformId(customerId, platformType);
    
          // 驗證結果
          expect(result).toBe('line-user-id');
    
          // 驗證 CustomerPlatform.findOne 被調用
          expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);
          expect(CustomerPlatform.findOne).toHaveBeenCalledWith({
            where: {
              customerId,
              platformType,
            },
          });
        });
    
        it('應該處理客戶平台不存在的情況', async () => {
          // 模擬參數
          const customerId = 'customer-123';
          const platformType = PlatformType.FACEBOOK;
    
          // 設置模擬函數的返回值
          (CustomerPlatform.findOne as jest.Mock).mockResolvedValue(null);
    
          // 執行測試
          const result = await MessageService.getCustomerPlatformId(customerId, platformType);
    
          // 驗證結果
          expect(result).toBeNull();
    
          // 驗證 CustomerPlatform.findOne 被調用
          expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);
        });
    
        it('應該處理獲取客戶平台 ID 時的錯誤', async () => {
          // 模擬參數
          const customerId = 'customer-123';
          const platformType = PlatformType.LINE;
    
          // 模擬錯誤
          const mockError = new Error('資料庫連接錯誤');
          (CustomerPlatform.findOne as jest.Mock).mockRejectedValue(mockError);
    
          // 執行測試並驗證錯誤被拋出
          await expect(MessageService.getCustomerPlatformId(customerId, platformType)).rejects.toThrow('資料庫連接錯誤');
    
          // 驗證 CustomerPlatform.findOne 被調用
          expect(CustomerPlatform.findOne).toHaveBeenCalledTimes(1);
        });
      });
    });

    it('應該獲取特定客戶的未讀消息數量', async () => {
      // 模擬參數
      const customerId = 'customer-123';

      // 模擬計數結果
      const mockCount = 5;

      // 設置模擬函數的返回值
      (Message.count as jest.Mock).mockResolvedValue(mockCount);

      // 執行測試
      const result = await MessageService.getUnreadCount(customerId);

      // 驗證結果
      expect(result).toBe(5);

      // 驗證 Message.count 被調用
      expect(Message.count).toHaveBeenCalledTimes(1);
      expect(Message.count).toHaveBeenCalledWith({
        where: {
          customerId,
          direction: MessageDirection.INBOUND,
          isRead: false,
        },
      });
    });

    it('應該處理獲取未讀消息數量時的錯誤', async () => {
      // 模擬錯誤
      const mockError = new Error('資料庫連接錯誤');
      (Message.count as jest.Mock).mockRejectedValue(mockError);

      // 執行測試並驗證錯誤被拋出
      await expect(MessageService.getUnreadCount()).rejects.toThrow('資料庫連接錯誤');

      // 驗證 Message.count 被調用
      expect(Message.count).toHaveBeenCalledTimes(1);
    });
  });
