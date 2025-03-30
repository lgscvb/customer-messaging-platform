import express from 'express';
import fileExtractionController from '../controllers/file-extraction-controller';
import { authenticateJwt } from '../middlewares/auth';

const router = express.Router();

/**
 * @route POST /api/file-extraction/upload
 * @desc 上傳並提取單個檔案
 * @access Private
 */
router.post('/upload', authenticateJwt, fileExtractionController.uploadAndExtractFile);

/**
 * @route POST /api/file-extraction/upload-multiple
 * @desc 上傳並提取多個檔案
 * @access Private
 */
router.post('/upload-multiple', authenticateJwt, fileExtractionController.uploadAndExtractMultipleFiles);

export default router;