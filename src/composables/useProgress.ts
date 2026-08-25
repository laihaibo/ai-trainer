/**
 * 学习进度核心状态（同一页内单例调用，取值用 useProgress() 工厂）。
 *
 * 持久化：localStorage key "ai-trainer:progress"（复用 usePersistent，深监听自动写回）。
 * 覆盖：刷题统计、错题本（答错自动 upsert）、计划打卡、模拟考历史。
 *
 * 更新策略：对象删除/数组变化统一走「不可变更新」（新引用替换），
 * 保证 usePersistent 的 deep watch 必定触发，避免依赖 delete 语义的边界行为。
 */
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { usePersistent } from './usePersistent'
import type { MockRecord, ProgressState, WrongQuestionRecord } from '../types'

const STORAGE_KEY = 'ai-trainer:progress'

const DEFAULT_STATE: ProgressState = {
  doneCount: 0,
  correctCount: 0,
  wrongs: {},
  checkins: {},
  mockRecords: [],
}

export interface UseProgress {
  /** 原始状态 ref（页面按需读：如计划页读 checkins 全量） */
  state: ReturnType<typeof usePersistent<ProgressState>>
  /** 累计作答题数 */
  doneCount: ComputedRef<number>
  /** 累计答对题数 */
  correctCount: ComputedRef<number>
  /** 错题本（按 wrongCount 降序、同错次按最近错误在前） */
  wrongQuestions: ComputedRef<WrongQuestionRecord[]>
  /** 错题总条数 */
  wrongCount: ComputedRef<number>
  /** 刷题正确率（未刷过为 null） */
  accuracy: ComputedRef<number | null>
  /** 模拟考历史（最新在前） */
  mockRecords: ComputedRef<MockRecord[]>
  /** 记录一次作答：答对计入 correctCount；答错自动 upsert 进错题本 */
  recordAnswer: (id: number, correct: boolean) => void
  /** 从错题本移除一题（已掌握） */
  markLearned: (id: number) => void
  /** 清空错题本 */
  resetWrongs: () => void
  /** 切换某日某任务的打卡勾选 */
  toggleCheckin: (dateKey: string, taskId: string) => void
  /** 某日某任务是否已勾选 */
  isChecked: (dateKey: string, taskId: string) => boolean
  /** 追加一条模拟考记录（最新在前） */
  recordMock: (record: MockRecord) => void
}

export function useProgress(): UseProgress {
  const state = usePersistent<ProgressState>(STORAGE_KEY, DEFAULT_STATE)

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
    // doneCount / correctCount 合并到一次赋值，避免触发两次写回
    state.value = {
      ...s,
      doneCount: s.doneCount + 1,
      correctCount: s.correctCount + (correct ? 1 : 0),
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

  function toggleCheckin(dateKey: string, taskId: string): void {
    const s = state.value
    const list = s.checkins[dateKey] ?? []
    const nextList = list.includes(taskId)
      ? list.filter((t) => t !== taskId)
      : [...list, taskId]
    state.value = {
      ...s,
      checkins: { ...s.checkins, [dateKey]: nextList },
    }
  }

  function isChecked(dateKey: string, taskId: string): boolean {
    return (state.value.checkins[dateKey] ?? []).includes(taskId)
  }

  function recordMock(record: MockRecord): void {
    state.value = {
      ...state.value,
      mockRecords: [record, ...state.value.mockRecords],
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
    wrongQuestions,
    wrongCount: computed(() => wrongQuestions.value.length),
    accuracy: computed(() =>
      state.value.doneCount > 0
        ? state.value.correctCount / state.value.doneCount
        : null,
    ),
    mockRecords: computed(() => state.value.mockRecords),
    recordAnswer,
    markLearned,
    resetWrongs,
    toggleCheckin,
    isChecked,
    recordMock,
  }
}
