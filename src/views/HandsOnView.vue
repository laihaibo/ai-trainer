<!-- 实操指引：三模块四段式教程（考题立意 / 分步操作 / 示例代码 / 考点易错点） -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { HANDS_ON } from '../data/handsOn'

/** 当前选中模块 id（默认第一个） */
const activeId = ref(HANDS_ON[0].id)

const activeModule = computed(
  () => HANDS_ON.find((m) => m.id === activeId.value) ?? HANDS_ON[0],
)

/**
 * 剥离 Markdown fenced code 围栏（```python ... ```）后用于 pre 渲染；
 * 若无围栏则原样返回。
 */
function stripFence(code: string): string {
  const m = code.match(/^```[^\n]*\n([\s\S]*?)\n?```$/)
  return m ? m[1] : code
}
</script>

<template>
  <div class="hands-on">
    <h1>实操指引</h1>
    <p class="page-desc">
      三大实操赛题的分步教程，题型与考试一致，每条步骤均标注原始资料来源（docs/
      下的练习与培训资料）。
    </p>

    <!-- 模块切换 tab -->
    <div class="module-tabs" role="tablist" aria-label="实操模块切换">
      <button
        v-for="mod in HANDS_ON"
        :key="mod.id"
        class="module-tab"
        :class="{ active: mod.id === activeId }"
        role="tab"
        :aria-selected="mod.id === activeId"
        @click="activeId = mod.id"
      >
        {{ mod.name }}
      </button>
    </div>

    <!-- 模块内容 -->
    <article v-if="activeModule" class="card">
      <h2>{{ activeModule.name }}</h2>

      <!-- 第一段：考题立意 -->
      <section class="block">
        <h3>考题立意</h3>
        <p>{{ activeModule.scenario }}</p>
        <p class="purpose">
          <strong>考查目的：</strong>{{ activeModule.purpose }}
        </p>
      </section>

      <!-- 第二段：分步操作 -->
      <section class="block">
        <h3>分步操作</h3>
        <ol class="steps">
          <li v-for="(step, i) in activeModule.steps" :key="i" class="step">
            <div class="step-title">
              <span class="step-no">{{ i + 1 }}</span>
              <strong>{{ step.title }}</strong>
            </div>
            <p class="step-detail">{{ step.detail }}</p>
            <span class="source-badge" :title="step.source">来源</span>
            <p class="source-text">{{ step.source }}</p>
          </li>
        </ol>
      </section>

      <!-- 第三段：示例代码 -->
      <section class="block">
        <h3>示例代码</h3>
        <pre class="code-block"><code>{{ stripFence(activeModule.code) }}</code></pre>
      </section>

      <!-- 第四段：考点与易错点 -->
      <section class="block">
        <h3>考点与易错点</h3>
        <ul class="pitfalls">
          <li v-for="(pit, i) in activeModule.pitfalls" :key="i">{{ pit }}</li>
        </ul>
      </section>
    </article>
  </div>
</template>

<style scoped>
.page-desc {
  color: var(--color-text-muted);
}

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

.block + .block {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.purpose {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

/* 分步操作 */
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.step {
  padding: var(--space-4);
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.step-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.step-no {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 0.85rem;
  font-weight: 600;
}

.step-detail {
  margin: var(--space-2) 0 var(--space-2) 0;
  color: var(--color-text);
}

.source-badge {
  display: inline-block;
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  background-color: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: help;
}

.source-text {
  margin: var(--space-1) 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  word-break: break-all;
}

/* 代码块 */
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

/* 考点与易错点 */
.pitfalls {
  margin: 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pitfalls li {
  color: var(--color-text);
}

@media (max-width: 640px) {
  .module-tabs {
    flex-direction: column;
  }
}
</style>
