<!-- 错题难题分析：按主题展示错题/难题分布、高频模式、学习资料建议 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import studyInsights from '@/data/studyInsights.json'

interface Section {
  topic: string
  topicName: string
  total: number
  wrongTotal: number
  hardTotal: number
  keyPatterns: Array<{
    id: number
    question: string
    wrongCount: number
    tags: string[]
  }>
  reviewTips: string[]
  resources: Array<{
    title: string
    points: string[]
  }>
}

const insights = studyInsights as {
  generatedAt: string
  summary: {
    wrongCount: number
    hardCount: number
    uniqueCount: number
    duplicateRemovedCount: number
    totalAfterDedup: number
  }
  sections: Section[]
  duplicateRemovedIds: number[]
}

const expandedSections = ref<Set<string>>(new Set())
const expandedResources = ref<Set<string>>(new Set())

function toggleSection(topic: string): void {
  if (expandedSections.value.has(topic)) {
    expandedSections.value.delete(topic)
  } else {
    expandedSections.value.add(topic)
  }
}

function toggleResource(key: string): void {
  if (expandedResources.value.has(key)) {
    expandedResources.value.delete(key)
  } else {
    expandedResources.value.add(key)
  }
}

const sortedSections = computed<Section[]>(() =>
  [...insights.sections].sort((a, b) => b.total - a.total),
)

onMounted(() => {
  // 自动展开错题/难题最多的前 3 主题
  const top3 = sortedSections.value.slice(0, 3)
  for (const section of top3) {
    expandedSections.value.add(section.topic)
  }
})
</script>

<template>
  <div class="insights-view">
    <div class="page-head">
      <h1>错题难题分析</h1>
      <p class="page-sub">
        根据你的做题记录自动生成，按主题汇总错题 {{ insights.summary.wrongCount }} 道、难题
        {{ insights.summary.hardCount }} 道（去重后共 {{ insights.summary.uniqueCount }} 道），
        并补充学习资料与复习建议。
      </p>
    </div>

    <!-- 总览卡片 -->
    <div class="card summary-card">
      <h2>统计总览</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-num">{{ insights.summary.wrongCount }}</div>
          <div class="summary-label">累计错题</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ insights.summary.hardCount }}</div>
          <div class="summary-label">标记难题</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ insights.summary.uniqueCount }}</div>
          <div class="summary-label">去重后总题数</div>
        </div>
        <div class="summary-item">
          <div class="summary-num">{{ insights.summary.totalAfterDedup }}</div>
          <div class="summary-label">题库总题数</div>
        </div>
      </div>
      <p class="summary-note">
        本次题库清理已移除 {{ insights.summary.duplicateRemovedCount }} 道重复题，
        题库从 600 题降至 {{ insights.summary.totalAfterDedup }} 题。
        <RouterLink to="/wrongbook">前往错题本</RouterLink>
      </p>
    </div>

    <!-- 各主题分析 -->
    <section class="sections">
      <article
        v-for="section in sortedSections"
        :key="section.topic"
        class="card section-card"
      >
        <header class="section-head" @click="toggleSection(section.topic)">
          <div class="section-head-main">
            <h3 class="section-title">{{ section.topicName }}</h3>
            <div class="section-stats">
              <span class="stat-badge wrong">{{ section.wrongTotal }} 错题</span>
              <span class="stat-badge hard">{{ section.hardTotal }} 难题</span>
              <span class="stat-badge total">共 {{ section.total }} 道</span>
            </div>
          </div>
          <button
            type="button"
            class="expand-btn"
            :aria-expanded="expandedSections.has(section.topic)"
            aria-label="展开/收起"
          >
            {{ expandedSections.has(section.topic) ? '▲' : '▼' }}
          </button>
        </header>

        <div v-if="expandedSections.has(section.topic)" class="section-body">
          <!-- 高频错题模式 -->
          <div v-if="section.keyPatterns.length > 0" class="subsection">
            <h4 class="subsection-title">高频错题模式（按错误次数降序）</h4>
            <ul class="pattern-list">
              <li v-for="p in section.keyPatterns" :key="p.id" class="pattern-item">
                <div class="pattern-main">
                  <p class="pattern-q">{{ p.question }}</p>
                  <div class="pattern-tags">
                    <span
                      v-for="tag in p.tags"
                      :key="tag"
                      class="pattern-tag"
                      :class="{ wrong: tag === '错题', hard: tag === '难题' }"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="p.wrongCount > 0" class="pattern-count">
                      错 {{ p.wrongCount }} 次
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- 速查卡片（从 topics.ts 提取前 6 条） -->
          <div class="subsection">
            <h4 class="subsection-title">主题速查（核心概念）</h4>
            <p class="subsection-hint">
              这部分内容来自题库与实训资料的知识点提炼，建议对照错题重新理解。
            </p>
            <ul class="tip-list">
              <li
                v-for="(tip, i) in section.reviewTips"
                :key="i"
                class="tip-item"
              >
                {{ tip }}
              </li>
            </ul>
          </div>

          <!-- 学习资料建议 -->
          <div v-if="section.resources.length > 0" class="subsection">
            <h4 class="subsection-title">学习资料建议</h4>
            <div class="resources">
              <details
                v-for="(res, idx) in section.resources"
                :key="idx"
                class="resource-card"
                :open="expandedResources.has(`${section.topic}-${idx}`)"
                @toggle="
                  ($event.target as HTMLDetailsElement).open
                    ? expandedResources.add(`${section.topic}-${idx}`)
                    : expandedResources.delete(`${section.topic}-${idx}`)
                "
              >
                <summary class="resource-summary">{{ res.title }}</summary>
                <ul class="resource-points">
                  <li v-for="(point, pi) in res.points" :key="pi">{{ point }}</li>
                </ul>
              </details>
            </div>
          </div>

          <div class="section-actions">
            <RouterLink :to="`/wrongbook`" class="btn btn-secondary">
              去重练该主题错题
            </RouterLink>
          </div>
        </div>
      </article>
    </section>

    <!-- 页脚提示 -->
    <footer class="insights-footer">
      <p class="footer-note">
        本分析基于导出记录
        <code>{{ insights.generatedAt }}</code>
        自动生成。若需更新分析，可在首页"数据同步"卡片重新导入最新进度。
      </p>
    </footer>
  </div>
</template>

<style scoped>
.page-sub {
  color: var(--color-text-muted);
  line-height: 1.6;
}

.summary-card h2 {
  margin-bottom: var(--space-4);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.summary-item {
  text-align: center;
  padding: var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.summary-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}

.summary-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.summary-note {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0;
}

.sections {
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.section-card {
  padding: 0;
  overflow: hidden;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.section-head:hover {
  background-color: var(--color-bg);
}

.section-head-main {
  flex: 1;
  min-width: 0;
}

.section-title {
  margin: 0 0 var(--space-2);
  font-size: 1.15rem;
}

.section-stats {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.stat-badge {
  font-size: 0.8rem;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.stat-badge.wrong {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.stat-badge.hard {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.stat-badge.total {
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.expand-btn {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: var(--space-2);
  transition: transform 0.2s ease;
}

.section-body {
  padding: 0 var(--space-5) var(--space-5);
  border-top: 1px solid var(--color-border);
}

.subsection {
  margin-top: var(--space-4);
}

.subsection-title {
  font-size: 1rem;
  margin-bottom: var(--space-3);
  color: var(--color-primary-dark);
}

.subsection-hint {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}

.pattern-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.pattern-item {
  padding: var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.pattern-q {
  margin: 0 0 var(--space-2);
  font-size: 0.95rem;
  line-height: 1.5;
}

.pattern-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.pattern-tag {
  font-size: 0.75rem;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.pattern-tag.wrong {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.pattern-tag.hard {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.pattern-count {
  font-size: 0.75rem;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.tip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.tip-item {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  line-height: 1.6;
}

.resources {
  display: grid;
  gap: var(--space-3);
}

.resource-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.resource-summary {
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  background: var(--color-bg);
  transition: background-color 0.15s ease;
}

.resource-summary:hover {
  background: var(--color-primary-soft);
}

.resource-points {
  list-style: none;
  margin: 0;
  padding: var(--space-3) var(--space-4);
  display: grid;
  gap: var(--space-2);
}

.resource-points li {
  padding-left: var(--space-3);
  position: relative;
  font-size: 0.9rem;
  line-height: 1.6;
}

.resource-points li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: 700;
}

.section-actions {
  margin-top: var(--space-4);
  display: flex;
  justify-content: flex-end;
}

.insights-footer {
  padding: var(--space-4);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.footer-note {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.footer-note code {
  padding: 2px var(--space-2);
  background: var(--color-bg-soft);
  border-radius: var(--radius-sm);
  font-size: 0.85em;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-head {
    padding: var(--space-3);
  }

  .section-body {
    padding: 0 var(--space-3) var(--space-4);
  }
}
</style>
