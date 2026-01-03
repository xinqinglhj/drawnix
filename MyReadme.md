

## 部署方式

### 部署

#### 打包前端

```
 npm run build:web
```



#### 上传文件

```
/opt/drawnix/
├── apps/  // 服务端源码
│   └── server/
│       ├── package.json
│       └── src/
├── dist/   // 打包好的前端
│   └── apps/
│       └── web/
├── Dockerfile.deploy
└── docker-compose.deploy.yml
```



#### 执行

```
docker-compose -f docker-compose.deploy.yml up --build -d
```

## 单独部署前端

如果单独部署前端（例如使用 Nginx），推荐使用 **反向代理** 的方式来解决 CORS 和地址问题。

已为您配置好通用方案：

1. 代码支持：修改了 `drawing-service.ts`，优先读取环境变量，默认使用 `/api`。
2. Nginx 配置：修改了 `nginx.conf`，增加 /api的代理配置，自动将请求转发给后端服务 (http://backend:3000)。

**如何部署**： 直接使用我为您准备好的 

```
docker-compose.nginx.yml
```

 即可，它已经包含了一个 Nginx 服务和一个后端服务。



```bash

# 1. 构建前端（在本地执行，生成 dist 目录）
npm run build:web

# 2. 启动 Nginx + Backend 服务
docker-compose -f docker-compose.nginx.yml up -d --build
```

这样访问 

```
http://localhost
```

 (Nginx 端口) 时，页面加载自 Nginx，API 请求会被 Nginx 自动转发给后端，**完美解决跨域问题**，且无需修改前端代码中的 IP 地址。