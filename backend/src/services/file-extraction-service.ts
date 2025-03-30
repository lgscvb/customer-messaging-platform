import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as crypto from 'crypto';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { VertexAI } from '@google-cloud/vertexai';
import logger from '../utils/logger';
import knowledgeService from './knowledge-service';

// 將 fs 的 promises API 轉換為 async/await 風格
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

/**
 * 支持的檔案類型
 */
export enum FileType {
  TEXT = 'text',
  PDF = 'pdf',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  JSON = 'json',
  CSV = 'csv',
  UNKNOWN = 'unknown',
}

/**
 * 檔案信息接口
 */
export interface FileInfo {
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  type: FileType;
  extension: string;
}

/**
 * 檔案提取結果接口
 */
export interface FileExtractionResult {
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl?: string;
  confidence: number;
  metadata: {
    fileInfo: FileInfo;
    extractionTime: string;
    [key: string]: any;
  };
}

// 定義 Vertex AI 響應的類型
interface VertexAIResponsePart {
  text?: string;
  [key: string]: any;
}

interface VertexAIResponseContent {
  parts: VertexAIResponsePart[];
  [key: string]: any;
}

interface VertexAIResponseCandidate {
  content: VertexAIResponseContent;
  [key: string]: any;
}

interface VertexAIResponse {
  candidates?: VertexAIResponseCandidate[];
  [key: string]: any;
}

/**
 * 檔案提取服務
 * 負責從各種類型的檔案中提取內容，並將其添加到知識庫中
 */
class FileExtractionService {
  private llm: OpenAI;
  private vertexAI: VertexAI;
  private projectId: string;
  private location: string;
  private modelName: string;
  private uploadDir: string;
  
  constructor() {
    // 初始化 OpenAI 模型
    this.llm = new OpenAI({
      modelName: 'gpt-4', // 或使用其他模型
      temperature: 0.2, // 使用較低的溫度以獲得更確定性的結果
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    // 初始化 Google Vertex AI
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.modelName = process.env.VERTEX_AI_MODEL_NAME || 'gemini-1.5-pro-preview-0409';
    
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location,
    });
    
    // 設置上傳目錄
    this.uploadDir = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'knowledge-uploads');
    
    // 確保上傳目錄存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }
  
  /**
   * 保存上傳的檔案
   * @param file 檔案數據
   * @param originalName 原始檔案名
   * @param mimeType MIME 類型
   */
  async saveUploadedFile(file: Buffer, originalName: string, mimeType: string): Promise<FileInfo> {
    try {
      // 生成唯一的檔案名
      const extension = path.extname(originalName);
      const fileName = `${crypto.randomBytes(16).toString('hex')}${extension}`;
      const filePath = path.join(this.uploadDir, fileName);
      
      // 確保上傳目錄存在
      await mkdir(this.uploadDir, { recursive: true });
      
      // 寫入檔案
      await writeFile(filePath, file);
      
      // 確定檔案類型
      const fileType = this.determineFileType(mimeType, extension);
      
      // 返回檔案信息
      return {
        originalName,
        mimeType,
        size: file.length,
        path: filePath,
        type: fileType,
        extension: extension.toLowerCase(),
      };
    } catch (error) {
      logger.error('保存上傳檔案錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 根據 MIME 類型和擴展名確定檔案類型
   * @param mimeType MIME 類型
   * @param extension 檔案擴展名
   */
  private determineFileType(mimeType: string, extension: string): FileType {
    const ext = extension.toLowerCase();
    
    if (mimeType.startsWith('text/') || ext === '.txt' || ext === '.md') {
      return FileType.TEXT;
    } else if (mimeType === 'application/pdf' || ext === '.pdf') {
      return FileType.PDF;
    } else if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
      return FileType.IMAGE;
    } else if (mimeType.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
      return FileType.AUDIO;
    } else if (mimeType.startsWith('video/') || ['.mp4', '.webm', '.avi', '.mov'].includes(ext)) {
      return FileType.VIDEO;
    } else if (mimeType === 'application/json' || ext === '.json') {
      return FileType.JSON;
    } else if (mimeType === 'text/csv' || ext === '.csv') {
      return FileType.CSV;
    } else {
      return FileType.UNKNOWN;
    }
  }
  
  /**
   * 從檔案中提取內容
   * @param fileInfo 檔案信息
   */
  async extractContentFromFile(fileInfo: FileInfo): Promise<FileExtractionResult> {
    try {
      logger.info(`開始從檔案 ${fileInfo.originalName} 中提取內容`);
      
      let content = '';
      let title = fileInfo.originalName;
      
      // 根據檔案類型提取內容
      switch (fileInfo.type) {
        case FileType.TEXT:
          content = await this.extractFromTextFile(fileInfo);
          break;
        case FileType.PDF:
          content = await this.extractFromPdfFile(fileInfo);
          break;
        case FileType.IMAGE:
          content = await this.extractFromImageFile(fileInfo);
          break;
        case FileType.AUDIO:
          content = await this.extractFromAudioFile(fileInfo);
          break;
        case FileType.VIDEO:
          content = await this.extractFromVideoFile(fileInfo);
          break;
        case FileType.JSON:
          content = await this.extractFromJsonFile(fileInfo);
          break;
        case FileType.CSV:
          content = await this.extractFromCsvFile(fileInfo);
          break;
        default:
          throw new Error(`不支持的檔案類型: ${fileInfo.type}`);
      }
      
      // 使用 LLM 分析內容，生成標題、分類和標籤
      const analysis = await this.analyzeContent(content, fileInfo);
      
      // 構建提取結果
      const result: FileExtractionResult = {
        title: analysis.title || title,
        content,
        category: analysis.category,
        tags: analysis.tags,
        source: `檔案: ${fileInfo.originalName}`,
        confidence: analysis.confidence,
        metadata: {
          fileInfo,
          extractionTime: new Date().toISOString(),
        },
      };
      
      logger.info(`成功從檔案 ${fileInfo.originalName} 中提取內容`);
      
      return result;
    } catch (error) {
      logger.error(`從檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 從文本檔案中提取內容
   * @param fileInfo 檔案信息
   */
  private async extractFromTextFile(fileInfo: FileInfo): Promise<string> {
    try {
      // 讀取檔案內容
      const buffer = await readFile(fileInfo.path);
      return buffer.toString('utf-8');
    } catch (error) {
      logger.error(`從文本檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 從 PDF 檔案中提取內容
   * @param fileInfo 檔案信息
   */
  private async extractFromPdfFile(fileInfo: FileInfo): Promise<string> {
    try {
      // 使用 Google Vertex AI 提取 PDF 內容
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          topK: 40,
        },
      });
      
      // 讀取檔案
      const fileData = await readFile(fileInfo.path);
      
      // 創建多模態請求
      const request = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: '請從這個PDF文件中提取所有文本內容，保持原始格式。' },
              {
                fileData: {
                  mimeType: 'application/pdf',
                  fileUri: `gs://${this.projectId}-temp/${path.basename(fileInfo.path)}`,
                  fileContent: fileData.toString('base64'),
                },
              },
            ],
          },
        ],
      };
      
      // 發送請求
      const result = await generativeModel.generateContent(request);
      const response = result.response as VertexAIResponse;
      
      // 提取文本
      let text = '';
      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        text = parts
          .filter((part: VertexAIResponsePart) => part.text !== undefined)
          .map((part: VertexAIResponsePart) => part.text)
          .filter((text): text is string => text !== undefined)
          .join('\n');
      }
      
      return text;
    } catch (error) {
      logger.error(`從 PDF 檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 從圖片檔案中提取內容
   * @param fileInfo 檔案信息
   */
  private async extractFromImageFile(fileInfo: FileInfo): Promise<string> {
    try {
      // 使用 Google Vertex AI 提取圖片內容
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          topK: 40,
        },
      });
      
      // 讀取檔案
      const fileData = await readFile(fileInfo.path);
      
      // 創建多模態請求
      const request = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: '請詳細描述這張圖片中的內容，包括可見的所有重要元素、文字、場景和主題。' },
              {
                fileData: {
                  mimeType: fileInfo.mimeType,
                  fileUri: `gs://${this.projectId}-temp/${path.basename(fileInfo.path)}`,
                  fileContent: fileData.toString('base64'),
                },
              },
            ],
          },
        ],
      };
      
      // 發送請求
      const result = await generativeModel.generateContent(request);
      const response = result.response as VertexAIResponse;
      
      // 提取文本
      let text = '';
      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        text = parts
          .filter((part: VertexAIResponsePart) => part.text !== undefined)
          .map((part: VertexAIResponsePart) => part.text)
          .filter((text): text is string => text !== undefined)
          .join('\n');
      }
      
      return text;
    } catch (error) {
      logger.error(`從圖片檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 從音頻檔案中提取內容
   * @param fileInfo 檔案信息
   */
  private async extractFromAudioFile(fileInfo: FileInfo): Promise<string> {
    try {
      // 使用 Google Vertex AI 提取音頻內容
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          topK: 40,
        },
      });
      
      // 讀取檔案
      const fileData = await readFile(fileInfo.path);
      
      // 創建多模態請求
      const request = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: '請轉錄這個音頻檔案中的所有內容，並提供完整的文字記錄。' },
              {
                fileData: {
                  mimeType: fileInfo.mimeType,
                  fileUri: `gs://${this.projectId}-temp/${path.basename(fileInfo.path)}`,
                  fileContent: fileData.toString('base64'),
                },
              },
            ],
          },
        ],
      };
      
      // 發送請求
      const result = await generativeModel.generateContent(request);
      const response = result.response as VertexAIResponse;
      
      // 提取文本
      let text = '';
      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        text = parts
          .filter((part: VertexAIResponsePart) => part.text !== undefined)
          .map((part: VertexAIResponsePart) => part.text)
          .filter((text): text is string => text !== undefined)
          .join('\n');
      }
      
      return text;
    } catch (error) {
      logger.error(`從音頻檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 從視頻檔案中提取內容
   * @param fileInfo 檔案信息
   */
  private async extractFromVideoFile(fileInfo: FileInfo): Promise<string> {
    try {
      // 使用 Google Vertex AI 提取視頻內容
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          topK: 40,
        },
      });
      
      // 讀取檔案
      const fileData = await readFile(fileInfo.path);
      
      // 創建多模態請求
      const request = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: '請分析這個視頻檔案，提供詳細的內容描述，包括場景、對話和主要事件。' },
              {
                fileData: {
                  mimeType: fileInfo.mimeType,
                  fileUri: `gs://${this.projectId}-temp/${path.basename(fileInfo.path)}`,
                  fileContent: fileData.toString('base64'),
                },
              },
            ],
          },
        ],
      };
      
      // 發送請求
      const result = await generativeModel.generateContent(request);
      const response = result.response as VertexAIResponse;
      
      // 提取文本
      let text = '';
      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        text = parts
          .filter((part: VertexAIResponsePart) => part.text !== undefined)
          .map((part: VertexAIResponsePart) => part.text)
          .filter((text): text is string => text !== undefined)
          .join('\n');
      }
      
      return text;
    } catch (error) {
      logger.error(`從視頻檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 從 JSON 檔案中提取內容
   * @param fileInfo 檔案信息
   */
  private async extractFromJsonFile(fileInfo: FileInfo): Promise<string> {
    try {
      // 讀取檔案內容
      const buffer = await readFile(fileInfo.path);
      const jsonContent = buffer.toString('utf-8');
      
      // 解析 JSON
      const jsonData = JSON.parse(jsonContent);
      
      // 使用 LLM 將 JSON 轉換為結構化文本
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的數據分析助手，負責將 JSON 數據轉換為結構化的文本描述。

請分析以下 JSON 數據，並提供詳細的文本描述，包括數據的結構、主要字段和值。

JSON 數據：
{jsonData}

請提供詳細的文本描述：
        `,
        inputVariables: ['jsonData'],
      });
      
      // 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 執行鏈並提取內容
      const result = await chain.call({
        jsonData: JSON.stringify(jsonData, null, 2),
      });
      
      return result.text;
    } catch (error) {
      logger.error(`從 JSON 檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 從 CSV 檔案中提取內容
   * @param fileInfo 檔案信息
   */
  private async extractFromCsvFile(fileInfo: FileInfo): Promise<string> {
    try {
      // 讀取檔案內容
      const buffer = await readFile(fileInfo.path);
      const csvContent = buffer.toString('utf-8');
      
      // 使用 LLM 將 CSV 轉換為結構化文本
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的數據分析助手，負責將 CSV 數據轉換為結構化的文本描述。

請分析以下 CSV 數據，並提供詳細的文本描述，包括數據的結構、列名、行數和主要內容。

CSV 數據：
{csvData}

請提供詳細的文本描述：
        `,
        inputVariables: ['csvData'],
      });
      
      // 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 執行鏈並提取內容
      const result = await chain.call({
        csvData: csvContent,
      });
      
      return result.text;
    } catch (error) {
      logger.error(`從 CSV 檔案 ${fileInfo.originalName} 中提取內容錯誤:`, error);
      throw error;
    }
  }
  
  /**
   * 分析內容，生成標題、分類和標籤
   * @param content 內容
   * @param fileInfo 檔案信息
   */
  private async analyzeContent(content: string, fileInfo: FileInfo): Promise<{
    title: string;
    category: string;
    tags: string[];
    confidence: number;
  }> {
    try {
      // 使用 LLM 分析內容
      const promptTemplate = new PromptTemplate({
        template: `
你是一個專業的知識提取助手，負責從檔案內容中提取有價值的信息，並生成標題、分類和標籤。

檔案信息：
- 檔案名稱: {fileName}
- 檔案類型: {fileType}
- MIME 類型: {mimeType}

檔案內容：
{content}

請分析上述內容，並提供以下信息：
1. 標題：一個簡短、明確的標題，概括內容的主題
2. 分類：內容的分類（如產品信息、常見問題、流程說明、政策信息、故障排除等）
3. 標籤：3-5 個相關的標籤，用於描述內容的關鍵詞
4. 信心分數：0-1 之間的小數，表示對分析結果的確信程度

請以 JSON 格式輸出，包含以下字段：
- title: 標題
- category: 分類
- tags: 標籤數組
- confidence: 信心分數

JSON 輸出：
        `,
        inputVariables: ['fileName', 'fileType', 'mimeType', 'content'],
      });
      
      // 創建 LLM 鏈
      const chain = new LLMChain({
        llm: this.llm,
        prompt: promptTemplate,
      });
      
      // 執行鏈並分析內容
      const result = await chain.call({
        fileName: fileInfo.originalName,
        fileType: fileInfo.type,
        mimeType: fileInfo.mimeType,
        content: content.substring(0, 8000), // 限制內容長度，避免超出 token 限制
      });
      
      // 解析結果
      try {
        const analysis = JSON.parse(result.text);
        
        return {
          title: analysis.title || fileInfo.originalName,
          category: analysis.category || '未分類',
          tags: analysis.tags || [],
          confidence: analysis.confidence || 0.7,
        };
      } catch (error) {
        logger.error('解析 LLM 分析結果錯誤:', error);
        
        // 返回默認值
        return {
          title: fileInfo.originalName,
          category: '未分類',
          tags: [fileInfo.type],
          confidence: 0.5,
        };
      }
    } catch (error) {
      logger.error('分析內容錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 將提取結果保存到知識庫
   * @param result 提取結果
   * @param userId 用戶 ID
   */
  async saveExtractionResult(result: FileExtractionResult, userId: string): Promise<string> {
    try {
      // 創建知識項目
      const knowledgeItem = await knowledgeService.createKnowledgeItem({
        title: result.title,
        content: result.content,
        category: result.category,
        tags: result.tags,
        source: result.source,
        sourceUrl: result.sourceUrl,
        isPublished: false, // 默認不發布，需要人工審核
        metadata: {
          fileInfo: result.metadata.fileInfo,
          extractionTime: result.metadata.extractionTime,
          confidence: result.confidence,
        },
      }, userId);
      
      logger.info(`已保存提取結果到知識庫: ${knowledgeItem.id}`);
      
      return knowledgeItem.id;
    } catch (error) {
      logger.error('保存提取結果錯誤:', error);
      throw error;
    }
  }
  
  /**
   * 清理臨時檔案
   * @param filePath 檔案路徑
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      // 檢查檔案是否存在
      if (fs.existsSync(filePath)) {
        // 刪除檔案
        await unlink(filePath);
        logger.info(`已刪除臨時檔案: ${filePath}`);
      }
    } catch (error) {
      logger.error(`刪除臨時檔案 ${filePath} 錯誤:`, error);
      // 不拋出錯誤，僅記錄日誌
    }
  }
  
  /**
   * 處理檔案上傳和提取
   * @param file 檔案數據
   * @param originalName 原始檔案名
   * @param mimeType MIME 類型
   * @param userId 用戶 ID
   */
  async processFile(file: Buffer, originalName: string, mimeType: string, userId: string): Promise<{
    knowledgeItemId: string;
    extractionResult: FileExtractionResult;
  }> {
    let fileInfo: FileInfo | null = null;
    
    try {
      // 保存上傳的檔案
      fileInfo = await this.saveUploadedFile(file, originalName, mimeType);
      
      // 從檔案中提取內容
      const extractionResult = await this.extractContentFromFile(fileInfo);
      
      // 將提取結果保存到知識庫
      const knowledgeItemId = await this.saveExtractionResult(extractionResult, userId);
      
      return {
        knowledgeItemId,
        extractionResult,
      };
    } catch (error) {
      logger.error(`處理檔案 ${originalName} 錯誤:`, error);
      throw error;
    } finally {
      // 清理臨時檔案
      if (fileInfo) {
        await this.cleanupFile(fileInfo.path);
      }
    }
  }
  
  /**
   * 批量處理檔案
   * @param files 檔案列表
   * @param userId 用戶 ID
   */
  async batchProcessFiles(files: Array<{
    file: Buffer;
    originalName: string;
    mimeType: string;
  }>, userId: string): Promise<{
    processedCount: number;
    successCount: number;
    failedCount: number;
    results: Array<{
      originalName: string;
      success: boolean;
      knowledgeItemId?: string;
      error?: string;
    }>;
  }> {
    try {
      logger.info(`開始批量處理 ${files.length} 個檔案`);
      
      const results: Array<{
        originalName: string;
        success: boolean;
        knowledgeItemId?: string;
        error?: string;
      }> = [];
      
      let successCount = 0;
      let failedCount = 0;
      
      // 遍歷檔案列表，逐個處理
      for (const fileData of files) {
        try {
          // 處理檔案
          const result = await this.processFile(
            fileData.file,
            fileData.originalName,
            fileData.mimeType,
            userId
          );
          
          // 記錄成功結果
          results.push({
            originalName: fileData.originalName,
            success: true,
            knowledgeItemId: result.knowledgeItemId,
          });
          
          successCount++;
        } catch (err) {
          // 記錄失敗結果
          const error = err as Error;
          results.push({
            originalName: fileData.originalName,
            success: false,
            error: error.message || '處理檔案時發生錯誤',
          });
          
          failedCount++;
          
          logger.error(`處理檔案 ${fileData.originalName} 錯誤:`, error);
        }
      }
      
      logger.info(`批量處理完成，成功: ${successCount}，失敗: ${failedCount}`);
      
      return {
        processedCount: files.length,
        successCount,
        failedCount,
        results,
      };
    } catch (error) {
      logger.error('批量處理檔案錯誤:', error);
      throw error;
    }
  }
}

export default new FileExtractionService();