/**
 * 5 天冲刺学习计划（2026-08-25 至 2026-08-29，8/30 为考试日）。
 *
 * 用户要求：8/28 完成所有练习（600 题全刷 + 3 次模拟考 + 三大实操），8/29 全天复习。
 * - 每日理论 2.5-4h + 实操 ~1.5h + 收尾 ~1h（含模拟考），总量 4-6h
 * - 题量取自 worker-2 实际主题分布（600 题）：ai-basics 128 / ml-basics 92 / dl-nn 112 /
 *   model-eval 21 / cv-vision 72 / data-labeling 49 / ai-ethics 64 / ai-apps 26 / nlp 19 / python-prog 17
 * - 模拟考任务对应 MockExamView 的默认配置：100 题 / 60 分钟限时
 *
 * 说明：Day 5 为全天复习日，无新增主题，focusTopics 为空数组；
 * tasks.id 全局唯一（d1t1..d5t5），可安全用于 localStorage 打卡存储。
 */
import type { DailyPlan } from '../types'

export const DAILY_PLANS: DailyPlan[] = [
  {
    day: 1,
    date: '2026-08-25',
    title: '基础主题刷题 + Python 教程速过',
    focusTopics: ['ai-basics', 'ml-basics', 'python-prog'],
    tasks: [
      { id: 'd1t1', label: '主题刷题：ai-basics 人工智能基础与发展史（128 题，含错题标记）' },
      { id: 'd1t2', label: '主题刷题：ml-basics 机器学习基础（92 题，ML 概念先读卡片再刷题）' },
      { id: 'd1t3', label: 'Python 编程分步教程速过 + 代码练习（约 60 min）' },
      { id: 'd1t4', label: '错题复盘 + 速查卡片扫读：ai-basics / ml-basics / python-prog（约 30 min）' },
    ],
  },
  {
    day: 2,
    date: '2026-08-26',
    title: '深度学习与模型评估 + 模型构建实操 + 模拟考①',
    focusTopics: ['dl-nn', 'model-eval'],
    tasks: [
      { id: 'd2t1', label: '主题刷题：dl-nn 神经网络与深度学习（112 题，先读概念卡片再刷）' },
      { id: 'd2t2', label: '主题刷题：model-eval 模型评估（21 题）' },
      { id: 'd2t3', label: '模型构建实操：逻辑回归流程 + 评价指标全流程（约 90 min）' },
      { id: 'd2t4', label: '错题复盘 + 卡片扫读：dl-nn / model-eval（约 30 min）' },
      { id: 'd2t5', label: '模拟考 #1：100 题 / 60 min 限时 + 复盘入错题本（约 90 min）' },
    ],
  },
  {
    day: 3,
    date: '2026-08-27',
    title: '计算机视觉与数据标注 + 数据标注实操 + 模拟考②',
    focusTopics: ['cv-vision', 'data-labeling'],
    tasks: [
      { id: 'd3t1', label: '主题刷题：cv-vision 计算机视觉与图像（72 题）' },
      { id: 'd3t2', label: '主题刷题：data-labeling 数据与标注（49 题）' },
      { id: 'd3t3', label: '数据标注实操：labelImg 矩形框标注 + YOLO data.yaml 配置（约 90 min）' },
      { id: 'd3t4', label: '错题复盘 + 卡片扫读：cv-vision / data-labeling（约 30 min）' },
      { id: 'd3t5', label: '模拟考 #2：100 题 / 60 min 限时 + 复盘入错题本（约 90 min）' },
    ],
  },
  {
    day: 4,
    date: '2026-08-28',
    title: '全部练习收尾日：四主题刷题 + 模拟考③ + 错题清零',
    focusTopics: ['ai-ethics', 'ai-apps', 'nlp', 'python-prog'],
    tasks: [
      { id: 'd4t1', label: '主题刷题：ai-ethics（64 题）+ ai-apps（26 题）' },
      { id: 'd4t2', label: '主题刷题：nlp（19 题）+ python-prog（17 题）' },
      { id: 'd4t3', label: '模拟考 #3：100 题 / 60 min 限时冲刺（约 90 min）' },
      { id: 'd4t4', label: '错题清零：错题本重练至全部移除（约 60 min）——到此全部练习完成 ✓' },
    ],
  },
  {
    day: 5,
    date: '2026-08-29',
    title: '全天复习日：错题复盘 + 卡片二刷 + 实操快走',
    focusTopics: [],
    tasks: [
      { id: 'd5t1', label: '错题全量复盘：错题本二次重练 + 薄弱主题各刷 1 轮（约 120 min）' },
      { id: 'd5t2', label: '速查卡片二刷：10 个主题卡片全部过一遍（约 45 min）' },
      { id: 'd5t3', label: '实操按考试节奏快走一遍：模型构建 / 数据标注 / Python（约 60 min）' },
      { id: 'd5t4', label: '考前清单：证件与考场确认、查漏补缺（约 30 min）' },
    ],
  },
]
