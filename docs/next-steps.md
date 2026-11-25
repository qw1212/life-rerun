# Life Rerun：项目状态与使用指南

## 当前状态

全部 10 个阶段完成，代码通过 `typecheck`、`lint`、`test`、`build`。本轮重点补齐了叙事节奏、存档闭环、AI 输出健壮性与部署细节。

## 本轮完成的内容

### 玩法与叙事

1. **事件去重**：模板事件优先抽取未经历过的故事，候选池耗尽后才允许重复。
2. **心理急救可达**：原先「连续 3 个低谷」的条件永远不可能成立（低谷后必插顿悟），现改为近期低谷密集即触发喘息；同时把顿悟/喘息从普通事件池中剔除，只在低谷后的急救链路出现。
3. **降级不丢语义**：AI 失败时返回的模板事件会带上原始类型、标题与 PERMA 倾向，低谷/顿悟/喘息节奏不会被打乱。
4. **PERMA 生效**：即使不接 AI，选择类型也会推导 PERMA 变化，结局雷达图不再恒为 50。
5. **天赋真正解锁**：特殊天赋的 `unlockEventIds` 提高对应事件权重；选项的 `unlockTalent` 会加入角色并应用加成。
6. **高风险后可继续**：已阅读同一组风险提示并确认继续时，用人工审核过的模板事件继续，不再卡在空白界面。

### 存档与状态

7. **多槽位存档**：保存、读取、删除，欢迎页可直接读取最近存档续玩。
8. **人生之书导入/导出**：导出包含版本、玩家、量表与保留品质；导入兼容旧版纯角色存档。
9. **刷新不丢状态**：持久化当前事件、结局标记与保留品质；80 岁刷新仍进入结局页。
10. **随机 id 兼容**：非安全上下文（局域网 HTTP）下 `crypto.randomUUID` 不可用时自动降级。

### 后端与安全

11. **请求校验**：Zod 校验字段与类型，限制历史/文本长度；量表答案服务端重新计分。
12. **AI 输出规范化**：清洗 HTML、收敛数值到 ±3/±5、替换重复选项 id、回退非法类型、剔除 `theme`/`unlockTalent`/`addHelper`、最多 4 个选项。
13. **兼容性重试**：接口不支持 `response_format` 时（400）自动去掉该参数重试一次。
14. **限流与缓存**：单 IP 每分钟 30 次；AI 缓存 key 含玩家名与近期事件，修复数组原地排序与内存无上限问题。
15. **服务健壮性**：`/api/health`、结构化 404、JSON 解析错误处理、优雅退出、静态资源缺失返回 404。

### 界面与工程

16. **文案统一**：属性、PERMA、事件类型、选项类型集中到共享 labels，修复顿悟页显示英文选项类型、结局页属性改名等问题。
17. **存档面板**：新增存档/读档/删除/导入/导出界面，操作后有提示。
18. **可访问性**：呼吸引导支持 Esc 关闭与 dialog 语义，按钮补充焦点样式与 aria 状态。
19. **测试**：共享规则 12 项、后端 8 项，覆盖事件库完整性、量表格、风险分级、事件去重、普通事件池约束、输出规范化等。
20. **部署**：Nginx gzip、静态资源缓存与安全响应头；Docker 健康检查；README 补齐 API 与限制说明。

## 你需要做的下一步

### 1. 配置环境变量

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env
```

编辑 `.env`：

```env
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
PORT=3001
```

未配置 Key 时会使用模板事件库，仍可完整试玩。

### 2. 本地运行

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
npm install
npm run typecheck
npm run lint
npm run test
npm run dev
```

打开 http://localhost:5173。

### 3. 生产部署

- 单机：`.\deploy.ps1` 或 `bash deploy.sh`
- 分离部署：前端构建产物部署 CDN，后端使用 `Dockerfile.server`，并设置 `ALLOWED_ORIGINS`

## 上线前验证清单

- [ ] `npm run test` 全部通过
- [ ] 未配置 Key 时，连续游玩 80 年不出现空白事件
- [ ] 配置 Key 后，AI 叙事返回结构化 JSON，非法输出会降级
- [ ] 连续经历低谷后会出现喘息事件
- [ ] 高风险量表结果会进入危机支持界面，确认后可继续
- [ ] 存档保存/读取/删除正常，导出后重新导入可恢复
- [ ] 80 岁结局页显示 PERMA 雷达图、人生之书与品质选择
- [ ] 手机浏览器可「添加到主屏幕」，离线打开能进入应用外壳
- [ ] `curl http://localhost/api/health` 返回 `status: ok`

## 已知非阻塞事项

- TypeScript 实际安装版本可能高于 `@typescript-eslint` 官方支持范围，`lint` 会打印版本警告但检查通过。
- 极端情况下 `vite build` 可能卡在 `transforming`，删除 `apps/web/node_modules/.vite` 后重试。
- 限流与缓存为单实例内存实现；多实例部署需要 Redis。

## 后续方向

- 账号系统与云端存档
- 多语言与语音朗读
- 更细的心理测评与个性化推荐
- 与专业心理咨询平台的转介合作
