<!-- 首页仪表盘：今日计划（打卡进度）/ 总体进度（正确数/题量/错题）/ 三个快捷入口 -->
<script setup lang="ts">
import { computed } from 'vue'
import { DAILY_PLANS } from '../data/plan'
import { useProgress } from '../composables/useProgress'
import DataSyncCard from '../components/DataSyncCard.vue'

const {
  correctCount,
  wrongCount,
  hardCount,
  isChecked,
  toggleCheckin,
} = useProgress()

/** 题库总量（去重后：public/data/questions.json，共 546 题） */
const TOTAL_QUESTIONS = 546

function todayStr(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const today = todayStr()

const todayPlan = computed(() => DAILY_PLANS.find((p) => p.date === today))

const todayDone = computed(
  () =>
    todayPlan.value?.tasks.filter((t) => isChecked(todayPlan.value!.date, t.id)).length ?? 0,
)
const todayTotal = computed(() => todayPlan.value?.tasks.length ?? 0)

const todayPct = computed(() =>
  todayTotal.value > 0 ? Math.round((todayDone.value / todayTotal.value) * 100) : 0,
)

const overallPct = computed(() =>
  Math.min(100, Math.round((correctCount.value / TOTAL_QUESTIONS) * 100)),
)
</script>

<template>
  <div class="home">
    <h1>备考仪表盘</h1>

    <!-- 今日计划 -->
    <section class="card">
      <div class="sec-head">
        <h2>今日计划</h2>
        <RouterLink to="/plan" class="sec-link">查看完整计划</RouterLink>
      </div>

      <template v-if="todayPlan">
        <div class="plan-summary">
          <span class="day-tag">Day {{ todayPlan.day }}</span>
          <strong>{{ todayPlan.title }}</strong>
          <span class="date-text">{{ todayPlan.date }}</span>
        </div>

        <ul class="today-tasks">
          <li v-for="t in todayPlan.tasks" :key="t.id" class="task-row">
            <label class="task-label">
              <input
                type="checkbox"
                :checked="isChecked(todayPlan.date, t.id)"
                @change="toggleCheckin(todayPlan.date, t.id)"
              />
              <span>{{ t.label }}</span>
            </label>
          </li>
        </ul>

        <div class="progress-row">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${todayPct}%` }"></div>
          </div>
          <span class="progress-text">{{ todayDone }}/{{ todayTotal }} 已完成（{{ todayPct }}%）</span>
        </div>
      </template>

      <p v-else class="no-plan">
        今天不在冲刺计划窗口内（2026-08-24 ~ 2026-08-29；8/30 考试日）。可前往
        <RouterLink to="/plan">学习计划</RouterLink> 查看完整 6 天安排。
      </p>
    </section>

    <!-- 总体进度 -->
    <section class="card">
      <div class="sec-head">
        <h2>总体进度</h2>
        <div class="sec-links">
          <RouterLink to="/wrongbook" class="sec-link">错题本（{{ wrongCount }}）</RouterLink>
          <RouterLink to="/wrongbook" class="sec-link">难题（{{ hardCount }}）</RouterLink>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-num">{{ correctCount }}</div>
          <div class="stat-label">已答对题数</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{{ TOTAL_QUESTIONS }}</div>
          <div class="stat-label">题库总题量</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{{ wrongCount }}</div>
          <div class="stat-label">错题数</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{{ hardCount }}</div>
          <div class="stat-label">难题数</div>
        </div>
      </div>

      <div class="progress-row">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${overallPct}%` }"></div>
        </div>
        <span class="progress-text">{{ overallPct }}%（{{ correctCount }}/{{ TOTAL_QUESTIONS }} 题）</span>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="quick-section">
      <h2>快捷入口</h2>
      <div class="quick-cards">
        <RouterLink to="/study" class="card quick-card">
          <span class="quick-icon study">刷</span>
          <div>
            <h3>去刷题</h3>
            <p>按主题刷题，答后即时解析</p>
          </div>
        </RouterLink>
        <RouterLink to="/mock" class="card quick-card">
          <span class="quick-icon mock">考</span>
          <div>
            <h3>模拟考</h3>
            <p>随机组卷限时作答，模拟冲刺</p>
          </div>
        </RouterLink>
        <RouterLink to="/hands-on" class="card quick-card">
          <span class="quick-icon handson">练</span>
          <div>
            <h3>实操指引</h3>
            <p>三模块四段式教程，分步必练</p>
          </div>
        </RouterLink>
        <RouterLink to="/insights" class="card quick-card">
          <span class="quick-icon insights">析</span>
          <div>
            <h3>错题分析</h3>
            <p>按主题归纳错题难题，查看复习资料</p>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- 数据同步 -->
    <DataSyncCard />
  </div>
</template>

<style scoped>
.sec-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.sec-head h2 {
  margin: 0;
}

.sec-link {
  font-size: 0.9rem;
  white-space: nowrap;
}

.sec-links {
  display: flex;
  gap: var(--space-3);
}

/* 今日计划 */
.plan-summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
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

.today-tasks {
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
  font-size: 0.95rem;
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

.no-plan {
  color: var(--color-text-muted);
  margin: 0;
}

/* 统计卡 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.stat-box {
  text-align: center;
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.stat-num {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary-dark);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* 进度条（两节共用） */
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

/* 快捷入口 */
.quick-section {
  margin-top: var(--space-6);
  margin-bottom: var(--space-6);
}

.quick-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.quick-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: 0;
  color: var(--color-text);
}

.quick-card:hover {
  transform: translateY(-2px);
}

.quick-card h3 {
  margin-bottom: var(--space-1);
}

.quick-card p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
}

.quick-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.quick-icon.study {
  background-color: var(--color-primary);
}

.quick-icon.mock {
  background-color: var(--color-danger);
}

.quick-icon.handson {
  background-color: var(--color-success);
}

.quick-icon.insights {
  background-color: var(--color-warning);
}

@media (max-width: 640px) {
  .quick-cards {
    grid-template-columns: 1fr;
  }
}
</style>
