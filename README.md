# 人生模拟器：美好人生叙事之旅

一款结合 **AI 动态叙事、积极心理学、叙事疗法** 的互动人生模拟游戏。玩家从童年开始，在一次次选择中书写自己独特的人生故事，最终在回望中收获成长与自我接纳。

> **边界声明**：本产品是心理自助与娱乐工具，不具备诊断或治疗功能。如果你正在经历严重心理困扰，请寻求专业帮助。中国心理危机干预热线：400-161-9995（24 小时）。

## 核心特色

- **AI 动态叙事**：基于玩家状态，大模型实时生成贴合年龄、主线、情绪的人生事件
- **积极心理学内核**：PERMA 五维、心理韧性、情绪标签、感恩日志贯穿全程
- **叙事疗法设计**：低谷后触发喘息/顿悟事件，用「外化问题」视角帮助玩家重新理解挫折
- **人生主线分支**：学术、创业、艺术、社会服务、平凡幸福五条主线，影响事件池与结局
- **贵人系统**：导师、挚友、伙伴在人生关键节点出现，提供支持感
- **Web PWA**：响应式设计，手机、平板、电脑均可使用，支持离线安装

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- 后端：Node.js + Express + TypeScript
- 状态管理：Zustand + localStorage 持久化
- AI：OpenAI 兼容 API（支持 OpenAI、Claude、国产大模型中转等）
- 部署：Docker + Docker Compose + Nginx

## 项目结构

```
life-rerun/
├── apps/
│   ├── web/                 # 前端 PWA 应用
│   └── server/              # 后端 API 服务
├── packages/
│   └── shared/              # 共享类型、事件库、规则
├── docs/
│   ├── design.md            # 游戏机制与心理设计
│   ├── plan.md              # 开发计划与阶段状态
│   └── psychology-guide.md  # 积极心理学与叙事疗法说明
├── Dockerfile.server        # 后端容器镜像
├── Dockerfile.web           # 前端容器镜像
├── docker-compose.yml       # 全栈一键部署
├── nginx.conf               # Nginx 反向代理配置
├── .env.example             # 后端环境变量示例
├── apps/web/.env.example    # 前端环境变量示例
└── README.md
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

编辑 `.env`，填入你的 AI API Key：

```env
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
PORT=3001
```

### 4. 启动开发服务

```bash
# 同时启动前后端
npm run dev
```

或分别启动：

```bash
# 后端
npm run dev -w apps/server

# 前端（新终端）
npm run dev -w apps/web
```> 前端默认访问：http://localhost:5173  
> 后端默认访问：http://localhost:3001  
> 后端健康检查：http://localhost:3001/health
>
> Docker Compose 部署后：前端 http://localhost，API http://localhost/api，健康检查 http://localhost/api/health## 常用命令

```bash
npm run typecheck      # TypeScript 类型检查
npm run lint           # ESLint 代码检查
npm run build          # 生产构建
npm run dev            # 启动开发服务
```

## 生产部署

### 方案 A：Docker Compose 全栈一键部署（推荐单机/测试环境）

Linux / macOS / WSL：

```bash
# 1. 确保 .env 已配置
# 2. 构建并启动
bash deploy.sh
```

Windows PowerShell：

```powershell
# 1. 确保 .env 已配置
# 2. 构建并启动
.\deploy.ps1
```

或手动执行：

```bash
docker-compose up --build -d
```

部署完成后：
- 前端访问 http://localhost
- API 访问 http://localhost/api
- 健康检查 http://localhost/api/health

### 方案 B：前后端分离部署（推荐正式环境）

- 前端：构建后部署到 Vercel / Netlify / Cloudflare Pages / 静态 CDN
- 后端：使用 `Dockerfile.server` 部署到 Railway / Render / Fly.io / 云服务器
- 前端 `apps/web/.env` 设置 `VITE_API_BASE_URL=https://your-api-domain.com/api`

### 构建前端静态资源

```bash
npm run build
```

产物位于 `apps/web/dist/`。

## 自定义与扩展

- 修改事件库：编辑 `packages/shared/src/data/events.ts`
- 调整数值平衡：编辑 `apps/web/src/utils/balance.ts`
- 更换 AI 模型：修改 `.env` 中的 `OPENAI_BASE_URL` 和 `OPENAI_MODEL`
- 添加新主线：在 `packages/shared/src/types/game.ts` 扩展 `LifeTheme`，并在 `packages/shared/src/rules/themes.ts` 增加评分规则

## 开发计划

详见 [docs/plan.md](./docs/plan.md)。

## 伦理与安全

- 所有低谷事件均配置成长/希望型选项
- AI 提示词内置安全约束，禁止生成自伤、暴力、歧视等内容
- 输入/输出安全检查，低情绪内容自动附加求助信息
- 结局强调多元价值，避免单一成功标准

## License

MIT
