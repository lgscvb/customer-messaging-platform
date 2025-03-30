# 全通路客戶訊息管理平台

全通路客戶訊息管理平台是一個整合多平台客戶訊息的系統，支援 LINE、Facebook、官網等渠道，並提供 AI 輔助回覆與導購功能。

## 核心功能

- **多平台訊息整合**：統一管理來自 LINE、Facebook、官網等平台的客戶訊息
- **AI 輔助回覆**：使用 RAG 技術提供智能回覆建議
- **客戶資料庫**：建立完整的客戶檔案，包含跨平台互動記錄
- **知識管理**：自動沉澱專業知識，形成企業知識庫
- **監督式學習**：透過人工審核持續優化 AI 回覆品質

## 技術架構

### 前端技術

- 框架：React.js
- UI 元件：Material UI
- 即時通訊：WebSocket
- 狀態管理：Redux
- 國際化：i18next

### 後端技術

- 伺服器：Node.js + Express
- 資料庫：
  - 關聯式資料庫：PostgreSQL
  - 向量資料庫：Pinecone
- 訊息佇列：RabbitMQ
- 容器化：Docker 與 Kubernetes

### AI 與機器學習

- 大語言模型：Google Vertex AI (PaLM 2) 或 OpenAI (GPT-4)
- RAG (檢索增強生成)：LangChain
- 向量嵌入：Google Text Embeddings API

## 快速開始

### 前置需求

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (可選)

### 安裝步驟

1. 複製專案

```bash
git clone https://github.com/lgscvb/customer-messaging-platform.git
cd customer-messaging-platform
```

2. 安裝依賴

```bash
# 安裝後端依賴
cd backend
npm install

# 安裝前端依賴
cd ../frontend
npm install
```

3. 設定環境變數

```bash
# 後端環境變數
cd ../backend
cp .env.example .env
# 編輯 .env 文件，填入必要的配置

# 前端環境變數
cd ../frontend
cp .env.example .env
# 編輯 .env 文件，填入必要的配置
```

4. 初始化資料庫

```bash
cd ../backend
npm run db:init
```

5. 啟動開發環境

```bash
# 啟動後端
cd ../backend
npm run dev

# 啟動前端 (新開一個終端)
cd ../frontend
npm run dev
```

6. 使用 Docker Compose 啟動 (可選)

```bash
# 在專案根目錄
docker-compose up -d
```

## 平台整合

### LINE 整合

1. 在 [LINE Developers](https://developers.line.biz/) 創建一個 Provider 和 Channel
2. 獲取 Channel Access Token 和 Channel Secret
3. 設定 Webhook URL 為 `https://your-domain.com/api/webhooks/line`
4. 在 `.env` 文件中設定 LINE 相關配置

### Facebook 整合

1. 在 [Facebook for Developers](https://developers.facebook.com/) 創建一個應用
2. 設定 Messenger 產品
3. 獲取 Page Access Token 和 App Secret
4. 設定 Webhook URL 為 `https://your-domain.com/api/webhooks/facebook`
5. 在 `.env` 文件中設定 Facebook 相關配置

### 官網整合

1. 在官網中加入我們提供的聊天小工具 JavaScript 代碼
2. 設定 API Key 和 Webhook Secret
3. 在 `.env` 文件中設定網站相關配置

## 專案結構

```
customer-messaging-platform/
├── backend/                # 後端代碼
│   ├── src/
│   │   ├── connectors/     # 平台連接器
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 數據模型
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 業務邏輯
│   │   ├── utils/          # 工具函數
│   │   ├── app.ts          # Express 應用
│   │   └── index.ts        # 入口文件
│   ├── scripts/            # 腳本
│   └── tests/              # 測試
├── frontend/               # 前端代碼
│   ├── public/             # 靜態資源
│   └── src/
│       ├── components/     # React 組件
│       ├── contexts/       # React 上下文
│       ├── hooks/          # React 鉤子
│       ├── pages/          # 頁面組件
│       ├── services/       # API 服務
│       ├── store/          # Redux 狀態
│       ├── utils/          # 工具函數
│       └── App.tsx         # 根組件
├── docs/                   # 文檔
└── docker-compose.yml      # Docker Compose 配置
```

## 開發指南

### 代碼風格

本專案使用 ESLint 和 Prettier 來保持代碼風格一致。

```bash
# 檢查代碼風格
npm run lint

# 自動修復代碼風格問題
npm run lint:fix
```

### 提交規範

本專案使用 Conventional Commits 規範。

```bash
# 提交示例
git commit -m "feat: 添加 LINE 連接器"
git commit -m "fix: 修復消息發送問題"
```

### 測試

```bash
# 運行單元測試
npm run test

# 運行端到端測試
npm run test:e2e
```

## 部署

### 使用 Docker

```bash
# 構建 Docker 映像
docker build -t customer-messaging-platform-backend ./backend
docker build -t customer-messaging-platform-frontend ./frontend

# 運行容器
docker run -p 3000:3000 customer-messaging-platform-backend
docker run -p 3001:3001 customer-messaging-platform-frontend
```

### 使用 Kubernetes

請參考 `k8s/` 目錄中的 Kubernetes 配置文件。

## 貢獻指南

1. Fork 本專案
2. 創建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'feat: 添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟一個 Pull Request

## 許可證

本專案採用 MIT 許可證 - 詳見 [LICENSE](LICENSE) 文件。

## 聯絡我們

如有任何問題或建議，請聯絡我們：support@example.com