import express from 'express';
import CustomerModel, { CreateCustomerDTO, UpdateCustomerDTO } from '../models/Customer';

const router = express.Router();

/**
 * @route GET /api/customers
 * @desc 搜索客戶
 * @access Private
 */
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { search = '', limit = '20', offset = '0' } = req.query;
    
    const customers = await CustomerModel.search(
      search as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/customers/:id
 * @desc 獲取單個客戶
 * @access Private
 */
router.get('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    
    const customer = await CustomerModel.findById(id);
    
    if (!customer) {
      return res.status(404).json({ message: '找不到客戶' });
    }
    
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/customers
 * @desc 創建新客戶
 * @access Private
 */
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const { name, email, phone, platforms, tags, metadata } = req.body;
    
    // 驗證必要字段
    if (!name) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    const customerData: CreateCustomerDTO = {
      name,
      email,
      phone,
      platforms,
      tags,
      metadata
    };
    
    const newCustomer = await CustomerModel.create(customerData);
    
    res.status(201).json(newCustomer);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/customers/:id
 * @desc 更新客戶信息
 * @access Private
 */
router.put('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { name, email, phone, platforms, tags, metadata } = req.body;
    
    const updateData: UpdateCustomerDTO = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (platforms !== undefined) updateData.platforms = platforms;
    if (tags !== undefined) updateData.tags = tags;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    const updatedCustomer = await CustomerModel.update(id, updateData);
    
    if (!updatedCustomer) {
      return res.status(404).json({ message: '找不到客戶' });
    }
    
    res.json(updatedCustomer);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/customers/platform/:platform/:platformId
 * @desc 根據平台ID查詢客戶
 * @access Private
 */
router.get('/platform/:platform/:platformId', async (req: any, res: any, next: any) => {
  try {
    const { platform, platformId } = req.params;
    
    const customer = await CustomerModel.findByPlatformId(platform, platformId);
    
    if (!customer) {
      return res.status(404).json({ message: '找不到客戶' });
    }
    
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/customers/:id/interaction
 * @desc 更新客戶最後互動時間
 * @access Private
 */
router.patch('/:id/interaction', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    
    const success = await CustomerModel.updateLastInteraction(id);
    
    if (!success) {
      return res.status(404).json({ message: '找不到客戶' });
    }
    
    res.status(200).json({ message: '最後互動時間已更新' });
  } catch (error) {
    next(error);
  }
});

export default router;