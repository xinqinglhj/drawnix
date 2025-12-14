# 注释说明开始构建前端应用的阶段（多阶段构建的第一个阶段）
# Stage 1: Build the frontend
# 基于Node.js 20官方镜像创建名为"builder"的构建阶段，用于前端构建
FROM node:20 AS builder

# 设置工作目录为/repo，后续操作将在此目录执行
WORKDIR /repo
# 将宿主机当前目录所有文件复制到镜像的/repo目录（包含前端源码和配置）
COPY . .

# Install dependencies including devDependencies for building
# 安装项目依赖（包含开发依赖devDependencies，因为需要构建前端资源）
RUN npm install
# Build the frontend application
# 执行前端构建命令（生成静态资源到dist目录）
RUN npm run build:web

# Stage 2: Setup the production environment
# 注释说明开始生产环境部署阶段（多阶段构建的第二个阶段）
# 基于Node.js 20创建最终的生产环境镜像（比构建阶段更精简）
FROM node:20
# 设置生产环境的工作目录为/app
WORKDIR /app

# Install production dependencies for the server
# 仅复制服务器端的package.json到工作目录（利用Docker层缓存优化构建速度）
COPY apps/server/package.json .
# 仅安装生产环境所需的依赖（排除开发依赖，减小镜像体积）
RUN npm install --production

# Copy server source code ensuring directory structure matches path.join expectations
# main.js expects ../../../dist/apps/web relative to apps/server/src
# 复制服务器源码到镜像中，保持main.js预期的目录结构（确保path.join路径正确）
COPY apps/server/src ./apps/server/src

# Copy built frontend assets from builder stage
# 从构建阶段复制前端构建结果（dist目录）到生产环境镜像的dist目录
COPY --from=builder /repo/dist ./dist

# Expose the port the app runs on
# 声明容器将监听3000端口（实际端口映射由docker run -p决定）
EXPOSE 3000

# Start the server
# 指定容器启动时执行的命令（启动Node.js服务器）
CMD ["node", "apps/server/src/main.js"]