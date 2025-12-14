# 离线存储与同步功能实施计划

## 目标描述
实现基于 IndexedDB 的本地绘画存储，使用户在无网络或服务器异常时仍能保存作品。同时实现本地与云端存储的切换，以及双向同步功能。

## 用户审查
> [!IMPORTANT]
> 将引入新的依赖库 `idb` 用于操作 IndexedDB。

## 拟议变更

### 依赖项 (Dependencies)
#### [MODIFY] [package.json](file:///c:/Soft/Dev/Src/github/drawnix/packages/drawnix/package.json)
- 添加 `idb` 依赖。

### API 层 (API Layer)
#### [NEW] [local-drawing-service.ts](file:///c:/Soft/Dev/Src/github/drawnix/packages/drawnix/src/api/local-drawing-service.ts)
- 使用 `idb` 实现 `LocalDrawingService`。
- 提供方法：`getAll` (获取列表), `getOne` (获取详情), `create` (创建), `update` (更新), `delete` (删除)。
- 数据库名：`drawnix-db`，对象仓库：`drawings`。

#### [NEW] [storage-manager.ts](file:///c:/Soft/Dev/Src/github/drawnix/packages/drawnix/src/api/storage-manager.ts)
- 管理当前的存储模式（云端 Cloud / 本地 Local）。
- **自动降级逻辑**：当请求云端接口失败（连接异常）时，自动提示或切换到本地存储模式。
- **同步逻辑**：
    - `syncToLocal(cloudDrawing)`: 将云端画作保存到本地。
    - `syncToCloud(localDrawing)`: 将本地画作上传到云端。

### UI 组件 (UI Components)

#### [MODIFY] [cloud-file-dialog.tsx](file:///c:/Soft/Dev/Src/github/drawnix/packages/drawnix/src/components/dialog/cloud-file-dialog.tsx)
- **增加标签页切换**：用户可在“云端画作”和“本地画作”之间切换。
- **本地列表**：在“本地”标签页下展示 IndexedDB 中的数据。
- **同步操作**：
    - 云端列表项增加“下载到本地”按钮。
    - 本地列表项增加“上传到云端”按钮。

#### [MODIFY] [app-menu-items.tsx](file:///c:/Soft/Dev/Src/github/drawnix/packages/drawnix/src/components/toolbar/app-toolbar/app-menu-items.tsx)
- 更新 `SaveToServerDialog`（保存对话框）：
    - 增加“保存位置”选项（单选：云端 / 本地）。
    - 增加错误处理：如果保存到云端失败，自动询问是否保存到本地。

#### [MODIFY] [drawnix.tsx](file:///c:/Soft/Dev/Src/github/drawnix/packages/drawnix/src/drawnix.tsx)
- 应用启动时初始化 IndexedDB（如需）。

## 验证计划 (Verification Plan)

### 手动验证
1.  **本地保存测试**：
    - 断开网络或停止后端服务。
    - 尝试保存画作，系统应提示错误并建议（或允许）保存到本地。
    - 确认画作已成功保存到 IndexedDB。
2.  **模式切换测试**：
    - 打开“我的画作”对话框，切换“本地”和“云端”标签，确认列表加载正确。
3.  **同步测试**：
    - **云 -> 本地**：在云端列表点击“同步/下载”，切换到本地列表确认存在。
    - **本地 -> 云**：在本地列表点击“上传”，切换到云端列表确认存在。
