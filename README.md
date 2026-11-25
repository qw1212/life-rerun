# 人生模拟器：美好人生叙事之旅

一款结合 **AI 动态叙事、积极心理学、叙事疗法** 的互动人生模拟游戏。玩家从童年开始，在一次次选择中书写自己独特的人生故事，最终在回望中收获成长与自我接纳。

> **边界声明**：本产品是心理自助与娱乐工具，不具备诊断或治疗功能。如果你正在经历严重心理困扰，请寻求专业帮助。中国心理援助热线：**12356**（以各地公布的服务时间为准）；紧急情况请拨打 **120**。

## 核心特色

- **AI 动态叙事**：根据年龄、主线、情绪、近期经历实时生成故事与选项
- **无 Key 也能玩**：未配置模型或调用失败时，自动降级到 50+ 个人工审核的模板事件
- **事件不重复**：优先抽取未经历过的故事，只有候选池耗尽后才允许重复
- **积极心理学内核**：PERMA 五维、心理韧性、情绪标签、感恩日志贯穿全程；每类选择都会影响 PERMA
- **叙事疗法设计**：低谷后触发顿悟事件，用「外化问题」视角帮助玩家重新理解挫折
- **心理急救机制**：近期低谷密集时强制插入喘息事件，随时可打开呼吸引导
- **人生主线分支**：学术、创业、艺术、社会服务、平凡幸福五条主线，影响事件池与结局
- **天赋与贵人**：特殊天赋真正提高对应事件概率；部分选项可解锁隐藏天赋；导师、挚友会出现在人生关键节点
- **心理评估与分级支持**：自愿填写 PHQ-9 / GAD-7（可随时跳过），高风险时进入危机支持界面
- **完整存档**：自动保存 + 多槽位手动存档 + 人生之书导入 / 导出（JSON）
- **Web PWA**：响应式布局，手机、平板、电脑可用，支持安装与离线打开

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- 后端：Node.js + Express + TypeScript + Zod
- 状态管理：Zustand（localStorage 持久化）
- AI：OpenAI 兼容 API（OpenAI / DeepSeek / 通义千问 / 中转服务等）
- 测试：Node.js Test Runner + tsx
- 部署：Docker + Docker Compose + Nginx

## 项目结构

```
life-rerun/
├── apps/
│   ├── web/                     # 前端 PWA
│   │   └── src/
│   │       ├── pages/           # 欢迎、评估、创建、主游戏、顿悟、结局
│   │       ├── components/      # 事件卡、属性面板、时间轴、存档面板等
│   │       ├── store/           # Zustand 状态与存档读写
│   │       └── utils/           # 数值平衡与 PERMA 推导
│   └── server/                  # 后端 API
│       └── src/
│           ├── routes/          # /api/narrative、请求校验
│           ├── middleware/      # 内存限流
│           └── services/ai/     # Provider、Prompt、缓存、降级、安全过滤
├── packages/
│   └── shared/                  # 共享类型、事件库、天赋、量表、规则
│       └── tests/               # 共享规则单元测试
├── scripts/dev.mjs              # 并行启动前后端开发服务
├── docs/                        # 设计、心理指南、开发计划
├── Dockerfile.server / Dockerfile.web
├── docker-compose.yml / nginx.conf
└── deploy.sh / deploy.ps1
```

## 快速开始

### 1. 环境要求

- Node.js >= 18
- npm >= 9
-（可选）Docker + Docker Compose

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

编辑根目录 `.env`：

```env
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
PORT=3001
```

可选配置：

```env
# 生产环境允许跨域的前端域名，逗号分隔
ALLOWED_ORIGINS=

# 单 IP 每分钟叙事请求上限
RATE_LIMIT_PER_MINUTE=30

# Nginx 反向代理保持 1；后端直接暴露公网时设为 0
TRUST_PROXY=1
```

`OPENAI_API_KEY` 留空或保持占位值时，后端会直接使用模板事件库，游戏依然完整可玩。服务会自动查找仓库根目录或 `apps/server/.env`。

### 4. 启动开发服务

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001
- 健康检查：http://localhost:3001/health

也可以分别启动：

```bash
npm run dev -w apps/server
npm run dev -w apps/web
```

## 常用命令

```bash
npm run dev        # 同时启动前后端
npm run typecheck  # 全工程 TypeScript 检查
npm run lint       # ESLint
npm run test       # 共享规则 + 后端叙事规范化测试
npm run build      # 生产构建（shared → server → web）
```

## API 说明

### `POST /api/narrative`

根据玩家状态生成下一段叙事。请求体为 `PlayerState` 加上可选的 `assessments`：

```json
{
  "name": "小安",
  "age": 20,
  "stage": "youth",
  "attributes": { "intelligence": 60, "physique": 50, "charm": 55, "wealth": 50, "luck": 50, "resilience": 60 },
  "perma": { "positive": 55, "engagement": 50, "relationships": 60, "meaning": 50, "achievement": 55 },
  "resilience": 65,
  "emotionTags": ["平静"],
  "talents": [],
  "theme": "undecided",
  "helpers": [],
  "history": [],
  "gratitudeLog": [],
  "assessments": []
}
```

成功响应：

```json
{
  "story": "……",
  "options": [
    {
      "id": "opt-1",
      "text": "……",
      "type": "growth",
      "effect": { "attributes": { "intelligence": 1 }, "perma": { "engagement": 1 } },
      "preview": "……"
    }
  ],
  "psychologyHint": "……",
  "eventType": "normal",
  "eventTitle": "……",
  "risk": { "level": "none", "reasons": [], "needsSupport": false, "blockNarrative": false }
}
```

- 高风险时返回 `blocked: true`，`story` 与 `options` 为空，客户端转入危机支持界面
- 服务端会重新校验量表答案并重新计分，不采信客户端总分
- 单个 IP 默认每分钟 30 次，可用 `RATE_LIMIT_PER_MINUTE` 调整；超限返回 `429`

### `GET /health`、`GET /api/health`

返回服务状态、AI 是否已配置与服务器时间。Docker 健康检查使用该接口。

## 安全与伦理设计

| 层级 | 触发条件 | 产品行为 |
|---|---|---|
| none | 无风险信号 | 正常叙事 |
| low | 轻度负面文本 / 量表轻度 | 叙事继续，附加温和支持 |
| medium | 中重度量表 / 连续低谷 | 叙事继续，附加求助资源 |
| high | 自伤相关文本 / PHQ-9 第 9 题阳性 / 重度总分 | 硬中断叙事，展示危机资源 |

- AI 输出经过结构校验、风险过滤与数值收敛；非法输出自动降级到模板事件
- AI 不允许生成「低谷」事件，低谷必须来自经过审核、配有成长出口的事件库
- 所有低谷事件在测试中强制校验至少有一个成长 / 接纳 / 关系型出口
- 量表与风险提示只用于自我觉察与安全兜底，不构成诊断
- 危机资源清单上线前需由运营方逐条核实号码与所在地适用性

## 生产部署

### 方案 A：Docker Compose（推荐单机 / 测试环境）

```bash
# Linux / macOS / WSL
bash deploy.sh

# Windows PowerShell
.\deploy.ps1
```

或手动：

```bash
docker-compose up --build -d
```

部署后：前端 http://localhost，API http://localhost/api，健康检查 http://localhost/api/health。

### 方案 B：前后端分离（推荐正式环境）

- 前端：`apps/web` 构建后部署到 Vercel / Netlify / Cloudflare Pages / 静态 CDN
- 后端：用 `Dockerfile.server` 部署到 Railway / Render / Fly.io / 云服务器
- 前端 `apps/web/.env` 设置 `VITE_API_BASE_URL=https://your-api-domain.com/api`
- 后端设置 `ALLOWED_ORIGINS=https://your-frontend-domain.com`

### 构建前端静态资源

```bash
npm run build
```

产物位于 `apps/web/dist/`。

## 自定义与扩展

- 事件库：`packages/shared/src/data/events.ts`（新增事件后请运行 `npm test`，测试会校验 id 唯一、低谷出口等约束）
- 数值平衡：`apps/web/src/utils/balance.ts`
- 界面文案：`packages/shared/src/data/labels.ts`
- 心理量表：`packages/shared/src/data/assessments.ts`
- 危机资源：`packages/shared/src/data/crisis-resources.ts`
- 模型：修改 `.env` 中的 `OPENAI_BASE_URL` 与 `OPENAI_MODEL`
- 新主线：在 `packages/shared/src/types/game.ts` 扩展 `LifeTheme`，并在 `rules/themes.ts` 增加评分权重

## 已知限制

- 限流与 AI 缓存均为单实例内存实现，多实例部署需替换为 Redis 等共享存储
- 存档保存在浏览器 localStorage，清理站点数据会丢失；换设备请使用导出 / 导入
- AI 生成质量取决于所配置模型，建议使用支持 JSON 输出的模型
- 心理量表与危机资源用于自助与安全兜底，不替代专业评估

## License

MIT
