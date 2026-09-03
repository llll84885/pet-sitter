# ============================================
# 萌宠管家 - Hugging Face Spaces / Docker 部署
# 多阶段构建：先构建 H5，再运行轻量服务镜像
# ============================================

# ---- 阶段1：构建 H5 前端 ----
FROM node:22-slim AS builder
WORKDIR /app

# 先复制依赖清单，利用 Docker 缓存
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 复制源码并构建 H5（.env.production 会让 API 走同源相对路径）
COPY . .
RUN npm run build:h5

# 安装后端依赖
RUN cd server && npm install --omit=dev

# ---- 阶段2：运行镜像 ----
FROM node:22-slim
WORKDIR /app

# 复制后端代码与依赖
COPY --from=builder /app/server ./server
# 复制 H5 构建产物（server/index.js 会自动托管 ../dist）
COPY --from=builder /app/dist ./dist

# HF Spaces 要求服务监听 7860 端口
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server/index.js"]
