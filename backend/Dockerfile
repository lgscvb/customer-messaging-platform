# 使用 Node.js 18 作為基礎鏡像 (Alpine 變體更小)
FROM node:18-alpine AS builder

# 設置工作目錄
WORKDIR /app

# 安裝構建依賴
RUN apk add --no-cache python3 make g++ git

# 首先只複製 package.json 和 package-lock.json 以利用緩存
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製源代碼
COPY . .

# 修復 LangChain 依賴問題（如果腳本存在）
RUN if [ -f ./scripts/fix-langchain-dependency.js ]; then node ./scripts/fix-langchain-dependency.js; fi

# 構建應用
RUN npm run build

# 使用更小的鏡像進行生產環境
FROM node:18-alpine AS production

# 設置工作目錄
WORKDIR /app

# 安裝生產環境所需的系統依賴
RUN apk add --no-cache curl wget

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝生產環境依賴
RUN npm ci --only=production && npm cache clean --force

# 從構建階段複製構建產物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/.env* ./

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 設置目錄權限
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# 切換到非 root 用戶
USER nodejs

# 設置環境變數
ENV NODE_ENV=production \
    PORT=3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# 暴露端口
EXPOSE 3001

# 啟動應用
CMD ["node", "dist/index.js"]