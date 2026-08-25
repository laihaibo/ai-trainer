<script setup lang="ts">
/**
 * 共享题卡：题干 + 选项按钮（点选即提交）+ 答后反馈（正确绿/错选红 + 解析）。
 *
 * 交互约定：revealed 前点击选项 emit('select', index)；revealed 后选项只读展示。
 * StudyView / WrongBookView 共用（外层负责操作按钮与速查卡片区）。
 */
import type { Question } from '@/types'

const props = defineProps<{
  question: Question
  /** 用户选中的选项索引（未作答前为 null） */
  selected: number | null
  /** 是否已揭晓答案（锁定选项 + 展示解析） */
  revealed: boolean
}>()

const emit = defineEmits<{
  /** 点选某个选项（仅未揭晓时触发） */
  select: [index: number]
}>()

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

function isAnswerIndex(index: number): boolean {
  return index === props.question.answer.charCodeAt(0) - 65
}

function pick(index: number): void {
  if (!props.revealed) emit('select', index)
}
</script>

<template>
  <div class="question-card">
    <div class="question-head">
      <span class="question-tag">第 {{ question.id }} 题</span>
      <p class="question-text">{{ question.q }}</p>
    </div>

    <div class="option-list">
      <button
        v-for="(opt, index) in question.options"
        :key="index"
        type="button"
        class="option"
        :class="{
          'option-correct': revealed && isAnswerIndex(index),
          'option-wrong': revealed && selected === index && !isAnswerIndex(index),
          'option-muted': revealed && !isAnswerIndex(index) && selected !== index,
        }"
        :disabled="revealed"
        @click="pick(index)"
      >
        <span class="option-letter">{{ optionLetter(index) }}</span>
        <span class="option-text">{{ opt }}</span>
      </button>
    </div>

    <div v-if="revealed" class="feedback" :class="selected === null ? 'feedback-timeout' : isAnswerIndex(selected) ? 'feedback-right' : 'feedback-wrong'">
      <p class="feedback-title">
        <template v-if="selected === null">未作答（超时交卷）</template>
        <template v-else-if="isAnswerIndex(selected)">回答正确</template>
        <template v-else>回答错误，正确答案 {{ optionLetter(question.answer.charCodeAt(0) - 65) }}</template>
      </p>
      <p class="feedback-explanation">解析：{{ question.explanation }}</p>
    </div>

    <slot name="actions" />
  </div>
</template>

<style scoped>
.question-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
}

.question-head {
  margin-bottom: var(--space-4);
}

.question-tag {
  display: inline-block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
  margin-bottom: var(--space-2);
}

.question-text {
  font-size: 1.05rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.6;
}

.option-list {
  display: grid;
  gap: var(--space-2);
}

.option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  text-align: left;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.5;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.1s ease;
}

.option:not(:disabled):hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.option-letter {
  flex: 0 0 auto;
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-weight: 600;
  font-size: 0.85rem;
  margin-top: 1px;
}

/* 揭晓后状态：正确绿 / 错选红 / 其余淡化 */
.option-correct {
  border-color: var(--color-success);
  background: var(--color-success-soft);
}

.option-correct .option-letter {
  border-color: var(--color-success);
  color: var(--color-success);
  background: #fff;
}

.option-wrong {
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

.option-wrong .option-letter {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background: #fff;
}

.option-muted {
  opacity: 0.55;
}

.feedback {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
}

.feedback-right {
  background: var(--color-success-soft);
  border-color: var(--color-success);
}

.feedback-wrong {
  background: var(--color-danger-soft);
  border-color: var(--color-danger);
}

.feedback-timeout {
  background: var(--color-bg);
  border-color: var(--color-border);
}

.feedback-title {
  margin: 0 0 var(--space-1);
  font-weight: 600;
}

.feedback-explanation {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text);
}

@media (max-width: 640px) {
  .question-card {
    padding: var(--space-4);
  }
}
</style>
