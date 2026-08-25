<script setup lang="ts">
/**
 * 刷题页：主题网格 → 题目流（点选即提交：正确高亮/错选标红 + 解析 + 该主题速查卡片）。
 *
 * - 题库经 useQuiz.loadQuestions() 按主题统计题量；未完成队列不持久化（简单实现），
 *   退出即返回主题网格；答对/答错即时写入 useProgress（答错自动进错题本）。
 */
import { computed, onMounted, ref } from 'vue'
import { TOPICS } from '@/data/topics'
import type { Question, Topic } from '@/types'
import { fromTopic, isCorrect, loadQuestions, randomQuestions } from '@/composables/useQuiz'
import { useProgress } from '@/composables/useProgress'
import QuestionCard from '@/components/QuestionCard.vue'

const RANDOM_COUNT = 20

const progress = useProgress()
const topics = TOPICS

const bankLoading = ref(true)
const bankError = ref(false)
const topicCounts = ref<Record<string, number>>({})

const mode = ref<'grid' | 'quiz'>('grid')
const shuffleMode = ref(false)
const quizTitle = ref('')
const quizError = ref(false)
const queue = ref<Question[]>([])
const index = ref(0)
const selected = ref<number | null>(null)
const sessionCorrect = ref(0)

const currentQuestion = computed<Question | null>(
  () => queue.value[index.value] ?? null,
)
/** 非空视图用：模板仅在「queue 非空且未完成」分支渲染（当前索引必有效） */
const activeQuestion = computed<Question>(() => queue.value[index.value] as Question)
const revealed = computed(() => selected.value !== null)
const finished = computed(() => queue.value.length > 0 && index.value >= queue.value.length)
const currentTopic = computed<Topic | null>(
  () => topics.find((t) => t.id === currentQuestion.value?.topic) ?? null,
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
    const counts: Record<string, number> = {}
    for (const q of all) counts[q.topic] = (counts[q.topic] ?? 0) + 1
    topicCounts.value = counts
  } catch {
    bankError.value = true
  } finally {
    bankLoading.value = false
  }
}

onMounted(loadBank)

function startTopic(topic: Topic): void {
  quizTitle.value = topic.name
  quizError.value = false
  mode.value = 'quiz'
  queue.value = []
  quizError.value = false
  fromTopic(topic.id, { shuffle: shuffleMode.value })
    .then((qs) => beginQuiz(qs))
    .catch(() => {
      quizError.value = true
      mode.value = 'grid'
    })
}

function startRandom(): void {
  quizTitle.value = `随机 ${RANDOM_COUNT} 题`
  quizError.value = false
  mode.value = 'quiz'
  randomQuestions(RANDOM_COUNT)
    .then((qs) => beginQuiz(qs))
    .catch(() => {
      quizError.value = true
      mode.value = 'grid'
    })
}

function beginQuiz(qs: Question[]): void {
  queue.value = qs
  index.value = 0
  selected.value = null
  sessionCorrect.value = 0
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
    <!-- ================= 主题网格 ================= -->
    <template v-if="mode === 'grid'">
      <div class="page-head">
        <h1>刷题</h1>
        <p class="page-sub">
          已作答 {{ progress.doneCount.value }} 题，正确率
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
        <div class="grid-controls">
          <label class="switch-label">
            <input v-model="shuffleMode" type="checkbox" />
            <span>乱序刷题</span>
          </label>
          <button class="btn" type="button" @click="startRandom">随机 {{ RANDOM_COUNT }} 题</button>
        </div>

        <div class="topic-grid">
          <button
            v-for="topic in topics"
            :key="topic.id"
            type="button"
            class="topic-card"
            :style="{ borderLeftColor: topic.color }"
            @click="startTopic(topic)"
          >
            <span class="topic-dot" :style="{ backgroundColor: topic.color }" />
            <span class="topic-name">{{ topic.name }}</span>
            <span class="topic-count">{{ topicCounts[topic.id] ?? 0 }} 题</span>
          </button>
        </div>
      </template>
    </template>

    <!-- ================= 题目流 ================= -->
    <template v-else>
      <div class="quiz-head">
        <button class="btn btn-secondary" type="button" @click="exitQuiz">← 返回主题</button>
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
          <button class="btn btn-secondary" type="button" @click="exitQuiz">返回主题</button>
        </div>
      </div>

      <!-- 答题态 -->
      <template v-else>
        <div v-if="queue.length === 0" class="card">
          <p>该主题暂无题目，请返回选择其他主题。</p>
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

.grid-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.switch-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-3);
}

.topic-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-align: left;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  color: var(--color-text);
  font-size: 0.95rem;
  transition:
    box-shadow 0.15s ease,
    transform 0.1s ease;
}

.topic-card:hover {
  box-shadow: var(--shadow-card-hover);
}

.topic-card:active {
  transform: scale(0.99);
}

.topic-dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.topic-name {
  flex: 1;
  font-weight: 600;
  line-height: 1.4;
}

.topic-count {
  flex: 0 0 auto;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
  white-space: nowrap;
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

@media (max-width: 640px) {
  .topic-grid {
    grid-template-columns: 1fr;
  }
}
</style>
