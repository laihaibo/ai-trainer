import { ref, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * 通用 localStorage 持久化组合式函数（工厂函数）。
 *
 * - 返回一个 ref，与 localStorage 双向同步（JSON 序列化，深监听）：
 *   读：初始化时读取，缺失或解析失败 → 回退 defaultValue 并 console.warn；
 *   写：值变化时写入，写入异常（如 QuotaExceeded）→ 捕获并 console.warn，不回崩。
 *
 * 用法：
 *   const progress = usePersistent('ai-trainer:progress', defaultProgress)
 *   progress.value = { ... }
 *
 * 注意：key 建议带前缀（如 "ai-trainer:"）避免与其他站点冲突。
 */
export function usePersistent<T>(key: string, defaultValue: T): Ref<T> {
  function read(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw) as T
    } catch (err) {
      console.warn(`[usePersistent] 读取 localStorage key "${key}" 失败，回退默认值`, err)
      return defaultValue
    }
  }

  // ref<T>() 推断为 Ref<UnwrapRef<T>>，与 Ref<T> 不完全等价，显式收窄
  const state = ref<T>(read()) as Ref<T>

  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (err) {
        console.warn(`[usePersistent] 写入 localStorage key "${key}" 失败`, err)
      }
    },
    { deep: true },
  )

  return state
}
