# 腳本說明文件

本目錄包含用於維護和管理全通路客戶訊息管理平台的各種腳本。

## 腳本列表

### 1. 初始化數據庫 (init-db.js)

這個腳本用於初始化數據庫，創建必要的表格和初始數據。

**使用方法**:

```bash
node scripts/init-db.js
```

或者使用 npm 腳本:

```bash
npm run init-db
```

### 2. 修復 LangChain 依賴問題 (fix-langchain-dependency.js)

這個腳本用於解決 LangChain 與 OpenAI 版本不兼容的問題。當 LangChain 依賴於舊版本的 OpenAI 包時，這個腳本會修改 package.json 和 package-lock.json 以確保使用正確的版本。

**使用方法**:

```bash
node scripts/fix-langchain-dependency.js
```

**問題描述**:

LangChain 庫可能依賴於舊版本的 OpenAI 包，這可能導致與我們使用的 @langchain/openai 包發生衝突。這個腳本會:

1. 更新 package.json 中的 langchain 和 @langchain/openai 版本
2. 從 package-lock.json 中移除 LangChain 對 openai 的直接依賴
3. 修改 node_modules 中的 LangChain 包配置

**注意事項**:

- 如果腳本無法解決問題，請嘗試刪除 node_modules 目錄並重新安裝依賴:
  ```bash
  rm -rf node_modules && npm ci
  ```

### 3. 客戶平台遷移腳本 (migrate-customer-platforms.js)

這個腳本用於遷移客戶平台數據，例如從舊格式遷移到新格式，或者從一個平台遷移到另一個平台。

**使用方法**:

```bash
node scripts/migrate-customer-platforms.js
```

**參數**:

- `--dry-run`: 僅顯示將要執行的操作，不實際修改數據
- `--platform=<platform>`: 僅遷移指定平台的數據 (例如: line, facebook, shopee)

**示例**:

```bash
# 僅顯示將要遷移的 LINE 平台數據
node scripts/migrate-customer-platforms.js --dry-run --platform=line

# 遷移所有平台數據
node scripts/migrate-customer-platforms.js
```

## 開發新腳本

如果您需要開發新的腳本，請遵循以下準則:

1. 使用有意義的文件名，反映腳本的功能
2. 在腳本頂部添加註釋，說明腳本的用途和使用方法
3. 添加適當的錯誤處理和日誌輸出
4. 更新此 README.md 文件，添加新腳本的說明

## 最佳實踐

- 在運行修改數據的腳本前，先備份數據庫
- 對於危險操作，添加確認提示或 `--force` 參數
- 添加 `--dry-run` 選項，以便在實際執行前查看將要進行的更改
- 使用結構化的日誌輸出，便於閱讀和調試
- 對於長時間運行的腳本，添加進度指示器