# 全通路客戶訊息管理平台

全通路客戶訊息管理平台是一個整合多平台客戶訊息的系統，支援 LINE、Meta、蝦皮、官網等渠道，並提供 AI 輔助回覆與導購功能。

## 核心功能

- **多平台訊息整合**：統一管理來自 LINE、Meta、蝦皮、官網等平台的客戶訊息
- **AI 輔助回覆**：使用先進的 AI 技術生成專業回覆建議
- **導購功能**：智能推薦產品，提高銷售轉化率
- **客戶資料庫**：建立完整的客戶資料，提供 360° 客戶視圖
- **知識管理**：沉澱企業知識，實現知識共享
- **監督式學習**：系統持續從人工修改中學習，不斷提升 AI 回覆品質

## 技術架構

### 前端技術

- **框架**：Next.js (React)
- **UI 元件**：Material UI
- **狀態管理**：Redux Toolkit
- **即時通訊**：Socket.IO
- **國際化**：i18next
- **圖表**：Chart.js

### 後端技術

- **伺服器**：Node.js (Express)
- **資料庫**：
  - 關聯式資料庫：PostgreSQL
  - 向量資料庫：Milvus (用於 RAG)
- **訊息佇列**：Redis
- **容器化**：Docker 與 Kubernetes

### AI 與機器學習

- **大語言模型**：OpenAI (GPT-4)
- **RAG (檢索增強生成)**：LangChain
- **向量嵌入**：OpenAI Embeddings API

## 專案結構

```
customer-messaging-platform/
├── backend/                # 後端程式碼
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middlewares/    # 中間件
│   │   ├── models/         # 數據模型
│   │   ├── routes/         # API 路由
│   │   ├── services/       # 業務邏輯
│   │   ├── utils/          # 工具函數
│   │   ├── app.ts          # Express 應用
│   │   └── index.ts        # 入口文件
│   ├── scripts/            # 腳本文件
│   ├── .env                # 環境變量
│   ├── .env.test           # 測試環境變量
│   ├── Dockerfile          # Docker 配置
│   ├── jest.config.js      # Jest 配置
│   ├── package.json        # 依賴管理
│   └── tsconfig.json       # TypeScript 配置
│
├── frontend/               # 前端程式碼
│   ├── public/             # 靜態資源
│   ├── src/
│   │   ├── components/     # 組件
│   │   ├── contexts/       # 上下文
│   │   ├── hooks/          # 自定義 Hooks
│   │   ├── i18n/           # 國際化
│   │   ├── lib/            # 工具庫
│   │   ├── pages/          # 頁面
│   │   ├── services/       # API 服務
│   │   ├── store/          # Redux 狀態管理
│   │   ├── styles/         # 樣式
│   │   └── types/          # TypeScript 類型
│   ├── .env                # 環境變量
│   ├── Dockerfile          # Docker 配置
│   ├── next.config.js      # Next.js 配置
│   ├── package.json        # 依賴管理
│   └── tsconfig.json       # TypeScript 配置
│
├── .github/                # GitHub 配置
│   └── workflows/          # GitHub Actions
│
├── docker-compose.yml      # Docker Compose 配置
└── README.md               # 項目說明
```

## 安裝與運行

### 前置需求

- Node.js 18+
- PostgreSQL 14+
- Redis
- Docker (可選)

### 本地開發

1. 克隆儲存庫

```bash
git clone https://github.com/your-org/customer-messaging-platform.git
cd customer-messaging-platform
```

2. 安裝後端依賴

```bash
cd backend
npm install
```

3. 設置環境變量

```bash
cp .env.example .env
# 編輯 .env 文件，填入必要的配置
```

4. 啟動後端服務

```bash
npm run dev
```

5. 安裝前端依賴

```bash
cd ../frontend
npm install
```

6. 啟動前端服務

```bash
npm run dev
```

7. 訪問應用

打開瀏覽器，訪問 http://localhost:3000

### 使用 Docker 運行

1. 使用 Docker Compose 啟動所有服務

```bash
docker-compose up -d
```

2. 訪問應用

打開瀏覽器，訪問 http://localhost:80

## 測試

### 運行後端測試

```bash
cd backend
npm test
```

### 運行前端測試

```bash
cd frontend
npm test
```

## 部署

### 使用 GitHub Actions 部署

本項目配置了 GitHub Actions 工作流，可以自動化部署到開發環境和生產環境。

- 推送到 `develop` 分支會觸發部署到開發環境
- 推送到 `main` 分支會觸發部署到生產環境

### 手動部署

1. 構建 Docker 映像

```bash
docker-compose build
```

2. 推送 Docker 映像到儲存庫

```bash
docker-compose push
```

3. 在目標環境中拉取並運行

```bash
docker-compose pull
docker-compose up -d
```

## 貢獻指南

1. Fork 儲存庫
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 創建 Pull Request

## 授權

本項目採用 [MIT 授權](LICENSE)。

## 聯絡方式

如有任何問題或建議，請聯絡：

- 電子郵件：contact@example.com
- 問題追蹤：[GitHub Issues](https://github.com/your-org/customer-messaging-platform/issues)