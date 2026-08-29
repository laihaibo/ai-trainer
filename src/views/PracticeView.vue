<!-- 实操练习：三子栏目（模型构建真题+截图对照分析 / 数据标注 yaml 教程 / Python 填空真题+答案揭示） -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { REGRESSION_TASKS, YAML_GUIDE, PYTHON_TASKS, PYTHON_CARDS } from '../data/practice'
import type { PracticeShot } from '../types'

/** 子栏目定义（tab 切换） */
const tabs = [
  { id: 'model', name: '模型构建' },
  { id: 'label', name: '数据标注' },
  { id: 'python', name: 'Python 编程' },
] as const
type TabId = (typeof tabs)[number]['id']

const activeTab = ref<TabId>('model')

/** 截图静态资源路径：必须经 BASE_URL 拼接（GitHub Pages 子路径部署，绝对路径会 404） */
function shotUrl(src: string): string {
  return `${import.meta.env.BASE_URL}images/practice/${src}`
}

/* ---------- 图片点击放大（原生 dialog 轻量实现，不引第三方库） ---------- */
const lightbox = ref<HTMLDialogElement | null>(null)
const activeShot = ref<PracticeShot | null>(null)

function openShot(shot: PracticeShot) {
  activeShot.value = shot
  lightbox.value?.showModal()
}

function closeShot() {
  lightbox.value?.close()
}

/* ---------- Python：两套真题切换 + 空位答案揭示 ---------- */
const activePyId = ref(PYTHON_TASKS[0].id)
const activePy = computed(
  () => PYTHON_TASKS.find((t) => t.id === activePyId.value) ?? PYTHON_TASKS[0],
)

/** 已揭示的空位集合，key = `${taskId}:${空位号}` */
const revealed = ref(new Set<string>())

function blankKey(taskId: string, no: string): string {
  return `${taskId}:${no}`
}

function isRevealed(taskId: string, no: string): boolean {
  return revealed.value.has(blankKey(taskId, no))
}

function toggleBlank(taskId: string, no: string) {
  const next = new Set(revealed.value)
  const key = blankKey(taskId, no)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  revealed.value = next
}

/** 一键揭示 / 隐藏当前套题全部答案 */
function revealAll(taskId: string, show: boolean) {
  const task = PYTHON_TASKS.find((t) => t.id === taskId)
  if (!task) return
  const next = new Set(revealed.value)
  for (const b of task.blanks) {
    const key = blankKey(taskId, b.no)
    if (show) next.add(key)
    else next.delete(key)
  }
  revealed.value = next
}

function switchPy(id: string) {
  activePyId.value = id
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="practice">
    <h1>实操练习</h1>
    <p class="page-desc">
      三大实操真题的「题目 + 我的完成截图 + 逐条对照分析」。题目与结论均提取自 docs
      实训资料与截图实际输出；分步操作教程请看「实操指引」。
    </p>

    <!-- 子栏目切换 tab -->
    <div class="module-tabs" role="tablist" aria-label="实操练习子栏目切换">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="module-tab"
        :class="{ active: tab.id === activeTab }"
        role="tab"
        :aria-selected="tab.id === activeTab"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- ==================== 子栏目一：模型构建 ==================== -->
    <template v-if="activeTab === 'model'">
      <article v-for="task in REGRESSION_TASKS" :key="task.id" class="card task-card">
        <header class="task-head">
          <h2>{{ task.kind }}</h2>
          <span class="dataset-badge">{{ task.dataset }}</span>
        </header>
        <p class="source-text">原题出处：{{ task.source }}</p>

        <section class="block">
          <h3>题目要求</h3>
          <ol class="req-list">
            <li v-for="(req, i) in task.requirements" :key="i">{{ req }}</li>
          </ol>
        </section>

        <section v-for="shot in task.shots" :key="shot.src" class="block">
          <h3>{{ shot.caption }}</h3>
          <button
            class="shot-wrap"
            type="button"
            :aria-label="`放大查看 ${shot.caption}`"
            @click="openShot(shot)"
          >
            <img :src="shotUrl(shot.src)" :alt="shot.caption" loading="lazy" />
            <span class="zoom-hint">点击放大</span>
          </button>
          <ul class="analysis-list">
            <li v-for="(line, li) in shot.analysis" :key="li">{{ line }}</li>
          </ul>
        </section>

        <section class="block">
          <h3>总体研判</h3>
          <p class="verdict">{{ task.verdict }}</p>
        </section>
      </article>
    </template>

    <!-- ==================== 子栏目二：数据标注 ==================== -->
    <template v-else-if="activeTab === 'label'">
      <article class="card task-card">
        <h2>{{ YAML_GUIDE.title }}</h2>
        <p class="source-text">内容出处：{{ YAML_GUIDE.source }}</p>

        <section class="block">
          <h3>编写步骤</h3>
          <ol class="req-list">
            <li v-for="(step, i) in YAML_GUIDE.steps" :key="i">{{ step }}</li>
          </ol>
        </section>

        <section class="block">
          <h3>标准示例（本赛题：4 类穿戴装备）</h3>
          <pre class="code-block"><code>{{ YAML_GUIDE.sample }}</code></pre>
        </section>

        <section class="block">
          <h3>逐字段讲解</h3>
          <dl class="field-list">
            <template v-for="f in YAML_GUIDE.fields" :key="f.name">
              <dt>{{ f.name }}</dt>
              <dd>{{ f.note }}</dd>
            </template>
          </dl>
        </section>

        <section class="block">
          <h3>注意事项（易扣分点）</h3>
          <ul class="caution-list">
            <li v-for="(c, i) in YAML_GUIDE.cautions" :key="i">{{ c }}</li>
          </ul>
        </section>
      </article>
    </template>

    <!-- ==================== 子栏目三：Python 编程 ==================== -->
    <template v-else>
      <!-- 两套真题切换 -->
      <div class="py-switch" role="tablist" aria-label="Python 真题套题切换">
        <button
          v-for="task in PYTHON_TASKS"
          :key="task.id"
          class="module-tab"
          :class="{ active: task.id === activePyId }"
          role="tab"
          :aria-selected="task.id === activePyId"
          @click="switchPy(task.id)"
        >
          {{ task.name }}
        </button>
      </div>

      <article class="card task-card">
        <h2>{{ activePy.name }}</h2>
        <p class="scenario">{{ activePy.scenario }}</p>
        <p class="source-text">原题出处：{{ activePy.source }}</p>

        <section class="block">
          <h3>题目要求逐条解读</h3>
          <ol class="req-list">
            <li v-for="(step, i) in activePy.steps" :key="i">
              <strong>{{ step.title }}</strong>：{{ step.detail }}
            </li>
          </ol>
        </section>

        <section class="block">
          <h3>原卷代码（空位原样保留）</h3>
          <pre class="code-block"><code>{{ activePy.lines.join('\n') }}</code></pre>
        </section>

        <section class="block">
          <div class="blanks-head">
            <h3>空位答案（点击揭示）</h3>
            <div class="blanks-actions">
              <button class="mini-btn" type="button" @click="revealAll(activePy.id, true)">
                全部揭示
              </button>
              <button class="mini-btn" type="button" @click="revealAll(activePy.id, false)">
                全部隐藏
              </button>
            </div>
          </div>
          <ul class="blank-list">
            <li v-for="b in activePy.blanks" :key="b.no" class="blank-item">
              <div class="blank-q">
                <span class="blank-no">{{ b.no }}</span>
                <code class="blank-line">{{ b.line }}</code>
                <button
                  class="reveal-btn"
                  type="button"
                  :aria-expanded="isRevealed(activePy.id, b.no)"
                  @click="toggleBlank(activePy.id, b.no)"
                >
                  {{ isRevealed(activePy.id, b.no) ? '收起答案' : '揭示答案' }}
                </button>
              </div>
              <div v-if="isRevealed(activePy.id, b.no)" class="blank-a">
                <code class="answer-code">{{ b.answer }}</code>
                <p class="answer-note">{{ b.note }}</p>
              </div>
            </li>
          </ul>
        </section>

        <section class="block">
          <h3>补全后的完整参考代码</h3>
          <pre class="code-block"><code>{{ activePy.fullAnswer }}</code></pre>
        </section>
      </article>

      <!-- 高频考点与难点（对两套题通用，不随套题切换隐藏） -->
      <article class="card task-card">
        <h2>高频考点与难点</h2>
        <p class="scenario">
          依据 test1 / test2 两套填空真题与训练版代码归纳：考点①-④为必背操作，难点①-③是最易失分处。
        </p>
        <div class="exam-grid">
          <section v-for="(card, i) in PYTHON_CARDS" :key="i" class="exam-card">
            <h3>{{ card.title }}</h3>
            <ul>
              <li v-for="(p, pi) in card.points" :key="pi">{{ p }}</li>
            </ul>
          </section>
        </div>
      </article>
    </template>

    <!-- 图片放大弹层 -->
    <dialog
      ref="lightbox"
      class="lightbox"
      :aria-label="activeShot ? activeShot.caption : '截图放大'"
      @click.self="closeShot"
      @close="activeShot = null"
    >
      <div v-if="activeShot" class="lightbox-body">
        <div class="lightbox-head">
          <span>{{ activeShot.caption }}</span>
          <button class="mini-btn" type="button" @click="closeShot">关闭</button>
        </div>
        <img :src="shotUrl(activeShot.src)" :alt="activeShot.caption" />
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.page-desc {
  color: var(--color-text-muted);
}

/* tab（与实操指引同款式） */
.module-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.module-tab {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.95rem;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.module-tab:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.module-tab.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.py-switch {
  margin-bottom: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.task-card + .task-card {
  margin-top: var(--space-5);
}

.task-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.task-head h2 {
  margin: 0;
}

.dataset-badge {
  display: inline-block;
  padding: 2px var(--space-3);
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 0.85rem;
  font-weight: 600;
}

.source-text {
  margin: var(--space-2) 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  word-break: break-all;
}

.scenario {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.block + .block {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.req-list {
  margin: 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.req-list li {
  line-height: 1.65;
}

/* 截图缩略与放大 */
.shot-wrap {
  position: relative;
  display: block;
  width: 100%;
  max-width: 560px;
  margin: var(--space-3) 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
  cursor: zoom-in;
  overflow: hidden;
}

.shot-wrap img {
  display: block;
  width: 100%;
  max-height: 340px;
  object-fit: cover;
  object-position: top;
}

.zoom-hint {
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background-color: rgba(15, 23, 42, 0.65);
  color: #fff;
  font-size: 0.75rem;
}

.analysis-list {
  margin: 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.analysis-list li {
  font-size: 0.93rem;
  line-height: 1.7;
  padding-left: var(--space-2);
  border-left: 3px solid var(--color-primary-soft);
}

.verdict {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-bg);
  border-left: 3px solid var(--color-success);
  border-radius: var(--radius-sm);
  font-size: 0.93rem;
  line-height: 1.7;
}

/* yaml 页 */
.field-list {
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-2) var(--space-4);
}

.field-list dt {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-primary-dark);
}

.field-list dd {
  margin: 0;
  font-size: 0.93rem;
  line-height: 1.65;
}

.caution-list {
  margin: 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.caution-list li {
  font-size: 0.93rem;
  line-height: 1.65;
}

/* 代码块（与实操指引同款式） */
.code-block {
  margin: 0;
  padding: var(--space-4);
  background-color: #0f172a;
  color: #e2e8f0;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre;
}

/* 空位揭示 */
.blanks-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.blanks-head h3 {
  margin: 0;
}

.blanks-actions {
  display: flex;
  gap: var(--space-2);
}

.mini-btn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  cursor: pointer;
}

.mini-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.blank-list {
  list-style: none;
  margin: var(--space-3) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.blank-item {
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.blank-q {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.blank-no {
  flex-shrink: 0;
  min-width: 30px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 0.82rem;
  font-weight: 700;
}

.blank-line {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.reveal-btn {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background-color: transparent;
  color: var(--color-primary);
  font-size: 0.82rem;
  cursor: pointer;
}

.reveal-btn:hover {
  background-color: var(--color-primary-soft);
}

.blank-a {
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px dashed var(--color-border);
}

.answer-code {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  color: var(--color-success);
  overflow-wrap: anywhere;
}

.answer-note {
  margin: var(--space-2) 0 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* 考点难点卡 */
.exam-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.exam-card {
  padding: var(--space-4);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.exam-card h3 {
  margin: 0 0 var(--space-3);
  color: var(--color-primary-dark);
  font-size: 0.98rem;
}

.exam-card ul {
  margin: 0;
  padding-left: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.exam-card li {
  font-size: 0.9rem;
  line-height: 1.65;
}

/* 放大弹层 */
.lightbox {
  width: min(92vw, 1100px);
  max-height: 90vh;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
}

.lightbox::backdrop {
  background-color: rgba(15, 23, 42, 0.72);
}

.lightbox-body {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.lightbox-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-size: 0.92rem;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}

.lightbox-body img {
  display: block;
  /* 纵向长截图（约 1100-1650 × 1800-1930px）须整体可见：
     与 max-width 共存的 max-height 让浏览器等比缩放，避免系数表/诊断图被裁切 */
  max-width: 100%;
  max-height: calc(90vh - 3.5rem);
  margin: 0 auto;
  object-fit: contain;
  padding: var(--space-3);
}

@media (max-width: 640px) {
  .module-tabs,
  .py-switch {
    flex-direction: column;
  }

  .exam-grid {
    grid-template-columns: 1fr;
  }

  .field-list {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }

  .field-list dd {
    margin-bottom: var(--space-3);
  }
}
</style>
