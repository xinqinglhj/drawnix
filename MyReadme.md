



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

