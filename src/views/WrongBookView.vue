<script setup lang="ts">
/**
 * 错题本：按 wrongCount 降序列表 + 去重重练（错题队列，答对可"已掌握"移除，答错进队尾）。
 *
 * 数据：useProgress.wrongQuestions（持久化、答错自动 upsert）；题目详情用 useQuiz 题库 join。
 * 移除即 progress.markLearned(id)，列表/重练队列即时刷新（wrongQuestions 为 computed 派生）。
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { TOPICS } from '@/data/topics'
import type { Question, Topic } from '@/types'
import { isCorrect, loadQuestions } from '@/composables/useQuiz'
import { useProgress } from '@/composables/useProgress'
import QuestionCard from '@/components/QuestionCard.vue'

const PREVIEW_LENGTH = 60

const progress = useProgress()

const bankLoading = ref(true)
const bankError = ref(false)
const questionMap = ref<Map<number, Question>>(new Map())

const mode = ref<'list' | 'review'>('list')
/** 列表页签：'wrong' 错题本 / 'hard' 难题本 */
const view = ref<'wrong' | 'hard'>('wrong')
const queue = ref<Question[]>([])
const index = ref(0)
const selected = ref<number | null>(null)
const reviewStarted = ref(false)
/** 当前重练题目来源（wrong=错题 / hard=难题） */
const reviewSource = ref<'wrong' | 'hard'>('wrong')

const currentQuestion = computed<Question | null>(
  () => queue.value[index.value] ?? null,
)
/** 非空视图用：模板仅在「当前题存在」分支渲染（索引必有效） */
const activeQuestion = computed<Question>(() => queue.value[index.value] as Question)
/** 当前题所属主题（重练时展示该主题速查卡片） */
const currentTopic = computed<Topic | null>(
  () => TOPICS.find((t) => t.id === activeQuestion.value.topic) ?? null,
)
const revealed = computed(() => selected.value !== null)
const isCurrentCorrect = computed(
  () =>
    selected.value !== null &&
    currentQuestion.value !== null &&
    isCorrect(currentQuestion.value, selected.value),
)
const reviewDone = computed(
  () => reviewStarted.value && queue.value.length === 0,
)
const remaining = computed(() => queue.value.length)

/** 列表：错题记录 × 题目（降序由 useProgress.wrongQuestions 保证） */
const items = computed(() =>
  progress.wrongQuestions.value.map((rec) => ({
    rec,
    q: questionMap.value.get(rec.id) ?? null,
  })),
)

/** 难题列表（按标记先后） */
const hardItems = computed(() =>
  progress.hardQuestions.value.map((id) => questionMap.value.get(id) ?? null).filter((q): q is Question => q !== null),
)

function preview(text: string): string {
  return text.length > PREVIEW_LENGTH ? text.slice(0, PREVIEW_LENGTH) + '…' : text
}

function topicNameOf(topicId: string): string {
  return TOPICS.find((t) => t.id === topicId)?.name ?? topicId
}

function wrongCountOf(questionId: number): number {
  const rec = progress.wrongQuestions.value.find((r) => r.id === questionId)
  return rec?.wrongCount ?? 0
}

async function loadBank(): Promise<void> {
  bankLoading.value = true
  bankError.value = false
  try {
    const all = await loadQuestions()
    questionMap.value = new Map(all.map((q) => [q.id, q]))
  } catch {
    bankError.value = true
  } finally {
    bankLoading.value = false
  }
}

onMounted(loadBank)

/** 去重重练：全部（默认）或按指定题目入队（跳过题库已移除的题目）；source 决定操作按钮语义 */
function startReview(targetIds?: number[], source: 'wrong' | 'hard' = 'wrong'): void {
  const sourceQs =
    targetIds !== undefined
      ? items.value
          .filter((item) => item.q !== null && targetIds.includes(item.rec.id))
          .map((item) => item.q as Question)
      : items.value
          .filter((item) => item.q !== null)
          .map((item) => item.q as Question)
  if (sourceQs.length === 0) return
  reviewSource.value = source
  queue.value = sourceQs
  index.value = 0
  selected.value = null
  reviewStarted.value = true
  mode.value = 'review'
}

/** 难题重练入口（难题列表条目按钮） */
function startHardReview(): void {
  const qs = hardItems.value.map((q) => q.id)
  if (qs.length === 0) return
  reviewSource.value = 'hard'
  queue.value = [...hardItems.value]
  index.value = 0
  selected.value = null
  reviewStarted.value = true
  mode.value = 'review'
}

/** 单题重练入口（列表条目按钮） */
function startReviewOne(item: { q: Question | null; rec: { id: number } }): void {
  if (item.q) startReview([item.rec.id])
}

/** 单题难题重练入口 */
function startHardReviewOne(q: Question): void {
  reviewSource.value = 'hard'
  queue.value = [q]
  index.value = 0
  selected.value = null
  reviewStarted.value = true
  mode.value = 'review'
}

/** 点选即提交：错题重练同样计入统计（再度答错 → wrongCount+1，排序自动前移） */
function handleSelect(optionIndex: number): void {
  const q = currentQuestion.value
  if (!q || selected.value !== null) return
  selected.value = optionIndex
  progress.recordAnswer(q.id, isCorrect(q, optionIndex))
}

/** 答对后确认"已掌握"：从错题本与重练队列中移除 */
function handleMastered(): void {
  const q = currentQuestion.value
  if (!q) return
  progress.markLearned(q.id)
  queue.value = queue.value.filter((item) => item.id !== q.id)
  // 移除后 index 指向下一项；若被移除的是末项且队列非空，回退至新末项
  if (index.value >= queue.value.length) index.value = Math.max(0, queue.value.length - 1)
  selected.value = null
}

/** 答错：进队尾下一轮重练 */
function handleRetryNext(): void {
  const q = currentQuestion.value
  if (!q) return
  const nextQueue = queue.value.filter((item) => item.id !== q.id)
  nextQueue.push(q)
  queue.value = nextQueue
  if (index.value >= queue.value.length) index.value = 0
  selected.value = null
}

/** 难题重练"下一题"：若已到末题则标记完成（清空队列触发 reviewDone 完成态） */
function handleHardNext(): void {
  const q = currentQuestion.value
  if (!q) return
  if (index.value + 1 >= queue.value.length) {
    queue.value = []
    index.value = 0
  } else {
    index.value += 1
  }
  selected.value = null
}

function exitReview(): void {
  mode.value = 'list'
  queue.value = []
  index.value = 0
  selected.value = null
  reviewStarted.value = false
}
</script>

<template>
  <div>
    <!-- ================= 列表态 ================= -->
    <template v-if="mode === 'list'">
      <div class="page-head">
        <h1>{{ view === 'wrong' ? '错题本' : '难题本' }}</h1>
        <p class="page-sub">
          {{ view === 'wrong'
            ? `累计错题 ${progress.wrongCount.value} 道（按错误次数降序）`
            : `标记难题 ${progress.hardCount.value} 道（按标记先后）` }}
        </p>
      </div>

      <!-- 页签（错题 / 难题） -->
      <div class="tab-bar">
        <button
          type="button"
          :class="['tab-btn', { active: view === 'wrong' }]"
          @click="view = 'wrong'"
        >
          错题本（{{ progress.wrongCount.value }}）
        </button>
        <button
          type="button"
          :class="['tab-btn', { active: view === 'hard' }]"
          @click="view = 'hard'"
        >
          难题（{{ progress.hardCount.value }}）
        </button>
      </div>

      <div v-if="bankLoading" class="card">
        <p class="muted">题库加载中，请稍候…</p>
      </div>
      <div v-else-if="bankError" class="card">
        <p>题库加载失败，请刷新页面重试</p>
      </div>

      <!-- 错题列表 -->
      <template v-else-if="view === 'wrong'">
        <div v-if="items.length === 0" class="card empty-card">
          <p class="empty-title">暂无错题，加油！</p>
          <RouterLink to="/study" class="btn">去刷题</RouterLink>
        </div>
        <template v-else>
          <div class="list-toolbar">
            <span class="muted">去重重练：答对可"已掌握"移除，答错自动回队尾</span>
            <button class="btn" type="button" @click="startReview()">全部重练</button>
          </div>
          <ul class="wrong-list">
            <li v-for="item in items" :key="item.rec.id" class="card wrong-item">
              <div class="wrong-item-main">
                <p class="wrong-item-q">
                  {{ item.q ? preview(item.q.q) : '（题目已从题库移除）' }}
                </p>
                <span class="wrong-item-count">错 {{ item.rec.wrongCount }} 次</span>
              </div>
              <button
                v-if="item.q"
                class="btn btn-secondary"
                type="button"
                @click="startReviewOne(item)"
              >
                去重练
              </button>
            </li>
          </ul>
        </template>
      </template>

      <!-- 难题列表 -->
      <template v-else>
        <div v-if="hardItems.length === 0" class="card empty-card">
          <p class="empty-title">暂无标记难题</p>
          <p class="muted">刷题或重练时，点击题号旁的「☆ 难题」按钮即可标记</p>
        </div>
        <template v-else>
          <div class="list-toolbar">
            <span class="muted">难题汇聚：反复重刷，直到轻松答对</span>
            <button class="btn" type="button" @click="startHardReview">全部重练</button>
          </div>
          <ul class="hard-list">
            <li v-for="q in hardItems" :key="q.id" class="card hard-item">
              <div class="hard-item-main">
                <p class="hard-item-q">{{ preview(q.q) }}</p>
                <span class="hard-item-topic">{{ topicNameOf(q.topic) }}</span>
              </div>
              <div class="hard-item-actions">
                <button class="btn btn-secondary" type="button" @click="startHardReviewOne(q)">
                  去重练
                </button>
                <button class="btn btn-secondary" type="button" @click="progress.toggleHard(q.id)">
                  取消标记
                </button>
              </div>
            </li>
          </ul>
        </template>
      </template>
    </template>

    <!-- ================= 重练态 ================= -->
    <template v-else>
      <div class="quiz-head">
        <button class="btn btn-secondary" type="button" @click="exitReview">← 返回清单</button>
        <h2 class="quiz-title">{{ reviewSource === 'wrong' ? '错题重练' : '难题重练' }}</h2>
        <span class="remaining">剩余 {{ remaining }} 题</span>
      </div>

      <!-- 重练完成 -->
      <div v-if="reviewDone" class="card result-card">
        <h3>{{ reviewSource === 'wrong' ? '错题已全部处理' : '难题已全部重刷' }}</h3>
        <p class="result-hint">
          {{ reviewSource === 'wrong'
            ? '已掌握的题已从错题本移除，可返回清单查看。'
            : '标记的难题保持在本子里，可随时再次重刷。' }}
        </p>
        <div class="result-actions">
          <button class="btn" type="button" @click="exitReview">返回清单</button>
        </div>
      </div>

      <!-- 重练题卡 -->
      <template v-else>
        <div v-if="!currentQuestion" class="card">
          <p>没有可重练的题目，请返回清单。</p>
        </div>
        <template v-else>
          <p class="progress-hint">
            本题历史错误次数：{{ wrongCountOf(activeQuestion.id) }} 次
          </p>
          <QuestionCard
            :question="activeQuestion"
            :selected="selected"
            :revealed="revealed"
            @select="handleSelect"
          >
            <template #actions>
              <div v-if="revealed" class="action-row">
                <template v-if="reviewSource === 'wrong'">
                  <button v-if="isCurrentCorrect" class="btn" type="button" @click="handleMastered">
                    已掌握，移除
                  </button>
                  <button v-else class="btn btn-danger" type="button" @click="handleRetryNext">
                    下一题（本题进队尾）
                  </button>
                </template>
                <template v-else>
                  <button class="btn" type="button" @click="handleHardNext">下一题</button>
                </template>
              </div>
            </template>
          </QuestionCard>

          <!-- 该主题速查卡片（答后折叠展示） -->
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

.empty-card {
  text-align: center;
  padding: var(--space-6) var(--space-5);
}

.empty-title {
  font-size: 1.1rem;
  margin-bottom: var(--space-4);
}

.tab-bar {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding: var(--space-1);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: fit-content;
}

.tab-btn {
  padding: var(--space-1) var(--space-4);
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--color-text);
}

.tab-btn.active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.wrong-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.wrong-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: 0;
  padding: var(--space-4) var(--space-5);
}

.wrong-item-main {
  flex: 1;
  min-width: 0;
}

.wrong-item-q {
  margin: 0 0 var(--space-1);
  font-size: 0.95rem;
  line-height: 1.5;
}

.wrong-item-count {
  font-size: 0.8rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
}

.quiz-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.quiz-title {
  margin: 0;
  font-size: 1.15rem;
}

.remaining {
  margin-left: auto;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.progress-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
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

/* 难题列表 */
.hard-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.hard-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: 0;
  padding: var(--space-4) var(--space-5);
}

.hard-item-main {
  flex: 1;
  min-width: 0;
}

.hard-item-q {
  margin: 0 0 var(--space-1);
  font-size: 0.95rem;
  line-height: 1.5;
}

.hard-item-topic {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
}

.hard-item-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.result-card h3 {
  margin-bottom: var(--space-2);
}

.result-hint {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

@media (max-width: 640px) {
  .wrong-item,
  .hard-item {
    flex-direction: column;
    align-items: stretch;
  }

  .list-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .hard-item-actions {
    justify-content: flex-end;
  }
}
</style>
