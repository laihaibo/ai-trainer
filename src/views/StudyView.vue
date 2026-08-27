<script setup lang="ts">
/**
 * 刷题页：扁平刷题流（不做分类）→ 点选即提交（正确高亮/错选标红 + 解析 + 关联速查卡片）。
 *
 * - 题库经 useQuiz.loadQuestions() 全量加载（id 升序）；支持「只刷未做题」「乱序」与随机抽题；
 *   已做过的题持久化于 useProgress.doneQuestions（每题卡片上有「✓ 已做过」标记）。
 * - 未完成队列不持久化（简单实现），退出即返回入口页；答对/答错即时写入 useProgress。
 */
import { computed, onMounted, ref } from 'vue'
import { TOPICS } from '@/data/topics'
import type { Question, Topic } from '@/types'
import { isCorrect, loadQuestions, randomQuestions, shuffleQuestions } from '@/composables/useQuiz'
import { useProgress } from '@/composables/useProgress'
import QuestionCard from '@/components/QuestionCard.vue'

const RANDOM_COUNT = 20

const progress = useProgress()

const bankLoading = ref(true)
const bankError = ref(false)
/** 全量题库（id 升序） */
const bank = ref<Question[]>([])

const mode = ref<'grid' | 'quiz'>('grid')
const shuffleMode = ref(false)
/** 只刷没做过的题 */
const onlyUndone = ref(false)
const quizTitle = ref('')
const quizError = ref(false)
const queue = ref<Question[]>([])
const index = ref(0)
const selected = ref<number | null>(null)
const sessionCorrect = ref(0)

const totalQuestions = computed(() => bank.value.length)
/** 没做过的题数 */
const undoneCount = computed(
  () => bank.value.filter((q) => !progress.state.value.doneQuestions.includes(q.id)).length,
)
/** 只刷未做题时是否已无可刷 */
const noUndoneLeft = computed(() => onlyUndone.value && undoneCount.value === 0)

const currentQuestion = computed<Question | null>(
  () => queue.value[index.value] ?? null,
)
/** 非空视图用：模板仅在「queue 非空且未完成」分支渲染（当前索引必有效） */
const activeQuestion = computed<Question>(() => queue.value[index.value] as Question)
const revealed = computed(() => selected.value !== null)
const finished = computed(() => queue.value.length > 0 && index.value >= queue.value.length)
const currentTopic = computed<Topic | null>(
  () => TOPICS.find((t) => t.id === currentQuestion.value?.topic) ?? null,
)
const progressPercent = computed(() =>
  queue.value.length > 0 ? Math.round((index.value / queue.value.length) * 100) : 0,
)
const sessionRate = computed(() =>
  queue.value.length > 0 ? Math.round((sessionCorrect.value / queue.value.length) * 100) : 0,
)

async function loadBank(): Promise<void> {
  bankLoading.value = true
  bankError.value = false
  try {
    const all = await loadQuestions()
    bank.value = [...all].sort((a, b) => a.id - b.id)
  } catch {
    bankError.value = true
  } finally {
    bankLoading.value = false
  }
}

onMounted(loadBank)

function buildTitle(base: string): string {
  const tags: string[] = []
  if (onlyUndone.value) tags.push('只刷未做')
  if (shuffleMode.value) tags.push('乱序')
  return tags.length > 0 ? `${base}（${tags.join(' · ')}）` : base
}

/** 连续刷题：按 id 顺序（或乱序）遍历目标池（全部 / 仅未做） */
function startContinuous(): void {
  if (noUndoneLeft.value || totalQuestions.value === 0) return
  const pool = onlyUndone.value
    ? bank.value.filter((q) => !progress.state.value.doneQuestions.includes(q.id))
    : bank.value
  beginQuiz(buildTitle('连续刷题'), shuffleMode.value ? shuffleQuestions(pool) : pool)
}

function startRandom(): void {
  quizError.value = false
  mode.value = 'quiz'
  queue.value = []
  randomQuestions(RANDOM_COUNT)
    .then((qs) => beginQuiz(`随机 ${RANDOM_COUNT} 题`, qs))
    .catch(() => {
      quizError.value = true
      mode.value = 'grid'
    })
}

function beginQuiz(title: string, qs: Question[]): void {
  quizTitle.value = title
  quizError.value = false
  queue.value = qs
  index.value = 0
  selected.value = null
  sessionCorrect.value = 0
  mode.value = 'quiz'
}

/** 点选提交（仅一次）：写入进度统计，答错自动进错题本 */
function handleSelect(optionIndex: number): void {
  const q = currentQuestion.value
  if (!q || selected.value !== null) return
  selected.value = optionIndex
  const correct = isCorrect(q, optionIndex)
  progress.recordAnswer(q.id, correct)
  if (correct) sessionCorrect.value += 1
}

function nextQuestion(): void {
  if (index.value + 1 >= queue.value.length) {
    index.value = queue.value.length // 触发 finished → 结果态
    return
  }
  index.value += 1
  selected.value = null
}

function exitQuiz(): void {
  mode.value = 'grid'
  queue.value = []
  index.value = 0
  selected.value = null
}
</script>

<template>
  <div>
    <!-- ================= 入口（无分类） ================= -->
    <template v-if="mode === 'grid'">
      <div class="page-head">
        <h1>刷题</h1>
        <p class="page-sub">
          已做过 {{ progress.uniqueDoneCount.value }}/{{ totalQuestions }} 题，累计作答
          {{ progress.doneCount.value }} 次，正确率
          {{ progress.accuracy.value === null ? '--' : Math.round(progress.accuracy.value * 100) + '%' }}
        </p>
      </div>

      <div v-if="bankLoading" class="card">
        <p class="muted">题库加载中，请稍候…</p>
      </div>
      <div v-else-if="bankError" class="card">
        <p>题库加载失败，请刷新页面重试</p>
      </div>
      <template v-else>
        <div class="card study-controls">
          <p class="controls-title">选择刷题方式</p>
          <div class="control-row">
            <label class="switch-label">
              <input v-model="onlyUndone" type="checkbox" />
              <span>只刷没做过的题</span>
              <span class="count-pill">剩 {{ undoneCount }} 题</span>
            </label>
            <label class="switch-label">
              <input v-model="shuffleMode" type="checkbox" />
              <span>乱序刷题</span>
            </label>
          </div>
          <p v-if="noUndoneLeft" class="all-done-tip">
            太棒了，全部 {{ totalQuestions }} 题都做完啦！可关闭「只刷没做过的题」进行二刷，
            或去<RouterLink to="/wrongbook">错题本</RouterLink> / <RouterLink to="/focus">重点分析</RouterLink>攻克薄弱题。
          </p>
          <div class="actions-row">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="noUndoneLeft"
              @click="startContinuous"
            >
              开始刷题（{{ onlyUndone ? undoneCount : totalQuestions }} 题）
            </button>
            <button class="btn btn-secondary" type="button" @click="startRandom">
              随机 {{ RANDOM_COUNT }} 题
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- ================= 题目流 ================= -->
    <template v-else>
      <div class="quiz-head">
        <button class="btn btn-secondary" type="button" @click="exitQuiz">← 返回</button>
        <h2 class="quiz-title">{{ quizTitle }}</h2>
      </div>

      <!-- 完成态 -->
      <div v-if="finished" class="card result-card">
        <h3>本轮完成</h3>
        <p class="result-line">
          共 {{ queue.length }} 题，答对 {{ sessionCorrect }} 题，正确率 {{ sessionRate }}%
        </p>
        <p class="result-hint">
          <template v-if="sessionCorrect === queue.length">全部答对，太棒了！</template>
          <template v-else-if="sessionCorrect > 0">答错的题已记入错题本，可去错题本重练。</template>
          <template v-else>答错的题已全部记入错题本，加油！</template>
        </p>
        <div class="result-actions">
          <button class="btn btn-secondary" type="button" @click="exitQuiz">返回入口</button>
        </div>
      </div>

      <!-- 答题态 -->
      <template v-else>
        <div v-if="queue.length === 0" class="card">
          <p>本轮没有可刷的题目，请返回重新选择。</p>
        </div>
        <template v-else>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
          </div>
          <p class="progress-hint">第 {{ index + 1 }} / {{ queue.length }} 题（进度 {{ progressPercent }}%）</p>

          <QuestionCard
            :question="activeQuestion"
            :selected="selected"
            :revealed="revealed"
            @select="handleSelect"
          >
            <template #actions>
              <div v-if="revealed" class="action-row">
                <button class="btn" type="button" @click="nextQuestion">
                  {{ index + 1 >= queue.length ? '查看结果' : '下一题' }}
                </button>
              </div>
            </template>
          </QuestionCard>

          <!-- 关联速查卡片（答后折叠展示） -->
          <details v-if="revealed && currentTopic" class="card topic-cards">
            <summary class="topic-cards-summary">
              {{ currentTopic.name }} · 速查卡片 {{ currentTopic.cards.length }} 条
            </summary>
            <ul class="topic-card-list">
              <li v-for="(card, i) in currentTopic.cards" :key="i">
                <span class="topic-card-bullet" :style="{ backgroundColor: currentTopic.color }" />
                <span>{{ card }}</span>
              </li>
            </ul>
          </details>
        </template>
      </template>
    </template>
  </div>
</template>

<style scoped>
.page-head h1 {
  margin-bottom: var(--space-1);
}

.page-sub {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.muted {
  color: var(--color-text-muted);
}

/* 入口控制卡 */
.study-controls {
  max-width: 560px;
}

.controls-title {
  margin: 0 0 var(--space-3);
  font-weight: 600;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.switch-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 0.95rem;
}

.switch-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.count-pill {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1px var(--space-2);
}

.all-done-tip {
  margin: 0 0 var(--space-3);
  font-size: 0.9rem;
  color: var(--color-success);
}

.actions-row {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quiz-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.quiz-title {
  margin: 0;
  font-size: 1.15rem;
}

.progress-track {
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--space-1);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.2s ease;
}

.progress-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}

.result-card h3 {
  margin-bottom: var(--space-2);
}

.result-line {
  font-size: 1.05rem;
  margin-bottom: var(--space-2);
}

.result-hint {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.topic-cards {
  padding: var(--space-4) var(--space-5);
}

.topic-cards-summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-primary-dark);
  user-select: none;
}

.topic-card-list {
  margin: var(--space-3) 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-2);
}

.topic-card-list li {
  display: flex;
  gap: var(--space-2);
  font-size: 0.9rem;
  line-height: 1.6;
}

.topic-card-bullet {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 8px;
}
</style>
