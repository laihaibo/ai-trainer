<!-- 学习计划：6 天计划列表（按 day 排序），每日任务打卡勾选 + 完成率，今天高亮 -->
<script setup lang="ts">
import { computed } from 'vue'
import { DAILY_PLANS } from '../data/plan'
import { TOPICS } from '../data/topics'
import { useProgress } from '../composables/useProgress'
import type { DailyPlan } from '../types'

const { isChecked, toggleCheckin } = useProgress()

/** 按 day 升序（防御：即使数据文件乱序也正确展示） */
const sortedPlans = computed<DailyPlan[]>(() =>
  [...DAILY_PLANS].sort((a, b) => a.day - b.day),
)

function todayStr(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const today = todayStr()

function topicName(topicId: string): string {
  return TOPICS.find((t) => t.id === topicId)?.name ?? topicId
}

function topicColor(topicId: string): string {
  return TOPICS.find((t) => t.id === topicId)?.color ?? '#6b7280'
}

function doneCount(plan: DailyPlan): number {
  return plan.tasks.filter((t) => isChecked(plan.date, t.id)).length
}

function donePct(plan: DailyPlan): number {
  if (plan.tasks.length === 0) return 0
  return Math.round((doneCount(plan) / plan.tasks.length) * 100)
}
</script>

<template>
  <div class="plan-view">
    <h1>学习计划</h1>
    <p class="page-desc">
      6 天冲刺计划（8/24 - 8/29，8/30 考试日）。每完成一项任务勾选打卡，进度自动保存。
    </p>

    <article
      v-for="p in sortedPlans"
      :key="p.date"
      class="card plan-card"
      :class="{ 'is-today': p.date === today }"
    >
      <header class="plan-head">
        <span class="day-tag">Day {{ p.day }}</span>
        <span
          v-if="p.date === today"
          class="today-badge"
        >
          今天
        </span>
        <span v-else class="date-text">{{ p.date }}</span>
      </header>
      <h2 class="plan-title">{{ p.title }}</h2>

      <!-- 聚焦主题标签 -->
      <div class="topics-row">
        <span
          v-for="topicId in p.focusTopics"
          :key="topicId"
          class="topic-tag"
          :style="{ backgroundColor: topicColor(topicId) }"
        >
          {{ topicName(topicId) }}
        </span>
        <span v-if="p.focusTopics.length === 0" class="topics-empty">
          无新增主题（错题复盘与全量查漏为主）
        </span>
      </div>

      <!-- 任务清单 -->
      <ul class="tasks">
        <li v-for="t in p.tasks" :key="t.id" class="task-row">
          <label class="task-label">
            <input
              type="checkbox"
              :checked="isChecked(p.date, t.id)"
              @change="toggleCheckin(p.date, t.id)"
            />
            <span class="task-text">{{ t.label }}</span>
          </label>
        </li>
      </ul>

      <!-- 当日完成率 -->
      <div class="progress-row">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${donePct(p)}%` }"></div>
        </div>
        <span class="progress-text">{{ doneCount(p) }}/{{ p.tasks.length }} 已完成（{{ donePct(p) }}%）</span>
      </div>
    </article>
  </div>
</template>

<style scoped>
.page-desc {
  color: var(--color-text-muted);
}

.plan-card {
  position: relative;
}

.plan-card.is-today {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-card);
}

.plan-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.day-tag {
  padding: 2px var(--space-3);
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 0.85rem;
  font-weight: 700;
}

.date-text {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.today-badge {
  padding: 2px var(--space-3);
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
}

.plan-title {
  margin-bottom: var(--space-3);
}

.topics-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.topic-tag {
  padding: 1px var(--space-3);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 0.85rem;
}

.topics-empty {
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.tasks {
  list-style: none;
  margin: 0 0 var(--space-4);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: background-color 0.15s ease;
}

.task-label:hover {
  background-color: var(--color-bg);
}

.task-label input[type='checkbox'] {
  margin-top: 3px;
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.task-text {
  font-size: 0.95rem;
  line-height: 1.5;
}

/* 完成率 */
.progress-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background-color: var(--color-success);
  transition: width 0.25s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
