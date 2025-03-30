/**
 * 平台類型枚舉
 */
export enum PlatformType {
  LINE = 'line',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  WEBSITE = 'website',
  OTHER = 'other'
}

/**
 * 消息狀態枚舉
 */
export enum MessageStatus {
  NEW = 'new',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

/**
 * 消息類型枚舉
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  STICKER = 'sticker',
  SYSTEM = 'system'
}

/**
 * 客戶接口
 */
export interface Customer {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  platformIds: Record<PlatformType, string>;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 消息接口
 */
export interface Message {
  id: string;
  customerId: string;
  customer: Customer;
  platform: PlatformType;
  platformMessageId: string;
  type: MessageType;
  content: string;
  attachments: Attachment[];
  status: MessageStatus;
  isRead: boolean;
  isAiReplied: boolean;
  aiReplyId?: string;
  agentId?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 附件接口
 */
export interface Attachment {
  id: string;
  type: MessageType;
  url: string;
  name: string;
  size: number;
  metadata: Record<string, any>;
}

/**
 * 回覆接口
 */
export interface Reply {
  id: string;
  messageId: string;
  platform: PlatformType;
  platformReplyId: string;
  type: MessageType;
  content: string;
  attachments: Attachment[];
  isAiGenerated: boolean;
  agentId: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * AI 回覆建議接口
 */
export interface AiReplySuggestion {
  id: string;
  messageId: string;
  content: string;
  confidence: number;
  sources: AiReplySource[];
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * AI 回覆來源接口
 */
export interface AiReplySource {
  id: string;
  type: 'knowledge' | 'conversation' | 'external';
  title: string;
  content: string;
  url?: string;
  relevance: number;
}

/**
 * 對話接口
 */
export interface Conversation {
  id: string;
  customerId: string;
  customer: Customer;
  platform: PlatformType;
  messages: Message[];
  replies: Reply[];
  status: MessageStatus;
  lastMessageAt: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 消息過濾器接口
 */
export interface MessageFilter {
  platform?: PlatformType;
  status?: MessageStatus;
  type?: MessageType;
  isRead?: boolean;
  isAiReplied?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  tags?: string[];
}