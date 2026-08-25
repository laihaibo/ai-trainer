<!-- 数据同步卡片：导出/导入做题记录 JSON，用于多设备/多账号间同步进度 -->
<script setup lang="ts">
import { ref } from 'vue'
import { useProgress, isProgressSyncFile } from '../composables/useProgress'

const { buildSyncFile, applySyncFile } = useProgress()

/** 导入模式：'merge' 合并（默认，推荐）/ 'replace' 完全覆盖 */
const mode = ref<'merge' | 'replace'>('merge')
const fileInput = ref<HTMLInputElement | null>(null)
/** 操作结果提示（'' = 不显示） */
const message = ref('')
const messageOk = ref(true)

function setMessage(text: string, ok: boolean): void {
  message.value = text
  messageOk.value = ok
}

function onExport(): void {
  const syncFile = buildSyncFile()
  const blob = new Blob([JSON.stringify(syncFile, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  a.href = url
  a.download = `aitrainer-progress-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
  setMessage('已导出做题记录 JSON，保存好文件后到其他设备导入即可。', true)
}

async function onFilePick(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const raw: unknown = JSON.parse(await file.text())
    if (!isProgressSyncFile(raw)) {
      setMessage('文件格式不正确：请选择本应用导出的做题记录 JSON。', false)
      return
    }
    if (mode.value === 'replace' && !window.confirm('导入将完全覆盖当前做题记录（含错题本、打卡、模拟考历史），无法撤销。确定继续？')) {
      return
    }
    const result = applySyncFile(raw, mode.value)
    const modeText = mode.value === 'merge' ? '合并' : '覆盖'
    setMessage(
      `导入完成（${modeText}）：累计 ${result.doneCount} 题（答对 ${result.correctCount}）、错题 ${result.wrongCount} 条、打卡 ${result.checkinDays} 天、模拟考 ${result.mockCount} 次。`,
      true,
    )
  } catch {
    setMessage('文件读取或解析失败，请确认文件完整且为 .json 格式。', false)
  } finally {
    // 清空 value 以便重复选择同一文件也能触发 change
    input.value = ''
  }
}
</script>

<template>
  <section class="card sync-card">
    <div class="sec-head">
      <h2>数据同步</h2>
      <span class="sec-hint">多设备 / 多账号</span>
    </div>
    <p class="sync-desc">
      进度（答题统计、错题本、计划打卡、模拟考历史）保存在浏览器本地。导出为 JSON 文件，可在其他设备的「导入」中同步恢复。
    </p>
    <div class="sync-options">
      <label class="option-label">
        <input type="radio" value="merge" v-model="mode" />
        <span>合并导入（推荐）：与本地记录合并，不丢失现有数据</span>
      </label>
      <label class="option-label">
        <input type="radio" value="replace" v-model="mode" />
        <span>覆盖导入：完全替换当前记录（有确认提示）</span>
      </label>
    </div>
    <div class="sync-actions">
      <button class="btn" @click="onExport">导出做题记录</button>
      <button class="btn btn-secondary" @click="fileInput?.click()">导入 JSON</button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="hidden-file"
        @change="onFilePick"
      />
    </div>
    <p v-if="message" :class="['sync-msg', messageOk ? 'ok' : 'err']">{{ message }}</p>
  </section>
</template>

<style scoped>
.sec-hint {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.sync-desc {
  margin: 0 0 var(--space-3);
  font-size: 0.92rem;
  color: var(--color-text-muted);
}

.sync-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.option-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: 0.92rem;
  cursor: pointer;
}

.option-label input[type='radio'] {
  margin-top: 3px;
  accent-color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.sync-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.hidden-file {
  display: none;
}

.sync-msg {
  margin: var(--space-3) 0 0;
  font-size: 0.92rem;
}

.sync-msg.ok {
  color: var(--color-success);
}

.sync-msg.err {
  color: var(--color-danger);
}
</style>
