import { Request, Response } from 'express';
import { CustomerPlatform } from '../models/CustomerPlatform';
import { Customer } from '../models/Customer';
import { PlatformType, PlatformStatus } from '../types/platform';
import platformSyncService from '../services/platform-sync-service';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * 平台控制器
 * 處理平台相關的請求
 */
class PlatformController {
  /**
   * 獲取所有平台
   */
  async getAllPlatforms(req: Request, res: Response): Promise<void> {
    try {
      const platforms = await CustomerPlatform.findAll({
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });

      res.status(200).json(platforms);
    } catch (error) {
      logger.error('獲取所有平台錯誤:', error);
      res.status(500).json({ message: '獲取平台列表失敗' });
    }
  }

  /**
   * 獲取平台詳情
   */
  async getPlatformById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const platform = await CustomerPlatform.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      res.status(200).json(platform);
    } catch (error) {
      logger.error('獲取平台詳情錯誤:', error);
      res.status(500).json({ message: '獲取平台詳情失敗' });
    }
  }

  /**
   * 創建平台
   */
  async createPlatform(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, platformType, platformCustomerId, platformData } = req.body;

      // 檢查必要參數
      if (!customerId || !platformType || !platformCustomerId) {
        res.status(400).json({ message: '缺少必要參數' });
        return;
      }

      // 檢查平台類型是否有效
      if (!Object.values(PlatformType).includes(platformType)) {
        res.status(400).json({ message: '無效的平台類型' });
        return;
      }

      // 檢查客戶是否存在
      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        res.status(404).json({ message: '找不到客戶' });
        return;
      }

      // 檢查平台是否已存在
      const existingPlatform = await CustomerPlatform.findOne({
        where: {
          customerId,
          platformType,
          platformCustomerId,
        },
      });

      if (existingPlatform) {
        res.status(409).json({ message: '平台已存在' });
        return;
      }

      // 創建平台
      const platform = await CustomerPlatform.create({
        id: uuidv4(),
        customerId,
        platformId: uuidv4(), // 生成唯一的平台 ID
        platformType,
        platformCustomerId,
        platformData: platformData || {},
      });

      res.status(201).json(platform);
    } catch (error) {
      logger.error('創建平台錯誤:', error);
      res.status(500).json({ message: '創建平台失敗' });
    }
  }

  /**
   * 更新平台
   */
  async updatePlatform(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { platformData } = req.body;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 更新平台
      await platform.update({
        platformData: platformData || platform.platformData,
      });

      res.status(200).json(platform);
    } catch (error) {
      logger.error('更新平台錯誤:', error);
      res.status(500).json({ message: '更新平台失敗' });
    }
  }

  /**
   * 刪除平台
   */
  async deletePlatform(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 刪除平台
      await platform.destroy();

      res.status(204).send();
    } catch (error) {
      logger.error('刪除平台錯誤:', error);
      res.status(500).json({ message: '刪除平台失敗' });
    }
  }

  /**
   * 連接平台
   */
  async connectPlatform(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 更新平台狀態
      await platform.update({
        platformData: {
          ...platform.platformData,
          status: PlatformStatus.ACTIVE,
        },
      });

      res.status(200).json({
        success: true,
        message: '平台已連接',
        status: PlatformStatus.ACTIVE,
      });
    } catch (error) {
      logger.error('連接平台錯誤:', error);
      res.status(500).json({
        success: false,
        message: '連接平台失敗',
        status: PlatformStatus.ERROR,
      });
    }
  }

  /**
   * 斷開平台連接
   */
  async disconnectPlatform(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 更新平台狀態
      await platform.update({
        platformData: {
          ...platform.platformData,
          status: PlatformStatus.INACTIVE,
        },
      });

      res.status(200).json({
        success: true,
        message: '平台已斷開連接',
        status: PlatformStatus.INACTIVE,
      });
    } catch (error) {
      logger.error('斷開平台連接錯誤:', error);
      res.status(500).json({
        success: false,
        message: '斷開平台連接失敗',
        status: PlatformStatus.ERROR,
      });
    }
  }

  /**
   * 測試平台連接
   */
  async testPlatformConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 模擬測試連接
      const isConnected = Math.random() > 0.2; // 80% 的機率連接成功

      if (isConnected) {
        res.status(200).json({
          success: true,
          message: '平台連接測試成功',
          status: PlatformStatus.ACTIVE,
        });
      } else {
        res.status(200).json({
          success: false,
          message: '平台連接測試失敗',
          status: PlatformStatus.ERROR,
        });
      }
    } catch (error) {
      logger.error('測試平台連接錯誤:', error);
      res.status(500).json({
        success: false,
        message: '測試平台連接失敗',
        status: PlatformStatus.ERROR,
      });
    }
  }

  /**
   * 獲取平台連接狀態
   */
  async getPlatformStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 獲取平台狀態
      const status = platform.platformData?.status || PlatformStatus.INACTIVE;
      const lastSyncTime = platform.lastSyncTime;

      res.status(200).json({
        status,
        lastSyncTime,
        platformId: platform.platformId,
        platformType: platform.platformType,
      });
    } catch (error) {
      logger.error('獲取平台狀態錯誤:', error);
      res.status(500).json({ message: '獲取平台狀態失敗' });
    }
  }

  /**
   * 同步平台數據
   */
  async syncPlatform(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 開始同步任務
      const syncId = await platformSyncService.startSync({
        platformId: platform.platformId,
        platformType: platform.platformType,
      });

      res.status(200).json({
        success: true,
        message: '同步任務已啟動',
        syncId,
      });
    } catch (error) {
      logger.error('同步平台數據錯誤:', error);
      res.status(500).json({
        success: false,
        message: '同步平台數據失敗',
        syncedItems: 0,
        failedItems: 0,
      });
    }
  }

  /**
   * 取消同步任務
   */
  async cancelSync(req: Request, res: Response): Promise<void> {
    try {
      const { id, syncId } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 取消同步任務
      const result = await platformSyncService.cancelSync(syncId);

      if (result) {
        res.status(200).json({
          success: true,
          message: '同步任務已取消',
        });
      } else {
        res.status(404).json({
          success: false,
          message: '找不到同步任務',
        });
      }
    } catch (error) {
      logger.error('取消同步任務錯誤:', error);
      res.status(500).json({
        success: false,
        message: '取消同步任務失敗',
      });
    }
  }

  /**
   * 獲取同步狀態
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id, syncId } = req.params;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 獲取同步狀態
      const syncStatus = await platformSyncService.getSyncStatus(syncId);

      res.status(200).json(syncStatus);
    } catch (error) {
      logger.error('獲取同步狀態錯誤:', error);
      res.status(500).json({ message: '獲取同步狀態失敗' });
    }
  }

  /**
   * 獲取同步歷史
   */
  async getSyncHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const platform = await CustomerPlatform.findByPk(id);

      if (!platform) {
        res.status(404).json({ message: '找不到平台' });
        return;
      }

      // 獲取同步歷史
      const syncHistory = await platformSyncService.getSyncHistory(
        platform.platformId,
        Number(limit),
        Number(offset)
      );

      res.status(200).json(syncHistory);
    } catch (error) {
      logger.error('獲取同步歷史錯誤:', error);
      res.status(500).json({ message: '獲取同步歷史失敗' });
    }
  }
}

export default new PlatformController();