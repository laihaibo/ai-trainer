# CLAUDE.md

## 项目概述

人工智能训练师（中级）备考 App：Vue 3 + TypeScript + Vite 5 + vue-router 4（hash 模式）纯前端 SPA。无后端，数据持久化在浏览器 localStorage。部署目标：GitHub Pages（`https://laihaibo.github.io/ai-trainer/`）。

## 常用命令

- `npm run dev` — 本地开发（http://localhost:5173）
- `npm run build` — 类型检查（`vue-tsc --noEmit`）+ 生产构建；构建前必须通过 vue-tsc，否则 CI 失败
- `npm run preview` — 预览构建产物（会按 base 路径 `/ai-trainer/` 提供，需访问 `http://localhost:4173/ai-trainer/`）
- 部署：push 到 main 后 `.github/workflows/deploy.yml` 自动构建并发布到 GitHub Pages（需在仓库 Settings → Pages 选择 GitHub Actions source）

## 目录结构

- `src/types.ts` — 全局数据契约（Question / Topic / HandsOnModule / ProgressState 等），所有共享类型只在这里定义，勿在别处重复定义
- `src/data/` — 内容数据（静态 TS，无后端）：
  - `topics.ts` — 10 主题 / 118 张速查卡片，每条标注【题库】/【实训】来源，卡片 id 与题库 topic 字段严格一致。注意：题目已不做分类刷题，topics 仅作为「答后关联知识点卡片」的数据源（Study / WrongBook / FocusAnalysis 使用）
  - `handsOn.ts` — 三大实操模块（Python 编程 / 模型构建 / 数据标注），模型构建含回归分析专题，三模块均含高分答案要点
- 题库：`public/data/questions.json`（去重后 546 题；原文件 options 为字母键对象，`useQuiz.ts` 的 `toStandard()` 归一化为标准 `string[]`，注意契约差异）
- `src/views/` — 页面：HomeView / StudyView（扁平刷题流，无分类）/ WrongBookView / MockExamView / HandsOnView / FocusAnalysisView（重点分析：高频错题 + 高频难题）
- `src/composables/` — `useQuiz`（抽题引擎）、`useProgress`（localStorage 进度 / 已做题集合 / 错题 / 模考 / 难题标记 + 同步文件导入导出）、`usePersistent`
- `src/components/` — `QuestionCard.vue`（题目卡片）、`DataSyncCard.vue`（首页数据同步卡片，导出/导入 JSON）
- `docs/` — 本地学习资料（xlsx / PPT / PDF / zip，**已 gitignore，不提交**；但内容数据源自这里，改动前先核实源文件）

## 约定与陷阱

- **路由必须是 hash 模式**（`createWebHashHistory()`）：GitHub Pages 无法重写路径，web 模式刷新 / 直达会 404。不要改回 `createWebHistory`。
- **vite base 固定为 `/ai-trainer/`，与仓库名一致**：改仓库名需同步修改 `vite.config.ts` 的 `base` 和 `index.html` 里 favicon 的相对路径（`./favicon.svg`）。
- **静态资源请求禁止用绝对路径**：题库通过 `fetch(QUESTIONS_URL)` 加载，`QUESTIONS_URL` 必须用 `import.meta.env.BASE_URL` 拼接（见 `useQuiz.ts`），写成 `/data/questions.json` 会在 GitHub Pages 子路径部署下 404。
- 数据文件保持"概念：解释（【来源】）"格式，新增卡片 / 题目时禁止编造来源。
- localStorage key 前缀 `ai-trainer:`（见 types.ts `ProgressState`），修改契约需兼容旧数据。注意：打卡（checkins）字段已随学习计划功能移除，旧同步文件中的 checkins 会被 sanitizeState 静默丢弃；doneQuestions / hardQuestions 为向后兼容可选字段（旧导出文件缺失时补空数组）。
- **`useProgress()` 的 state 是模块级单例**（`sharedState`）：同页多处调用共享同一 ref，导入/改动处处同步刷新。修改进度状态时**必须整体替换 `state.value`**（不可变更新），否则 usePersistent 的深监听不触发、UI 不同步。
- 与用户沟通使用简体中文；代码风格跟随现有文件（中文注释、TS 严格类型、`<script setup>`）。
