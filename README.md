# AITrainer · 人工智能训练师（中级）备考助手

面向 2026 年 8 月 30 日人工智能训练师（中级）考试的备考学习 App —— 纯前端 SPA，无需后端；学习数据（进度、已做题记录、错题、难题标记、模拟考记录）全部保存在浏览器 `localStorage`。

在线地址：[https://laihaibo.github.io/ai-trainer/](https://laihaibo.github.io/ai-trainer/)

## 功能

| 页面 | 说明 |
| --- | --- |
| 首页 | 总体进度（已做题覆盖题库 / 错题 / 难题）、快捷入口 |
| 刷题 | 不分主题的扁平刷题流：连续刷、只刷没做过的题、乱序、随机 20 题；答后即时解析 + 关联知识点卡片，每题标注「已做过」 |
| 错题本 | 自动收集答错题目，支持重练（答对移除）；「难题」页签管理手动标记的难题并重练 |
| 重点分析 | 高频错题（按错误次数降序）与高频难点（难题标记）实时汇总，展开查看完整答案解析与关联知识点卡片 |
| 模拟考 | 100 题 / 60 分钟限时，出分、错题入错题本、历史记录 |
| 实操指引 | Python 编程 / 模型构建 / 数据标注三大实操分步教程（示例代码、回归分析专题、如何生成高分答案、考点易错点） |
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
│   ├── data/          # 内容数据：topics.ts（知识点卡片）、handsOn.ts（实操教程）
│   ├── views/         # 6 个页面：Home / Study / WrongBook / FocusAnalysis / MockExam / HandsOn
│   ├── components/    # QuestionCard.vue（题目卡片）
│   ├── composables/   # useProgress（进度持久化）/ useQuiz（抽题引擎）/ usePersistent
│   ├── router/        # 路由（hash 模式）
│   └── types.ts       # 全局数据契约（Question / Topic / ProgressState 等）
├── public/data/       # 题库 questions.json（546 题）
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

考试内容来自本地 `docs/` 资料（题库 xlsx、培训 PPT / PDF）与 `public/data/questions.json`（546 题）。`docs/` 目录仅供本地查阅，已被 `.gitignore` 排除，不参与 git 与 CI 构建。
