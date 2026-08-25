/**
 * 全局数据契约 —— 所有模块共享的类型定义。
 * 其他 worker 请从这里 import，勿在别处重复定义同名接口。
 */

/** 单选题（题库数据源：public/data/questions.json） */
export interface Question {
  /** 题目 id（沿用原题库序号） */
  id: number
  /** 所属主题 id（见 Topic.id） */
  topic: string
  /** 题干 */
  q: string
  /** 选项列表（仅保留有值选项） */
  options: string[]
  /** 正确答案（原字母，如 "A"） */
  answer: string
  /** 答案解析（零编造模板生成） */
  explanation: string
}

/** 主题 / 章节（来源：src/data/topics.ts） */
export interface Topic {
  id: string
  name: string
  /** 主题代表色（hex，用于徽标/卡片点缀） */
  color: string
  /** 速查卡片：概念层教学（每条标注来源） */
  cards: string[]
}

/** 每日学习计划（来源：src/data/plan.ts） */
export interface DailyPlan {
  /** 第几天（1-6；30 日考试日另记） */
  day: number
  /** 日期，格式 "2026-08-24" 之类的 YYYY-MM-DD */
  date: string
  /** 当日标题 */
  title: string
  /** 当天聚焦主题 id 列表 */
  focusTopics: string[]
  /** 学习任务（可勾选打卡） */
  tasks: { id: string; label: string }[]
}

/** 实操指引模块（来源：src/data/handsOn.ts） */
export interface HandsOnModule {
  id: string
  name: string
  /** 考题立意 */
  scenario: string
  /** 考查目的 */
  purpose: string
  /** 分步操作（每条关键步骤标注 docs 来源） */
  steps: { title: string; detail: string; source: string }[]
  /** 示例代码（基于原 code.py 精简注释版） */
  code: string
  /** 考点与易错点 */
  pitfalls: string[]
}

/** 模拟考配置 */
export interface MockConfig {
  /** 题量（默认 100） */
  count: number
  /** 时长（分钟，默认 60） */
  minutes: number
}

/** 错题本单条记录（useProgress 持久化，按题目 id 去重） */
export interface WrongQuestionRecord {
  /** 题目 id（对应 Question.id） */
  id: number
  /** 累计答错次数 */
  wrongCount: number
  /** 最近一次答错时间（ISO 字符串） */
  lastWrongAt: string
}

/** 模拟考历史一条记录（useProgress 持久化，最新在前） */
export interface MockRecord {
  /** 作答日期，格式 "YYYY-MM-DD" */
  date: string
  /** 总题数 */
  count: number
  /** 答对题数 */
  correct: number
  /** 实际用时（分钟，向上取整，至少 1） */
  minutes: number
  /** 开考时间戳（epoch ms） */
  timestamp: number
  /** 本次错题 id 清单（供复盘/首页展示） */
  wrongIds: number[]
}

/** 学习进度总状态（localStorage key：ai-trainer:progress） */
export interface ProgressState {
  /** 累计作答总题数 */
  doneCount: number
  /** 累计答对题数 */
  correctCount: number
  /** 错题本：题目 id -> 记录（id 去重，upsert 自增） */
  wrongs: Record<number, WrongQuestionRecord>
  /** 计划打卡：dateKey（"YYYY-MM-DD"）-> 已勾选 task id 列表 */
  checkins: Record<string, string[]>
  /** 模拟考历史（最新在前） */
  mockRecords: MockRecord[]
}
