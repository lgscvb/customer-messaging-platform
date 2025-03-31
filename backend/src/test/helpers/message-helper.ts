import { Message } from '../../models/Message';
import { MessageDirection, MessageType, PlatformType } from '../../types/platform';

/**
 * 創建測試消息
 * @param customerId 客戶 ID
 * @param platformId 平台 ID (可選)
 * @returns 創建的測試消息
 */
export async function createTestMessage(customerId: string, platformId?: string): Promise<Message> {
  const testMessage = {
    customerId,
    platformId: platformId || null,
    platformType: PlatformType.WEBSITE,
    messageType: MessageType.TEXT,
    direction: MessageDirection.INBOUND,
    content: `Test message content ${Date.now()}`,
    metadata: {
      source: 'test',
      testData: true
    }
  };

  return await Message.create(testMessage);
}

/**
 * 創建多個測試消息
 * @param customerId 客戶 ID
 * @param count 消息數量
 * @param platformId 平台 ID (可選)
 * @returns 創建的測試消息數組
 */
export async function createTestMessages(customerId: string, count: number, platformId?: string): Promise<Message[]> {
  const messages: Message[] = [];
  
  for (let i = 0; i < count; i++) {
    const message = await createTestMessage(customerId, platformId);
    messages.push(message);
  }
  
  return messages;
}

/**
 * 創建測試對話
 * @param customerId 客戶 ID
 * @param messageCount 消息數量
 * @param platformId 平台 ID (可選)
 * @returns 創建的測試消息數組
 */
export async function createTestConversation(customerId: string, messageCount: number = 5, platformId?: string): Promise<Message[]> {
  const messages: Message[] = [];
  
  for (let i = 0; i < messageCount; i++) {
    const direction = i % 2 === 0 ? MessageDirection.INBOUND : MessageDirection.OUTBOUND;
    
    const testMessage = {
      customerId,
      platformId: platformId || null,
      platformType: PlatformType.WEBSITE,
      messageType: MessageType.TEXT,
      direction,
      content: `Test ${direction} message ${i + 1}`,
      metadata: {
        source: 'test',
        testData: true,
        conversationIndex: i
      }
    };
    
    const message = await Message.create(testMessage);
    messages.push(message);
  }
  
  return messages;
}