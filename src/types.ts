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
  /** 回归分析专题（仅涉回归模块提供，title + 要点列表） */
  regression?: { title: string; points: string[] }[]
  /** 如何生成高分答案（阅卷得分动作清单，可选） */
  highScoreGuide?: string[]
}

/* ==================== 实操练习栏目（/practice）数据契约 ==================== */

/** 模型构建实操：一张完成截图及其逐条对照分析 */
export interface PracticeShot {
  /** 图片文件名（位于 public/images/practice/ 下，经 BASE_URL 拼接引用） */
  src: string
  /** 截图标题（展示的是什么操作/结果） */
  caption: string
  /** 逐条对照 + 指标讲解（题目要求做了什么 → 截图中是否体现 → 关键指标怎么读 → 扣分点） */
  analysis: string[]
}

/** 模型构建实操：一道回归题（线性/逻辑/泊松） */
export interface PracticeRegressionTask {
  id: string
  /** 回归类型（如「线性回归」） */
  kind: string
  /** 数据集与工具（如「JASP · test1.csv」） */
  dataset: string
  /** 原题出处（docs 本地路径，仅供溯源，不随站点部署） */
  source: string
  /** 题目要求（按①②小问拆条） */
  requirements: string[]
  /** 完成截图与逐条对照分析 */
  shots: PracticeShot[]
  /** 总体研判（一句话结论） */
  verdict: string
}

/** 数据标注实操：data.yaml 教程页 */
export interface PracticeYamlGuide {
  title: string
  /** 原题出处（docs 本地路径） */
  source: string
  /** 创建与规则步骤 */
  steps: string[]
  /** data.yaml 标准示例（fenced code 或纯文本） */
  sample: string
  /** 逐字段讲解 */
  fields: { name: string; note: string }[]
  /** 注意事项（易扣分点） */
  cautions: string[]
}

/** Python 编程实操：一个填空空位 */
export interface PracticePythonBlank {
  /** 空位编号（如「1.1」） */
  no: string
  /** 原卷中的题目行（含下划线，原样展示） */
  line: string
  /** 揭示的参考答案 */
  answer: string
  /** 一句讲解（为什么这么填） */
  note: string
}

/** Python 编程实操：一套填空真题 */
export interface PracticePythonTask {
  id: string
  /** 套题名（如「test1 · 财政数据集」） */
  name: string
  /** 题意场景 */
  scenario: string
  /** 原题出处（docs 本地路径） */
  source: string
  /** 题目要求的逐条解读（去 # 行号、补哪几处空） */
  steps: { title: string; detail: string }[]
  /** 原卷代码（空位原样保留） */
  lines: string[]
  /** 各空位参考答案（点击揭示） */
  blanks: PracticePythonBlank[]
  /** 补全后的完整参考代码 */
  fullAnswer: string
}

/** 实操练习：高频考点/难点卡片 */
export interface PracticeExamCard {
  title: string
  points: string[]
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
  /** 累计作答总题数（含同一题重复作答） */
  doneCount: number
  /** 累计答对题数 */
  correctCount: number
  /** 已做过的题目 id 集合（去重，按首次作答先后排序） */
  doneQuestions: number[]
  /** 错题本：题目 id -> 记录（id 去重，upsert 自增） */
  wrongs: Record<number, WrongQuestionRecord>
  /** 模拟考历史（最新在前） */
  mockRecords: MockRecord[]
  /** 难题标记：题目 id 集合（手动标记，按标记先后排序） */
  hardQuestions: number[]
}

/** 做题记录同步文件（导出/导入 JSON，用于多设备同步；version 供将来格式升级校验） */
export interface ProgressSyncFile {
  /** 固定标识，防止误导其他应用 JSON */
  app: 'aitrainer'
  /** 格式版本（当前：1） */
  version: 1
  /** 导出时间（ISO 字符串，仅元信息） */
  exportedAt: string
  /** 进度快照 */
  data: ProgressState
}
