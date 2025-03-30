import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import path from 'path';
import os from 'os';
import fileExtractionService from '../services/file-extraction-service';
import logger from '../utils/logger';

// 設置 multer 存儲配置
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制檔案大小為 50MB
  },
});

/**
 * 檔案提取控制器
 * 處理檔案上傳和提取請求
 */
class FileExtractionController {
  /**
   * 上傳並提取單個檔案
   * @param req 請求對象
   * @param res 響應對象
   */
  async uploadAndExtractFile(req: Request, res: Response): Promise<void> {
    try {
      // 使用 multer 處理檔案上傳
      upload.single('file')(req, res, async (err: any) => {
        if (err) {
          logger.error('檔案上傳錯誤:', err);
          res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '檔案上傳失敗',
            error: err.message,
          });
          return;
        }
        
        // 檢查是否有檔案
        if (!req.file) {
          res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '未提供檔案',
          });
          return;
        }
        
        try {
          // 檢查用戶是否已認證
          if (!req.user || !req.user.id) {
            res.status(StatusCodes.UNAUTHORIZED).json({
              success: false,
              message: '未授權的請求',
            });
            return;
          }
          
          // 處理檔案
          const result = await fileExtractionService.processFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            req.user.id
          );
          
          // 返回結果
          res.status(StatusCodes.OK).json({
            success: true,
            message: '檔案提取成功',
            data: result,
          });
        } catch (error) {
          logger.error('檔案提取錯誤:', error);
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: '檔案提取失敗',
            error: error instanceof Error ? error.message : '未知錯誤',
          });
        }
      });
    } catch (error) {
      logger.error('處理檔案上傳請求錯誤:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '處理檔案上傳請求失敗',
        error: error instanceof Error ? error.message : '未知錯誤',
      });
    }
  }
  
  /**
   * 上傳並提取多個檔案
   * @param req 請求對象
   * @param res 響應對象
   */
  async uploadAndExtractMultipleFiles(req: Request, res: Response): Promise<void> {
    try {
      // 使用 multer 處理多檔案上傳
      upload.array('files', 10)(req, res, async (err: any) => {
        if (err) {
          logger.error('檔案上傳錯誤:', err);
          res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '檔案上傳失敗',
            error: err.message,
          });
          return;
        }
        
        // 檢查是否有檔案
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: '未提供檔案',
          });
          return;
        }
        
        try {
          // 檢查用戶是否已認證
          if (!req.user || !req.user.id) {
            res.status(StatusCodes.UNAUTHORIZED).json({
              success: false,
              message: '未授權的請求',
            });
            return;
          }
          
          // 準備檔案數據
          const files = req.files.map((file) => ({
            file: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
          }));
          
          // 批量處理檔案
          const result = await fileExtractionService.batchProcessFiles(files, req.user.id);
          
          // 返回結果
          res.status(StatusCodes.OK).json({
            success: true,
            message: '檔案批量提取成功',
            data: result,
          });
        } catch (error) {
          logger.error('檔案批量提取錯誤:', error);
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: '檔案批量提取失敗',
            error: error instanceof Error ? error.message : '未知錯誤',
          });
        }
      });
    } catch (error) {
      logger.error('處理檔案批量上傳請求錯誤:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '處理檔案批量上傳請求失敗',
        error: error instanceof Error ? error.message : '未知錯誤',
      });
    }
  }
}

export default new FileExtractionController();