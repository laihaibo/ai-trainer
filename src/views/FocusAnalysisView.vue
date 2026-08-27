<!-- 重点分析：基于本地做题记录实时统计「高频错题」「高频难点」，展开可查看完整题目、答案解析与关联速查卡片 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { TOPICS } from '@/data/topics'
import type { Question, Topic } from '@/types'
import { loadQuestions } from '@/composables/useQuiz'
import { useProgress } from '@/composables/useProgress'

/** 分析条目：题目 + 错误次数 + 是否难题 */
interface FocusItem {
  q: Question
  wrongCount: number
  hard: boolean
}

const progress = useProgress()

const bankLoading = ref(true)
const bankError = ref(false)
const questionMap = ref<Map<number, Question>>(new Map())

/** 展开的条目 key（'w-'/'h-' 前缀区分两个榜单） */
const expanded = ref<Set<string>>(new Set())

function toggle(key: string): void {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expanded.value = next
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

/** 高频错题：按错误次数降序（useProgress.wrongQuestions 已排序），剔除题库已移除的题 */
const wrongItems = computed<FocusItem[]>(() =>
  progress.wrongQuestions.value.flatMap((rec) => {
    const q = questionMap.value.get(rec.id)
    return q ? [{ q, wrongCount: rec.wrongCount, hard: progress.isHard(rec.id) }] : []
  }),
)

/** 高频难点：全部难题标记；错得多的排前面（难点中的高频项），其余按标记先后 */
const hardItems = computed<FocusItem[]>(() => {
  const wrongOf = (id: number) =>
    progress.state.value.wrongs[id]?.wrongCount ?? 0
  return progress.hardQuestions.value
    .flatMap((id) => {
      const q = questionMap.value.get(id)
      return q ? [{ q, wrongCount: wrongOf(id), hard: true }] : []
    })
    .sort((a, b) => b.wrongCount - a.wrongCount)
})

/** 错 ≥2 次的题数（真正意义上的"高频"错题） */
const repeatedWrongCount = computed(
  () => wrongItems.value.filter((item) => item.wrongCount >= 2).length,
)

/** 待攻克总数（错题 ∪ 难题 去重） */
const focusTotal = computed(() => {
  const ids = new Set<number>([
    ...progress.wrongQuestions.value.map((r) => r.id),
    ...progress.hardQuestions.value,
  ])
  // 仅统计题库中仍存在的题
  let n = 0
  for (const id of ids) if (questionMap.value.has(id)) n += 1
  return n
})

function topicOf(topicId: string): Topic | undefined {
  return TOPICS.find((t) => t.id === topicId)
}

function letter(index: number): string {
  return String.fromCharCode(65 + index)
}

function answerIndexOf(q: Question): number {
  return q.answer.charCodeAt(0) - 65
}
</script>

<template>
  <div class="focus-view">
    <div class="page-head">
      <h1>重点分析</h1>
      <p class="page-sub">
        根据你的做题记录实时统计：错误次数越多、被你标记为难题的题排得越靠前，
        点开任意一题可对照答案解析与关联知识点卡片做深度学习。
      </p>
    </div>

    <!-- 总览 -->
    <div v-if="!bankLoading && !bankError" class="card summary-card">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-num">{{ focusTotal }}</div>
          <div class="summary-label">待攻克（错题∪难题）</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ repeatedWrongCount }}</div>
          <div class="summary-label">错 ≥2 次的高频错题</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ progress.hardCount.value }}</div>
          <div class="summary-label">标记难题</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ progress.uniqueDoneCount.value }}</div>
          <div class="summary-label">已做题数（去重）</div>
        </div>
      </div>
      <p v-if="focusTotal > 0" class="summary-tip">
        建议路径：先把「错 ≥2 次」的题在错题本里重练到答对移除，再集中重刷难题标记。
      </p>
      <p v-else class="summary-tip">目前没有错题与难题记录，保持节奏！做错的题会自动出现在这里。</p>
    </div>

    <div v-if="bankLoading" class="card"><p class="muted">题库加载中…</p></div>
    <div v-else-if="bankError" class="card"><p>题库加载失败，请刷新页面重试</p></div>

    <template v-else>
      <!-- ================= 高频错题 ================= -->
      <section class="focus-section">
        <h2>高频错题（{{ wrongItems.length }}）</h2>
        <div v-if="wrongItems.length === 0" class="card empty-card">
          <p class="empty-title">暂无错题记录，加油！</p>
          <RouterLink to="/study" class="btn">去刷题</RouterLink>
        </div>
        <ul v-else class="focus-list">
          <li v-for="(item, i) in wrongItems" :key="item.q.id" class="card focus-item">
            <header class="focus-head" @click="toggle(`w-${item.q.id}`)">
              <span class="rank-no" :class="{ hot: item.wrongCount >= 2 }">{{ i + 1 }}</span>
              <p class="focus-q">{{ item.q.q }}</p>
              <div class="badges">
                <span class="badge wrong" :class="{ strong: item.wrongCount >= 2 }">
                  错 {{ item.wrongCount }} 次
                </span>
                <span v-if="item.hard" class="badge hard">★ 难题</span>
              </div>
              <span class="expand-icon">{{ expanded.has(`w-${item.q.id}`) ? '▲' : '▼' }}</span>
            </header>

            <div v-if="expanded.has(`w-${item.q.id}`)" class="focus-body">
              <ul class="opt-list">
                <li
                  v-for="(opt, oi) in item.q.options"
                  :key="oi"
                  class="opt-row"
                  :class="{ 'is-answer': oi === answerIndexOf(item.q) }"
                >
                  <span class="opt-letter">{{ letter(oi) }}</span>
                  <span class="opt-text">{{ opt }}</span>
                  <span v-if="oi === answerIndexOf(item.q)" class="answer-flag">正确答案</span>
                </li>
              </ul>
              <p class="expl">解析：{{ item.q.explanation }}</p>

              <details v-if="topicOf(item.q.topic)" class="know-cards">
                <summary>{{ topicOf(item.q.topic)!.name }} · 关联知识点卡片 {{ topicOf(item.q.topic)!.cards.length }} 条</summary>
                <ul>
                  <li v-for="(c, ci) in topicOf(item.q.topic)!.cards" :key="ci">{{ c }}</li>
                </ul>
              </details>

              <div class="item-actions">
                <RouterLink to="/wrongbook" class="btn btn-secondary">去错题本重练</RouterLink>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- ================= 高频难点 ================= -->
      <section class="focus-section">
        <h2>高频难点（{{ hardItems.length }}）</h2>
        <div v-if="hardItems.length === 0" class="card empty-card">
          <p class="empty-title">暂无难题标记</p>
          <p class="muted">刷题或重练时点击题卡右上角「☆ 难题」即可标记，标过的难题会汇总在这里。</p>
        </div>
        <template v-else>
          <p class="section-hint">
            排序规则：其中错过的题按错误次数靠前，纯"感觉难"的按标记先后排列。
            反复重刷直到能轻松秒答，再回错题本点「取消标记」。
          </p>
          <ul class="focus-list">
            <li v-for="(item, i) in hardItems" :key="item.q.id" class="card focus-item">
              <header class="focus-head" @click="toggle(`h-${item.q.id}`)">
                <span class="rank-no">{{ i + 1 }}</span>
                <p class="focus-q">{{ item.q.q }}</p>
                <div class="badges">
                  <span v-if="item.wrongCount > 0" class="badge wrong">错 {{ item.wrongCount }} 次</span>
                  <span class="badge hard">★ 难题</span>
                </div>
                <span class="expand-icon">{{ expanded.has(`h-${item.q.id}`) ? '▲' : '▼' }}</span>
              </header>

              <div v-if="expanded.has(`h-${item.q.id}`)" class="focus-body">
                <ul class="opt-list">
                  <li
                    v-for="(opt, oi) in item.q.options"
                    :key="oi"
                    class="opt-row"
                    :class="{ 'is-answer': oi === answerIndexOf(item.q) }"
                  >
                    <span class="opt-letter">{{ letter(oi) }}</span>
                    <span class="opt-text">{{ opt }}</span>
                    <span v-if="oi === answerIndexOf(item.q)" class="answer-flag">正确答案</span>
                  </li>
                </ul>
                <p class="expl">解析：{{ item.q.explanation }}</p>

                <details v-if="topicOf(item.q.topic)" class="know-cards">
                  <summary>{{ topicOf(item.q.topic)!.name }} · 关联知识点卡片 {{ topicOf(item.q.topic)!.cards.length }} 条</summary>
                  <ul>
                    <li v-for="(c, ci) in topicOf(item.q.topic)!.cards" :key="ci">{{ c }}</li>
                  </ul>
                </details>

                <div class="item-actions">
                  <RouterLink to="/wrongbook" class="btn btn-secondary">去难题本重练</RouterLink>
                </div>
              </div>
            </li>
          </ul>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.page-sub {
  color: var(--color-text-muted);
  line-height: 1.6;
}

.muted {
  color: var(--color-text-muted);
}

/* 总览 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.summary-item {
  text-align: center;
  padding: var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.summary-num {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}

.summary-label {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.summary-card .summary-tip {
  margin: var(--space-3) 0 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.focus-section {
  margin-top: var(--space-6);
}

.focus-section h2 {
  margin-bottom: var(--space-3);
}

.section-hint {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}

.empty-card {
  text-align: center;
  padding: var(--space-6) var(--space-5);
}

.empty-title {
  font-size: 1.05rem;
  margin-bottom: var(--space-3);
}

.focus-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.focus-list .focus-item {
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
}

.focus-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  user-select: none;
}

.focus-head:hover {
  background: var(--color-bg);
}

.rank-no {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.rank-no.hot {
  background: var(--color-danger-soft);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.focus-q {
  flex: 1;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
}

.badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.badge {
  font-size: 0.75rem;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: 600;
  white-space: nowrap;
}

.badge.wrong {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.badge.wrong.strong {
  outline: 1px solid var(--color-danger);
}

.badge.hard {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.expand-icon {
  flex: 0 0 auto;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

/* 展开区 */
.focus-body {
  padding: 0 var(--space-5) var(--space-5);
  border-top: 1px dashed var(--color-border);
}

.opt-list {
  list-style: none;
  margin: var(--space-4) 0 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.opt-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 0.92rem;
  line-height: 1.5;
}

.opt-row.is-answer {
  border-color: var(--color-success);
  background: var(--color-success-soft);
}

.opt-letter {
  flex: 0 0 auto;
  width: 1.4rem;
  height: 1.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-weight: 600;
  font-size: 0.8rem;
  margin-top: 1px;
}

.opt-text {
  flex: 1;
}

.answer-flag {
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-success);
  align-self: center;
}

.expl {
  margin: var(--space-3) 0 0;
  padding: var(--space-3);
  background: var(--color-bg);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  line-height: 1.6;
}

.know-cards {
  margin-top: var(--space-3);
}

.know-cards summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-primary-dark);
  user-select: none;
}

.know-cards ul {
  margin: var(--space-2) 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-2);
}

.know-cards li {
  font-size: 0.88rem;
  line-height: 1.6;
  padding-left: var(--space-3);
  position: relative;
}

.know-cards li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: 700;
}

.item-actions {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .focus-head {
    flex-wrap: wrap;
    padding: var(--space-3);
  }

  .focus-body {
    padding: 0 var(--space-3) var(--space-4);
  }
}
</style>
