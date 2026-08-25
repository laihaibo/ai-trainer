/**
 * 抽题引擎（数据源：public/data/questions.json，经 fetch 加载 + promise 单例缓存）。
 *
 * 数据契约适配说明：
 * - worker-2 导出的 questions.json 中 options 为「字母键对象」（如 {"A":"…","B":"…"}），
 *   与全局 types.ts 的 Question.options: string[] 不一致。此处用 RawQuestion 承接实际
 *   格式，toStandard() 按字母序（A,B,C…）归一为标准 Question；选项索引与字母一一对应
 *   （index 0 ↔ A、1 ↔ B…），answer 字母可直接换算为索引 charCodeAt(0) - 65。
 *
 * 视图侧通过 loadQuestions() 的 reject 感知题库缺失/加载失败（展示提示即可）。
 */
import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'
import { usePersistent } from './usePersistent'
import { useProgress } from './useProgress'
import type { MockConfig, Question } from '../types'

// 用 BASE_URL 拼接以兼容 GitHub Pages 子路径部署（dev 下 Vite 会剥离 base 前缀）
const QUESTIONS_URL = `${import.meta.env.BASE_URL}data/questions.json`

/** questions.json 实际行格式（options 为字母键对象，未归一化态） */
interface RawQuestion {
  id: number
  topic: string
  q: string
  options: Record<string, string> | string[]
  answer: string
  explanation: string
}

function toStandard(raw: RawQuestion): Question {
  let options: string[]
  if (Array.isArray(raw.options)) {
    options = raw.options
  } else {
    // 回调内 TS 不保留联合收窄，先提为 const
    const byLetter = raw.options
    options = Object.keys(byLetter)
      .sort()
      .map((letter) => byLetter[letter])
  }
  return {
    id: raw.id,
    topic: raw.topic,
    q: raw.q,
    options,
    answer: raw.answer,
    explanation: raw.explanation,
  }
}

/** 题库加载缓存（promise 单例；失败后置空以便下次重试） */
let pending: Promise<Question[]> | null = null

export function loadQuestions(): Promise<Question[]> {
  pending ??= fetch(QUESTIONS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`题库加载失败：HTTP ${res.status}`)
      return res.json() as Promise<RawQuestion[]>
    })
    .then((raw) => raw.map(toStandard))
    .catch((err: unknown) => {
      pending = null
      throw err
    })
  return pending
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 按主题取题（默认原序；shuffle: true 乱序） */
export async function fromTopic(
  topicId: string,
  options: { shuffle?: boolean } = {},
): Promise<Question[]> {
  const all = await loadQuestions()
  const list = all.filter((q) => q.topic === topicId)
  return options.shuffle ? shuffleArr(list) : list
}

/** 全题库随机抽 n 题（不足 n 则返回全部） */
export async function randomQuestions(n: number): Promise<Question[]> {
  const all = await loadQuestions()
  return shuffleArr(all).slice(0, n)
}

/** 答对判定：用户选项索引与答案字母（A=0, B=1…）比较 */
export function isCorrect(question: Question, selectedIndex: number | undefined): boolean {
  if (selectedIndex === undefined || selectedIndex < 0) return false
  return selectedIndex === question.answer.charCodeAt(0) - 65
}

// ---------------------------------------------------------------------------
// 模拟考会话
// ---------------------------------------------------------------------------

/** 模拟考一次会话（localStorage key：ai-trainer:mock-session，刷新可恢复） */
export interface MockSession {
  config: MockConfig
  questions: Question[]
  /** 开考时间戳（epoch ms） */
  startedAt: number
  /** 截止时间戳（epoch ms） */
  deadline: number
  /** 作答：questionId -> 选项索引 */
  answers: Record<number, number>
  /** 是否已交卷 */
  submitted: boolean
  /** 交卷结果（submitted 后有值） */
  result?: MockExamResult
}

/** 模拟考交卷结果 */
export interface MockExamResult {
  total: number
  correct: number
  incorrect: number
  /** 实际用时（分钟，向上取整，至少 1） */
  minutes: number
  /** 交卷日期，格式 "YYYY-MM-DD" */
  date: string
}

/** 创建一次模拟考试：随机抽题 + 设定 deadline（供 useMockExam/外部直接使用） */
export async function createMock(config: MockConfig): Promise<MockSession> {
  const questions = await randomQuestions(config.count)
  const startedAt = Date.now()
  return {
    config,
    questions,
    startedAt,
    deadline: startedAt + config.minutes * 60_000,
    answers: {},
    submitted: false,
  }
}

function toDateKey(ts: number): string {
  const d = new Date(ts)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export interface UseMockExamOptions {
  /** 到时自动交卷后的回调（如刷新恢复超时交卷） */
  onTimeout?: () => void
}

export interface UseMockExam {
  /** 当前会话（null = 未开考） */
  session: Ref<MockSession | null>
  /** 剩余秒数（已交卷/未开考为 0） */
  remainingSeconds: Ref<number>
  /** 计时剩余（mm:ss） */
  remainingLabel: Ref<string>
  /** 是否处在考试中 */
  running: Ref<boolean>
  /** 开考（新会话；题库加载失败会 reject） */
  start: (config: MockConfig) => Promise<void>
  /** 作答一题 */
  answer: (questionId: number, optionIndex: number) => void
  /** 手动交卷（已交卷则空操作） */
  submit: () => boolean
}

/**
 * 模拟考组合式：
 * - 会话整体持久化到 localStorage（含 deadline/answers），刷新后自动恢复；
 * - 恢复时若已超时且未交卷，自动交卷并触发 onTimeout 回调；
 * - 交卷时把每题结果写入刷题统计（答错自动入错题本）并追加模拟考历史。
 */
export function useMockExam(options: UseMockExamOptions = {}): UseMockExam {
  const progress = useProgress()
  const sessionRef = usePersistent<MockSession | null>('ai-trainer:mock-session', null)
  const now = ref(Date.now())

  let timer: number | undefined
  const stopTimer = () => {
    if (timer !== undefined) {
      window.clearInterval(timer)
      timer = undefined
    }
  }

  const remainingSeconds = ref(0)
  const remainingLabel = ref('00:00')
  const running = ref(false)

  function tick(): void {
    const s = sessionRef.value
    if (!s || s.submitted) {
      remainingSeconds.value = 0
      remainingLabel.value = '00:00'
      running.value = false
      stopTimer()
      return
    }
    running.value = true
    const secLeft = Math.max(0, Math.floor((s.deadline - Date.now()) / 1000))
    remainingSeconds.value = secLeft
    const mm = String(Math.floor(secLeft / 60)).padStart(2, '0')
    const ss = String(secLeft % 60).padStart(2, '0')
    remainingLabel.value = `${mm}:${ss}`
    if (secLeft <= 0) submit()
  }

  function submit(): boolean {
    const s = sessionRef.value
    if (!s || s.submitted) return false
    const correct = s.questions.reduce(
      (acc, q) => acc + (isCorrect(q, s.answers[q.id]) ? 1 : 0),
      0,
    )
    const wrongIds = s.questions
      .filter((q) => !isCorrect(q, s.answers[q.id]))
      .map((q) => q.id)
    // 每题记入刷题统计：模拟考错题自然进入错题本（供复盘重练）
    for (const q of s.questions) {
      progress.recordAnswer(q.id, isCorrect(q, s.answers[q.id]))
    }
    const minutes = Math.max(1, Math.ceil((Date.now() - s.startedAt) / 60_000))
    const result: MockExamResult = {
      total: s.questions.length,
      correct,
      incorrect: s.questions.length - correct,
      minutes,
      date: toDateKey(s.startedAt),
    }
    progress.recordMock({
      date: result.date,
      count: result.total,
      correct: result.correct,
      minutes: result.minutes,
      timestamp: s.startedAt,
      wrongIds,
    })
    sessionRef.value = { ...s, submitted: true, result }
    running.value = false
    stopTimer()
    return true
  }

  async function start(config: MockConfig): Promise<void> {
    const session = await createMock(config)
    sessionRef.value = session
    now.value = Date.now()
    startTimer()
  }

  function answer(questionId: number, optionIndex: number): void {
    const s = sessionRef.value
    if (!s || s.submitted) return
    s.answers[questionId] = optionIndex
    sessionRef.value = { ...s } // 引用替换，确保深监听写回 localStorage
  }

  function startTimer(): void {
    stopTimer()
    timer = window.setInterval(tick, 1000)
    tick()
  }

  // 挂载即恢复：若存在会话且已超时 → 自动交卷（并触发 onTimeout 回调）
  const initial = sessionRef.value
  if (initial && !initial.submitted) {
    if (Date.now() >= initial.deadline) {
      submit()
      options.onTimeout?.()
    } else {
      startTimer()
    }
  }

  onUnmounted(() => stopTimer())

  return { session: sessionRef, remainingSeconds, remainingLabel, running, start, answer, submit }
}

// 保留导入以支持将来在 setup 外读取会话
export type { Ref }
