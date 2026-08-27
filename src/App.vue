<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/study', label: '刷题' },
  { to: '/wrongbook', label: '错题本' },
  { to: '/focus', label: '重点分析' },
  { to: '/mock', label: '模拟考' },
  { to: '/hands-on', label: '实操指引' },
]
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-inner">
        <RouterLink to="/" class="app-logo">备考助手</RouterLink>
        <nav class="app-nav" aria-label="主导航">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="app-nav-link"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
