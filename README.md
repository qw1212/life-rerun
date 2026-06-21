# 人生模拟器：美好人生叙事之旅

一款结合 **AI 动态叙事、积极心理学、叙事疗法** 的互动人生模拟游戏。

> **边界声明**：本产品是心理自助与娱乐工具，不具备诊断或治疗功能。严重心理问题需寻求专业帮助。

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Node.js + Express + TypeScript
- 状态：Zustand + localStorage 持久化
- AI：OpenAI / Claude / 国产大模型 API
- 数据库：SQLite

## 项目结构

```
life-rerun/
├── apps/
│   ├── web/          # 前端应用
│   └── server/       # 后端服务
├── docs/             # 设计文档
│   ├── design.md     # 游戏机制与心理设计
│   ├── plan.md       # 开发计划
│   └── psychology-guide.md
├── .env.example      # 环境变量示例
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example apps/server/.env
cp .env.example apps/web/.env
```

编辑两个 `.env` 文件，填入你的 AI API Key。

### 3. 启动开发服务

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
```

前端默认访问：http://localhost:5173  
后端默认访问：http://localhost:3001

## 开发计划

详见 [docs/plan.md](./docs/plan.md)。

## License

MIT
