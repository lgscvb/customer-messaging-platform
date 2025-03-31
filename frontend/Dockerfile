# 使用 Node.js 18 作為基礎鏡像
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

# 設置環境變量
ENV NEXT_TELEMETRY_DISABLED=1

# 構建應用
RUN npm run build

# 使用 Nginx 作為生產環境服務器
FROM nginx:alpine AS production

# 安裝 curl 和 wget 用於健康檢查
RUN apk add --no-cache curl wget

# 複製 Nginx 配置
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# 從構建階段複製構建產物
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY --from=builder /app/.next/server/pages /usr/share/nginx/html
COPY --from=builder /app/.next/standalone /usr/share/nginx/html

# 創建健康檢查頁面
RUN echo "OK" > /usr/share/nginx/html/health

# 創建非 root 用戶
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# 設置目錄權限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# 切換到非 root 用戶
USER nginx

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# 暴露端口
EXPOSE 80

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]