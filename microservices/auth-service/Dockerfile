# 使用 Alpine 作為基礎鏡像以減小大小
FROM node:18-alpine AS builder

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 第二階段：運行階段
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 從構建階段複製依賴和構建後的文件
COPY --from=builder /app ./

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# 切換到非 root 用戶
USER nodejs

# 設置環境變量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3001

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# 啟動應用
CMD ["node", "src/index.js"]