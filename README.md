# AITrainer · 人工智能训练师（中级）备考助手

面向 2026 年 8 月 30 日人工智能训练师（中级）考试的备考学习 App —— 纯前端 SPA，无需后端；学习数据（进度、错题、打卡、模拟考记录）全部保存在浏览器 `localStorage`。

在线地址：[https://laihaibo.github.io/ai-trainer/](https://laihaibo.github.io/ai-trainer/)

## 功能

| 页面 | 说明 |
| --- | --- |
| 首页 | 学习进度总览（题库 / 卡片 / 实操完成度）、今日计划入口、错题复盘入口 |
| 主题学习 | 10 大主题 / 118 张速查卡片 + 600 题主题刷题，答对答错即时反馈 |
| 错题本 | 自动收集答错题目，支持重练与速查卡片 |
| 模拟考 | 100 题 / 60 分钟限时，出分、错题入错题本、历史记录 |
| 实操指南 | Python 编程 / 模型构建 / 数据标注三大实操分步教程（含示例代码与考点） |
| 学习计划 | 5 天冲刺计划（8/25–8/29）：8/28 完成所有练习、8/29 全天复习、8/30 考试，每日任务勾选打卡 |
| 数据同步 | 导出/导入做题记录 JSON（合并或覆盖），多设备 / 多账号间同步进度 |

## 技术栈

- Vue 3（`<script setup>` 组合式 API）+ TypeScript
- Vite 5
- vue-router 4（hash 模式 —— GitHub Pages 无需服务端重写即可刷新 / 直达链接）
- 无 UI 框架，手写 CSS；无后端，localStorage 持久化

## 快速开始

```bash
npm install
npm run dev       # 开发服务器 http://localhost:5173
npm run build     # 类型检查（vue-tsc --noEmit）+ 生产构建到 dist/
npm run preview   # 本地预览构建产物
```

## 项目结构

```
├── src/
│   ├── data/          # 内容数据：topics.ts（速查卡片）、plan.ts（学习计划）、handsOn.ts（实操教程）
│   ├── views/         # 6 个页面：Home / Study / WrongBook / MockExam / HandsOn / Plan
│   ├── components/    # QuestionCard.vue（题目卡片）
│   ├── composables/   # useProgress（进度持久化）/ useQuiz（抽题引擎）/ usePersistent
│   ├── router/        # 路由（hash 模式）
│   └── types.ts       # 全局数据契约（Question / Topic / DailyPlan / ProgressState 等）
├── public/data/       # 题库 questions.json（600 题）
├── docs/              # 本地学习资料（xlsx / PDF / zip，已 gitignore，不参与构建）
└── .github/workflows/ # GitHub Pages 自动部署
```

## 部署到 GitHub Pages

1. 推送到 GitHub（main 分支）
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**
3. 完成上述设置后，每次 push 到 main 都会自动构建并发布（也可在 Actions 页手动 "Run workflow" 触发）
4. 部署成功后站点地址为 `https://laihaibo.github.io/ai-trainer/`

部署流程由 `.github/workflows/deploy.yml` 完成：`npm ci` + `npm run build` → 上传 `dist/` 为 Pages artifact → 自动发布。注意 `vite.config.ts` 中 `base: '/ai-trainer/'` 必须与仓库名一致，若以后改名仓库需同步修改。

## 学习资料说明

考试内容来自本地 `docs/` 资料（题库 xlsx、培训 PPT / PDF）与 `public/data/questions.json`（600 题）。`docs/` 目录仅供本地查阅，已被 `.gitignore` 排除，不参与 git 与 CI 构建。
