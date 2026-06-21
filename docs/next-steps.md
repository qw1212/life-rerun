# Life Rerun：项目完成总结与下一步操作指南

## 当前状态

项目全部 9 个阶段已完成，代码经过完整审查与修复，`typecheck`、`lint`、`build` 均通过。

## 本次审查修复的问题

1. **心理急救判断更可靠**：`needsBreather`、`needsInsightAfterLow`、`calcResilienceRecovery`、`EndingPage` 的低谷/成长统计，不再依赖心理学提示文字中的"不"字匹配，改为使用 `HistoryRecord.eventType` 准确判断。
2. **历史记录字段补全**：`HistoryRecord` 新增 `eventType` 字段，记录每个历史事件的真实类型。
3. **存档加载逻辑修复**：加载存档后不再错误地恢复最后一个历史事件为当前事件，而是清空当前事件，让玩家继续推进人生。
4. **错误提示可恢复**："进入下一年"时会自动清除之前的错误提示。
5. **事件卡片兜底**：当事件没有任何可见选项时显示友好提示，避免空白无响应。
6. **PWA 资源修复**：移除了不存在的 `apple-touch-icon.png` 引用；`vite-plugin-pwa` 禁用 `pwaAssets` 生成，避免部分环境下构建挂起。
7. **部署文档完善**：新增 Windows PowerShell 一键部署脚本 `deploy.ps1`，README 中补充了 Docker Compose 模式下的访问地址。
8. **清理未使用导入**：移除了 `playerStore.ts` 中不再使用的 `getEventById`。
9. **Workspace 构建顺序修复**：根 `package.json` 中调整 `workspaces` 顺序为 `packages/*` 在前、`apps/*` 在后，确保 `shared` 先于 `server`/`web` 构建，避免干净环境下构建失败。
10. **呼吸页定时器泄漏修复**：`BreathingOverlay` 在组件卸载时正确清理 `setTimeout` 链，避免多次打开后残留定时器。

## 已知非阻塞事项

- **TypeScript 版本警告**：当前环境中实际安装的 TypeScript 为 5.9.x，`@typescript-eslint/typescript-estree` 官方支持到 5.5.x，因此 `lint` 会打印版本警告，但检查本身仍可通过。如需消除警告，可将各 `package.json` 中的 `typescript` 锁到 `~5.4.5` 后重新 `npm install`。
- **Vite 缓存异常**：极少数情况下（如依赖或 workspace 产物状态不一致），`vite build` 可能卡在 `transforming...`。解决方法是删除 `apps/web/node_modules/.vite` 后重新构建。部署脚本在构建前已自动清理该缓存。

## 你需要做的下一步

### 1. 配置 AI API Key（必须）

复制环境变量示例文件：

```powershell
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

编辑根目录 `.env`，填入你的 OpenAI 兼容 API 信息：

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
PORT=3001
```

如果你使用国产模型中转（如 DeepSeek、月之暗面、通义千问等），修改 `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 即可。

`apps/web/.env` 已默认使用 `VITE_API_BASE_URL=/api`，配合 Nginx 反向代理访问后端；本地开发时 Vite 也会把 `/api` 代理到 `localhost:3001`。

### 2. 本地试玩（推荐先做）

在 PowerShell 中执行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
npm install
npm run dev
```

然后打开浏览器访问 http://localhost:5173。

> 如果 `npm install` 提示执行策略受限，请使用上面的 `Set-ExecutionPolicy` 命令后再试。

### 3. 生产部署（二选一）

#### 方案 A：Docker Compose 全栈部署（推荐测试/单机）

确保已安装 Docker Desktop（Windows 建议启用 WSL2 后端），然后执行：

```powershell
.\deploy.ps1
```

部署完成后访问 http://localhost。

#### 方案 B：前后端分离部署（推荐正式环境）

- 前端：构建产物 `apps/web/dist/` 部署到 Vercel / Netlify / Cloudflare Pages / 对象存储 CDN
- 后端：使用 `Dockerfile.server` 部署到 Railway / Render / Fly.io / 云服务器
- 前端 `apps/web/.env` 中设置：

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### 4. 上线前建议验证清单

- [ ] AI 叙事接口能正常返回 JSON
- [ ] 连续选择 10 年以上没有报错
- [ ] 低谷事件后会正确触发喘息/顿悟事件
- [ ] 80 岁结局页能正常显示 PERMA 雷达图
- [ ] PWA 在手机浏览器中可"添加到主屏幕"
- [ ] Docker 构建能在目标机器上成功运行
- [ ] 在干净环境（无 `node_modules`、无 `dist`）下 `npm install && npm run build` 能一次成功

### 5. 后续可优化方向

- 接入真实域名与 HTTPS
- 添加用户账号系统与云端存档
- 接入更便宜的国产大模型降低成本
- 收集玩家反馈，持续扩展事件库和 Prompt

## 需要帮助？

如果你遇到 API 连接问题、部署问题、或想增加新功能，随时告诉我，我可以继续帮你处理。
