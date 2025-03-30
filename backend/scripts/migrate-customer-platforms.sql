-- 遷移腳本：將 customers 表中的 platforms JSONB 數組規範化為單獨的 customer_platforms 表

-- 1. 創建新表
CREATE TABLE IF NOT EXISTS customer_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  profile_image VARCHAR(1024),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform, platform_id)
);

-- 2. 創建索引
CREATE INDEX IF NOT EXISTS idx_customer_platforms_customer_id ON customer_platforms(customer_id);

-- 3. 添加更新時間戳的觸發器
CREATE TRIGGER update_customer_platforms_updated_at
BEFORE UPDATE ON customer_platforms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 遷移現有數據
INSERT INTO customer_platforms (customer_id, platform, platform_id, display_name, profile_image, metadata)
SELECT 
  c.id as customer_id,
  p->>'platform' as platform,
  p->>'platformId' as platform_id,
  p->>'displayName' as display_name,
  p->>'profileImage' as profile_image,
  COALESCE(p->'metadata', '{}') as metadata
FROM customers c, jsonb_array_elements(c.platforms) p
WHERE jsonb_typeof(c.platforms) = 'array';

-- 5. 保留 platforms 欄位作為備份，但不再使用
-- 注意：在確認遷移成功後，可以考慮移除此欄位
-- ALTER TABLE customers DROP COLUMN platforms;