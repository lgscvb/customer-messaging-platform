import KnowledgeItem from '../../models/KnowledgeItem';

/**
 * 創建測試知識項目
 * @param title 標題
 * @param content 內容
 * @param category 分類
 * @returns 創建的測試知識項目
 */
export async function createTestKnowledgeItem(
  title: string,
  content: string,
  category: string
): Promise<KnowledgeItem> {
  const testKnowledgeItem = {
    title,
    content,
    category,
    tags: ['test', category.toLowerCase()],
    source: 'test-source',
    createdBy: '00000000-0000-0000-0000-000000000000', // 測試用戶 ID
    updatedBy: '00000000-0000-0000-0000-000000000000', // 測試用戶 ID
    isPublished: true,
    metadata: {
      source: 'test',
      testData: true
    }
  };

  return await KnowledgeItem.create(testKnowledgeItem);
}

/**
 * 創建多個測試知識項目
 * @param count 知識項目數量
 * @param categoryPrefix 分類前綴
 * @returns 創建的測試知識項目數組
 */
export async function createTestKnowledgeItems(
  count: number,
  categoryPrefix: string = '測試分類'
): Promise<KnowledgeItem[]> {
  const items: KnowledgeItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = `${categoryPrefix} ${i + 1}`;
    const item = await createTestKnowledgeItem(
      `測試知識項目 ${i + 1}`,
      `這是測試知識項目 ${i + 1} 的內容，用於測試目的。`,
      category
    );
    items.push(item);
  }
  
  return items;
}

/**
 * 創建相關知識項目集合
 * @param baseCategory 基礎分類
 * @returns 創建的測試知識項目數組
 */
export async function createRelatedKnowledgeItems(
  baseCategory: string = '產品知識'
): Promise<KnowledgeItem[]> {
  const items: KnowledgeItem[] = [];
  
  // 創建一組相關的知識項目
  const categories = [
    `${baseCategory} - 基本介紹`,
    `${baseCategory} - 功能說明`,
    `${baseCategory} - 常見問題`,
    `${baseCategory} - 使用技巧`,
    `${baseCategory} - 故障排除`
  ];
  
  for (let i = 0; i < categories.length; i++) {
    const item = await createTestKnowledgeItem(
      `${baseCategory} - ${i + 1}`,
      `這是關於${categories[i]}的詳細說明，包含了相關的知識點和重要信息。`,
      categories[i]
    );
    items.push(item);
  }
  
  return items;
}