<!-- 模拟考：配置（题量/时长）→ 计时答卷（单题递进、可返改、刷新恢复）→ 结果页 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePersistent } from '../composables/usePersistent'
import { useMockExam } from '../composables/useQuiz'
import type { MockConfig, Question } from '../types'

/** 结果页错题项 */
interface WrongItem {
  q: Question
  /** 我的作答（未作答为 null） */
  myIndex: number | null
}

const CONFIG_KEY = 'ai-trainer:mock-config'

const COUNT_OPTIONS = [50, 100, 150]
const MINUTES_OPTIONS = [30, 45, 60, 75, 90]

/**
 * 模拟考会话引擎（useQuiz 提供）：
 * - 会话整体持久化于 "ai-trainer:mock-session"（含 deadline/answers），刷新自动恢复；
 * - 倒计时 running/remainingLabel；到时自动交卷（tick 内）；
 * - 交卷时每题写入刷题统计（错题自动进错题本）并追加模拟考历史（recordMock）。
 */
const { session, remainingLabel, running, start, answer, submit } = useMockExam({
  onTimeout: () => window.alert('考试时间到，已自动交卷'),
})

const config = usePersistent<MockConfig>(CONFIG_KEY, { count: 100, minutes: 60 })

function setCount(c: number): void {
  config.value = { ...config.value, count: c }
}

function setMinutes(m: number): void {
  config.value = { ...config.value, minutes: m }
}

/** 当前题下标（本地导航态；刷新恢复时定位到第一道未答题） */
const examIndex = ref(0)
const starting = ref(false)

type Phase = 'config' | 'taking' | 'result'
const phase = computed<Phase>(() => {
  const s = session.value
  if (s?.submitted) return 'result'
  if (s && running.value) return 'taking'
  return 'config'
})

const quizQuestions = computed<Question[]>(() => session.value?.questions ?? [])
const current = computed<Question | undefined>(() => quizQuestions.value[examIndex.value])

/** 选项索引 -> 字母（0→A） */
function letterOf(index: number): string {
  return String.fromCharCode(65 + index)
}

/** 已选选项索引（undefined = 未作答） */
function myPick(qid: number): number | undefined {
  return session.value?.answers[qid]
}

/** 待答列表：已交卷后从试卷题重建未答/答错的题目（供结果页清单） */
const wrongList = computed<WrongItem[]>(() => {
  const s = session.value
  if (!s || !s.submitted) return []
  const list: WrongItem[] = []
  for (const q of s.questions) {
    const myIndex = s.answers[q.id] ?? null
    const correctIndex = q.answer.charCodeAt(0) - 65
    if (myIndex !== correctIndex) list.push({ q, myIndex })
  }
  return list
})

/** 定位当前题：优先第一道未答题，全答完则停在最后一题 */
function syncIndex(): void {
  const s = session.value
  if (!s) return
  const next = s.questions.findIndex((q) => s.answers[q.id] === undefined)
  examIndex.value = next === -1 ? Math.max(0, s.questions.length - 1) : next
}

function goto(i: number): void {
  const last = quizQuestions.value.length - 1
  examIndex.value = Math.min(Math.max(i, 0), last)
}

/** 选择即下一题（任务要求：单题递进无反馈，可返回导航修改） */
function chooseOption(optionIndex: number): void {
  const q = current.value
  if (!q) return
  answer(q.id, optionIndex)
  goto(examIndex.value + 1)
}

async function startExam(): Promise<void> {
  if (starting.value) return
  starting.value = true
  try {
    await start(config.value)
    syncIndex()
  } catch (err) {
    window.alert(err instanceof Error ? err.message : String(err))
  } finally {
    starting.value = false
  }
}

function confirmSubmit(): void {
  const s = session.value
  if (!s) return
  const answered = Object.keys(s.answers).length
  if (!window.confirm(`确认交卷？已作答 ${answered}/${s.questions.length} 题`)) return
  submit()
}

function abandonExam(): void {
  const s = session.value
  if (!s) return
  const answered = Object.keys(s.answers).length
  if (
    !window.confirm(
      answered > 0
        ? `当前考试已作答 ${answered} 题，确认放弃？`
        : '确认放弃当前考试？',
    )
  ) {
    return
  }
  // 清除会话即放弃（timer 会在下个 tick 自行停止）；不写入模拟考历史
  session.value = null
}

function restart(): void {
  session.value = null
  examIndex.value = 0
}

onMounted(() => {
  // 刷新恢复：已有未提交会话 → 定位当前题
  if (session.value && !session.value.submitted) syncIndex()
})
</script>

<template>
  <div class="mock-exam">
    <h1>模拟考</h1>

    <!-- 配置阶段 -->
    <div v-if="phase === 'config'" class="card">
      <h2>考试配置</h2>
      <p class="page-desc">
        从 600 题题库中随机组卷，按真实考试节奏限时作答；交卷后即时评分并生成错题清单。
      </p>

      <div class="opt-group">
        <span class="opt-label">题量</span>
        <div class="opt-buttons">
          <button
            v-for="c in COUNT_OPTIONS"
            :key="c"
            class="opt-btn"
            :class="{ active: config.count === c }"
            @click="setCount(c)"
          >
            {{ c }} 题
          </button>
        </div>
      </div>

      <div class="opt-group">
        <span class="opt-label">时长</span>
        <div class="opt-buttons">
          <button
            v-for="m in MINUTES_OPTIONS"
            :key="m"
            class="opt-btn"
            :class="{ active: config.minutes === m }"
            @click="setMinutes(m)"
          >
            {{ m }} 分钟
          </button>
        </div>
      </div>

      <button class="btn btn-start" :disabled="starting" @click="startExam">
        {{ starting ? '组卷中…' : '开始考试' }}
      </button>
    </div>

    <!-- 答卷阶段 -->
    <div v-else-if="phase === 'taking'" class="exam-body">
      <template v-if="current">
        <div class="exam-top">
          <div class="exam-progress">
            第 <strong>{{ examIndex + 1 }}</strong> / {{ quizQuestions.length }} 题
          </div>
          <div class="timer" :class="{ urgent: remainingLabel.startsWith('00:') }">
            {{ remainingLabel }}
          </div>
        </div>

        <div class="card question-card">
          <p class="question-text">{{ current.q }}</p>
          <div class="options">
            <button
              v-for="(text, idx) in current.options"
              :key="idx"
              class="option-btn"
              :class="{ selected: myPick(current.id) === idx }"
              @click="chooseOption(idx)"
            >
              <span class="opt-letter">{{ letterOf(idx) }}</span>
              <span>{{ text }}</span>
            </button>
          </div>
        </div>
      </template>

      <!-- 题目导航（可返回修改） -->
      <div class="exam-nav">
        <button class="btn btn-secondary" :disabled="examIndex <= 0" @click="goto(examIndex - 1)">
          上一题
        </button>
        <div class="ques-grid">
          <button
            v-for="(q, i) in quizQuestions"
            :key="q.id"
            class="ques-dot"
            :class="{
              current: i === examIndex,
              answered: myPick(q.id) !== undefined,
            }"
            :aria-label="`第 ${i + 1} 题${myPick(q.id) !== undefined ? '（已作答）' : ''}`"
            @click="goto(i)"
          >
            {{ i + 1 }}
          </button>
        </div>
        <button
          class="btn btn-secondary"
          :disabled="examIndex >= quizQuestions.length - 1"
          @click="goto(examIndex + 1)"
        >
          下一题
        </button>
      </div>

      <div class="exam-actions">
        <button class="btn btn-secondary" @click="abandonExam">放弃考试</button>
        <button class="btn btn-danger" @click="confirmSubmit">交卷</button>
      </div>
    </div>

    <!-- 结果页 -->
    <div v-else-if="phase === 'result' && session && session.result" class="card">
      <h2>考试结果</h2>
      <div class="score-row">
        <div class="score-box">
          <div class="score-num">{{ session.result.correct }}</div>
          <div class="score-label">答对（/ {{ session.result.total }} 题）</div>
        </div>
        <div class="score-box">
          <div class="score-num">
            {{ Math.round((session.result.correct / session.result.total) * 100) }}%
          </div>
          <div class="score-label">正确率</div>
        </div>
        <div class="score-box">
          <div class="score-num">{{ session.result.minutes }} 分</div>
          <div class="score-label">用时</div>
        </div>
      </div>

      <section class="block">
        <h3>错题清单（{{ wrongList.length }} 题）</h3>
        <p v-if="wrongList.length === 0" class="all-right">全部答对，太棒了！</p>
        <ul v-else class="wrong-list">
          <li v-for="w in wrongList" :key="w.q.id" class="wrong-item">
            <div class="wrong-q">{{ w.q.q }}</div>
            <div class="wrong-line my">
              我的答案：{{
                w.myIndex === null ? '未作答' : `${letterOf(w.myIndex)}. ${w.q.options[w.myIndex]}`
              }}
            </div>
            <div class="wrong-line right">
              正确答案：{{ w.q.answer }}. {{ w.q.options[w.q.answer.charCodeAt(0) - 65] }}
            </div>
            <div class="wrong-expl">解析：{{ w.q.explanation }}</div>
          </li>
        </ul>
      </section>

      <div class="result-actions">
        <button class="btn" @click="restart">再来一套模拟考</button>
        <RouterLink class="btn btn-secondary" to="/wrongbook">去错题本重练</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-desc {
  color: var(--color-text-muted);
}

/* 配置选项 */
.opt-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.opt-label {
  font-weight: 600;
  min-width: 3em;
}

.opt-buttons {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.opt-btn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
}

.opt-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.opt-btn.active {
  background-color: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
  font-weight: 600;
}

.btn-start {
  margin-top: var(--space-2);
}

/* 答卷阶段 */
.exam-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.timer {
  font-family: var(--font-mono);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}

.timer.urgent {
  color: var(--color-danger);
}

.question-text {
  font-size: 1.05rem;
  font-weight: 500;
}

.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.option-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
}

.option-btn:hover {
  border-color: var(--color-primary);
}

.option-btn.selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-soft);
}

.opt-letter {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  font-weight: 600;
  font-size: 0.9rem;
}

/* 题目导航 */
.exam-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
  flex-wrap: wrap;
}

.ques-grid {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.ques-dot {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.ques-dot.answered {
  background-color: var(--color-success-soft);
  border-color: var(--color-success);
  color: var(--color-success);
}

.ques-dot.current {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 700;
}

.exam-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

/* 结果页 */
.score-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.score-box {
  text-align: center;
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.score-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}

.score-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.block {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.all-right {
  color: var(--color-success);
}

.wrong-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.wrong-item {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
}

.wrong-q {
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.wrong-line {
  font-size: 0.92rem;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-1);
}

.wrong-line.my {
  background-color: var(--color-danger-soft);
  color: var(--color-danger);
}

.wrong-line.right {
  background-color: var(--color-success-soft);
  color: var(--color-success);
}

.wrong-expl {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.result-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .exam-nav {
    flex-direction: column;
    align-items: stretch;
  }

  .ques-grid {
    justify-content: flex-start;
  }
}
</style>
