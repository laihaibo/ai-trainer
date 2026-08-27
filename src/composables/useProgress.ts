/**
 * 学习进度核心状态（同一页内单例调用，取值用 useProgress() 工厂）。
 *
 * 持久化：localStorage key "ai-trainer:progress"（复用 usePersistent，深监听自动写回）。
 * 覆盖：刷题统计（含已做题集合）、错题本（答错自动 upsert）、模拟考历史、难题标记。
 *
 * 更新策略：对象删除/数组变化统一走「不可变更新」（新引用替换），
 * 保证 usePersistent 的 deep watch 必定触发，避免依赖 delete 语义的边界行为。
 */
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { usePersistent } from './usePersistent'
import type {
  MockRecord,
  ProgressState,
  ProgressSyncFile,
  WrongQuestionRecord,
} from '../types'

const STORAGE_KEY = 'ai-trainer:progress'

const DEFAULT_STATE: ProgressState = {
  doneCount: 0,
  correctCount: 0,
  doneQuestions: [],
  wrongs: {},
  mockRecords: [],
  hardQuestions: [],
}

export interface UseProgress {
  /** 原始状态 ref（页面按需读） */
  state: ReturnType<typeof usePersistent<ProgressState>>
  /** 累计作答题数（含重复作答） */
  doneCount: ComputedRef<number>
  /** 累计答对题数 */
  correctCount: ComputedRef<number>
  /** 已做过的题目 id（按首次作答先后排序，去重） */
  doneQuestions: ComputedRef<number[]>
  /** 已做题目的去重数量（题库覆盖率口径） */
  uniqueDoneCount: ComputedRef<number>
  /** 某题是否已做过 */
  isDone: (id: number) => boolean
  /** 错题本（按 wrongCount 降序、同错次按最近错误在前） */
  wrongQuestions: ComputedRef<WrongQuestionRecord[]>
  /** 错题总条数 */
  wrongCount: ComputedRef<number>
  /** 刷题正确率（未刷过为 null） */
  accuracy: ComputedRef<number | null>
  /** 模拟考历史（最新在前） */
  mockRecords: ComputedRef<MockRecord[]>
  /** 记录一次作答：答对计入 correctCount；答错自动 upsert 进错题本；题目 id 记入已做集合 */
  recordAnswer: (id: number, correct: boolean) => void
  /** 从错题本移除一题（已掌握） */
  markLearned: (id: number) => void
  /** 清空错题本 */
  resetWrongs: () => void
  /** 追加一条模拟考记录（最新在前） */
  recordMock: (record: MockRecord) => void
  /** 难题标记列表（按标记先后） */
  hardQuestions: ComputedRef<number[]>
  /** 难题数量 */
  hardCount: ComputedRef<number>
  /** 某题是否已标记为难题 */
  isHard: (id: number) => boolean
  /** 切换某题的难题标记 */
  toggleHard: (id: number) => void
  /** 生成同步文件（导出 JSON 用，包含当前进度快照） */
  buildSyncFile: () => ProgressSyncFile
  /**
   * 应用同步文件（导入用）。
   * mode='merge' 与本地数据合并（累计计数取大、错题按 id 合并、已做题/难题并集、模考按时间戳去重）；
   * mode='replace' 完全覆盖本地（覆盖前由调用方确认）。
   * 返回应用后的统计摘要（供 UI 提示）。
   */
  applySyncFile: (file: ProgressSyncFile, mode: 'merge' | 'replace') => SyncResult
}

/** 导入后的统计摘要（UI 提示用） */
export interface SyncResult {
  doneCount: number
  correctCount: number
  /** 已做题去重数量 */
  uniqueDone: number
  wrongCount: number
  mockCount: number
}

/** 模块级单例 state：全站共享同一进度 ref（页面可多次调用 useProgress 并实时同步） */
let sharedState: ReturnType<typeof usePersistent<ProgressState>> | null = null

export function useProgress(): UseProgress {
  const state = (sharedState ??= usePersistent<ProgressState>(STORAGE_KEY, DEFAULT_STATE))
  // 旧版本数据迁移：localStorage / 旧同步文件中缺失 hardQuestions、doneQuestions 字段时补齐
  if (!Array.isArray(state.value.hardQuestions) || !Array.isArray(state.value.doneQuestions)) {
    state.value = {
      ...state.value,
      hardQuestions: Array.isArray(state.value.hardQuestions) ? state.value.hardQuestions : [],
      doneQuestions: Array.isArray(state.value.doneQuestions) ? state.value.doneQuestions : [],
    }
  }

  function recordAnswer(id: number, correct: boolean): void {
    const s = state.value
    if (!correct) {
      const prev = s.wrongs[id]
      s.wrongs[id] = {
        id,
        wrongCount: (prev?.wrongCount ?? 0) + 1,
        lastWrongAt: new Date().toISOString(),
      }
    }
    // 已做题集合追加（去重），与其余统计合并到一次赋值，避免触发两次写回
    const nextDone = s.doneQuestions.includes(id) ? s.doneQuestions : [...s.doneQuestions, id]
    state.value = {
      ...s,
      doneCount: s.doneCount + 1,
      correctCount: s.correctCount + (correct ? 1 : 0),
      doneQuestions: nextDone,
    }
  }

  function markLearned(id: number): void {
    const s = state.value
    if (!(id in s.wrongs)) return
    const next: Record<number, WrongQuestionRecord> = {}
    for (const key of Object.keys(s.wrongs)) {
      const rec = s.wrongs[Number(key)]
      if (rec.id !== id) next[rec.id] = rec
    }
    state.value = { ...s, wrongs: next }
  }

  function resetWrongs(): void {
    state.value = { ...state.value, wrongs: {} }
  }

  function recordMock(record: MockRecord): void {
    state.value = {
      ...state.value,
      mockRecords: [record, ...state.value.mockRecords],
    }
  }

  function toggleHard(id: number): void {
    const s = state.value
    state.value = s.hardQuestions.includes(id)
      ? { ...s, hardQuestions: s.hardQuestions.filter((q) => q !== id) }
      : { ...s, hardQuestions: [...s.hardQuestions, id] }
  }

  function isHard(id: number): boolean {
    return state.value.hardQuestions.includes(id)
  }

  function isDone(id: number): boolean {
    return state.value.doneQuestions.includes(id)
  }

  function buildSyncFile(): ProgressSyncFile {
    return {
      app: 'aitrainer',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { ...state.value },
    }
  }

  function applySyncFile(file: ProgressSyncFile, mode: 'merge' | 'replace'): SyncResult {
    const incoming = sanitizeState(file.data)
    const next = mode === 'replace' ? incoming : mergeProgress(state.value, incoming)
    // 整体替换 state（触发 usePersistent 深监听写回 localStorage）
    state.value = next
    return {
      doneCount: next.doneCount,
      correctCount: next.correctCount,
      uniqueDone: next.doneQuestions.length,
      wrongCount: Object.keys(next.wrongs).length,
      mockCount: next.mockRecords.length,
    }
  }

  const wrongQuestions = computed<WrongQuestionRecord[]>(() =>
    Object.values(state.value.wrongs).sort(
      (a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt.localeCompare(a.lastWrongAt),
    ),
  )

  return {
    state,
    doneCount: computed(() => state.value.doneCount),
    correctCount: computed(() => state.value.correctCount),
    doneQuestions: computed(() => state.value.doneQuestions),
    uniqueDoneCount: computed(() => state.value.doneQuestions.length),
    isDone,
    wrongQuestions,
    wrongCount: computed(() => wrongQuestions.value.length),
    accuracy: computed(() =>
      state.value.doneCount > 0
        ? state.value.correctCount / state.value.doneCount
        : null,
    ),
    mockRecords: computed(() => state.value.mockRecords),
    hardQuestions: computed(() => state.value.hardQuestions),
    hardCount: computed(() => state.value.hardQuestions.length),
    isHard,
    toggleHard,
    recordAnswer,
    markLearned,
    resetWrongs,
    recordMock,
    buildSyncFile,
    applySyncFile,
  }
}

/* ============================================================
   做题记录同步（导出/导入 JSON，多设备间同步进度）
   ============================================================ */

/**
 * 校验任意未知值是否为合法同步文件（仅外壳与顶层字段；逐条数据的清洗交给 sanitizeState）。
 * app 固定为 'aitrainer'，防止误导入其他应用的 JSON。
 */
export function isProgressSyncFile(raw: unknown): raw is ProgressSyncFile {
  if (typeof raw !== 'object' || raw === null) return false
  const r = raw as Record<string, unknown>
  if (r.app !== 'aitrainer' || r.version !== 1 || typeof r.exportedAt !== 'string') return false
  const d = r.data
  if (typeof d !== 'object' || d === null) return false
  const data = d as Record<string, unknown>
  return (
    typeof data.doneCount === 'number' &&
    typeof data.correctCount === 'number' &&
    typeof data.wrongs === 'object' &&
    data.wrongs !== null &&
    !Array.isArray(data.wrongs) &&
    Array.isArray(data.mockRecords)
  )
}

function isValidWrong(v: unknown): v is WrongQuestionRecord {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.id === 'number' &&
    typeof r.wrongCount === 'number' &&
    typeof r.lastWrongAt === 'string'
  )
}

function isValidMock(v: unknown): v is MockRecord {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.date === 'string' &&
    typeof r.count === 'number' &&
    typeof r.correct === 'number' &&
    typeof r.minutes === 'number' &&
    typeof r.timestamp === 'number' &&
    Array.isArray(r.wrongIds)
  )
}

/**
 * 把任意输入规整为合法 ProgressState：非法/缺失字段一律丢弃或补默认，
 * 防止导入脏数据导致页面崩溃（如 wrongs 值不是对象、mockRecords 项缺字段）。
 */
function sanitizeState(input: unknown): ProgressState {
  const d = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>

  const wrongs: Record<number, WrongQuestionRecord> = {}
  const rawWrongs =
    typeof d.wrongs === 'object' && d.wrongs !== null && !Array.isArray(d.wrongs)
      ? (d.wrongs as Record<string, unknown>)
      : {}
  for (const v of Object.values(rawWrongs)) {
    if (isValidWrong(v)) wrongs[v.id] = { id: v.id, wrongCount: v.wrongCount, lastWrongAt: v.lastWrongAt }
  }

  const mockRecords = (Array.isArray(d.mockRecords) ? d.mockRecords : [])
    .filter(isValidMock)
    .sort((a, b) => b.timestamp - a.timestamp)

  // hardQuestions / doneQuestions 为向后兼容可选字段（旧导出文件无此字段 → 空列表）
  const toIdList = (v: unknown): number[] =>
    (Array.isArray(v) ? v : [])
      .filter((n): n is number => typeof n === 'number')
      .filter((n, i, arr) => arr.indexOf(n) === i)
  const hardQuestions = toIdList(d.hardQuestions)
  const doneQuestions = toIdList(d.doneQuestions)

  const toCount = (v: unknown): number =>
    typeof v === 'number' && v >= 0 ? Math.floor(v) : 0
  return {
    doneCount: toCount(d.doneCount),
    correctCount: toCount(d.correctCount),
    doneQuestions,
    wrongs,
    mockRecords,
    hardQuestions,
  }
}

/**
 * 合并两个进度状态（导入的"合并"模式）：
 * - doneCount / correctCount 取较大值（同一次刷题两边都可能计数，取保守上界）
 * - 错题本按 id 合并：wrongCount 与 lastWrongAt 取较新/较大者
 * - 已做题 / 难题标记：id 并集（先 A 后 B 新增，保序去重）
 * - 模拟考历史：以 timestamp 去重（重复时后写入者优先），结果按最新在前排序
 */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const wrongs: Record<number, WrongQuestionRecord> = { ...a.wrongs }
  for (const rec of Object.values(b.wrongs)) {
    const prev = wrongs[rec.id]
    wrongs[rec.id] = prev
      ? {
          id: rec.id,
          wrongCount: prev.wrongCount > rec.wrongCount ? prev.wrongCount : rec.wrongCount,
          lastWrongAt: prev.lastWrongAt > rec.lastWrongAt ? prev.lastWrongAt : rec.lastWrongAt,
        }
      : { ...rec }
  }

  const byTimestamp = new Map<number, MockRecord>()
  for (const rec of [...a.mockRecords, ...b.mockRecords]) byTimestamp.set(rec.timestamp, rec)

  // id 并集工具：先 a 后 b 新增，保序去重
  function unionIds(listA: number[], listB: number[]): number[] {
    const merged = [...listA]
    for (const id of listB) if (!merged.includes(id)) merged.push(id)
    return merged
  }

  return {
    doneCount: a.doneCount > b.doneCount ? a.doneCount : b.doneCount,
    correctCount: a.correctCount > b.correctCount ? a.correctCount : b.correctCount,
    doneQuestions: unionIds(a.doneQuestions, b.doneQuestions),
    wrongs,
    mockRecords: [...byTimestamp.values()].sort((x, y) => y.timestamp - x.timestamp),
    hardQuestions: unionIds(a.hardQuestions, b.hardQuestions),
  }
}
