# 監督式學習機制

本文檔描述了全通路客戶訊息管理平台中的監督式學習機制。

## 概述

監督式學習機制允許系統從人工修改的 AI 回覆中學習並改進。當客服人員修改 AI 生成的回覆時，系統會分析差異，提取學習點，並生成新的知識項目，從而不斷提高 AI 回覆的質量。

## 核心功能

1. **從人工修改中學習**：分析 AI 回覆與人工修改的差異，提取有價值的學習點
2. **知識項目生成**：基於學習點自動生成新的知識項目，豐富知識庫
3. **改進建議生成**：提供系統改進建議，幫助優化 AI 回覆生成邏輯
4. **學習統計與分析**：提供學習效果的統計信息和分析報告

## 技術實現

### 後端實現

1. **監督式學習服務** (`supervised-learning-service.ts`)
   - 提供從人工修改中學習的核心邏輯
   - 計算 AI 回覆與人工回覆的相似度
   - 提取學習點並生成知識項目
   - 提供學習統計信息

2. **監督式學習控制器** (`supervised-learning-controller.ts`)
   - 處理監督式學習相關的 API 請求
   - 提供學習、批量學習和獲取統計信息的端點

3. **監督式學習路由** (`supervised-learning.ts`)
   - 定義監督式學習相關的 API 路由
   - 實現身份驗證和權限控制

### 前端實現

1. **監督式學習服務** (`supervisedLearningService.ts`)
   - 提供與後端 API 交互的方法
   - 處理錯誤和異常情況

2. **監督式學習統計組件** (`SupervisedLearningStats.tsx`)
   - 顯示學習統計信息和歷史記錄
   - 提供數據刷新和分頁功能
   - 可視化學習效果和相似度

3. **監督式學習頁面** (`supervised-learning/index.tsx`)
   - 整合監督式學習統計組件
   - 提供用戶友好的界面

## API 端點

### 從人工修改中學習

```
POST /api/supervised-learning/learn
```

請求參數：
```json
{
  "aiMessageId": "ai-message-id",
  "humanMessageId": "human-message-id"
}
```

響應：
```json
{
  "success": true,
  "message": "從人工修改中學習成功",
  "newKnowledgeItems": ["知識項目1", "知識項目2"],
  "improvementSuggestions": ["改進建議1", "改進建議2"]
}
```

### 批量處理學習樣本

```
POST /api/supervised-learning/batch-learn
```

請求參數：
```json
{
  "samples": [
    {
      "aiMessageId": "ai-message-id-1",
      "humanMessageId": "human-message-id-1"
    },
    {
      "aiMessageId": "ai-message-id-2",
      "humanMessageId": "human-message-id-2"
    }
  ]
}
```

響應：
```json
{
  "success": true,
  "message": "批量學習完成，成功: 2，失敗: 0",
  "results": [
    {
      "success": true,
      "message": "從人工修改中學習成功",
      "newKnowledgeItems": ["知識項目1"],
      "improvementSuggestions": ["改進建議1"]
    },
    {
      "success": true,
      "message": "從人工修改中學習成功",
      "newKnowledgeItems": ["知識項目2"],
      "improvementSuggestions": ["改進建議2"]
    }
  ]
}
```

### 獲取學習統計信息

```
GET /api/supervised-learning/stats
```

響應：
```json
{
  "success": true,
  "data": {
    "totalSamples": 100,
    "successfulSamples": 95,
    "averageSimilarity": 0.75,
    "knowledgeItemsGenerated": 150,
    "topLearningPoints": [
      "更專業的術語使用",
      "更詳細的產品說明",
      "更友善的語氣",
      "更清晰的步驟說明",
      "更個性化的回覆"
    ]
  }
}
```

## 學習流程

1. 客服人員收到 AI 生成的回覆建議
2. 客服人員根據需要修改回覆並發送給客戶
3. 系統比較 AI 回覆和人工修改的回覆
4. 如果相似度低於閾值，系統啟動學習流程
5. 系統提取學習點並生成新的知識項目
6. 新的知識項目被添加到知識庫中
7. 系統生成改進建議，幫助優化 AI 回覆生成邏輯

## 效益

1. **知識自動沉澱**：將客服人員的專業知識自動轉化為系統知識
2. **持續學習與改進**：系統能夠從每次人工修改中學習，不斷提高回覆質量
3. **減少重複培訓**：新員工可以直接受益於系統積累的知識
4. **提高客戶滿意度**：隨著系統學習的深入，AI 回覆的質量不斷提高，客戶滿意度也隨之提升

## 未來擴展

1. **多維度學習**：不僅學習回覆內容，還學習回覆時機、語氣和風格
2. **主動學習**：系統主動識別不確定的案例，請求人工審核和指導
3. **跨語言學習**：將一種語言的學習成果遷移到其他語言
4. **個性化學習**：根據不同客服人員的風格和專長進行個性化學習