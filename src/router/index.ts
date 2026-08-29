import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/study',
    name: 'study',
    component: () => import('@/views/StudyView.vue'),
  },
  {
    path: '/wrongbook',
    name: 'wrongbook',
    component: () => import('@/views/WrongBookView.vue'),
  },
  {
    path: '/mock',
    name: 'mock',
    component: () => import('@/views/MockExamView.vue'),
  },
  {
    path: '/hands-on',
    name: 'hands-on',
    component: () => import('@/views/HandsOnView.vue'),
  },
  {
    path: '/practice',
    name: 'practice',
    component: () => import('@/views/PracticeView.vue'),
  },
  {
    path: '/focus',
    name: 'focus',
    component: () => import('@/views/FocusAnalysisView.vue'),
  },
]

const router = createRouter({
  // hash 模式：GitHub Pages 无法重写路径，web 模式刷新/直达会 404
  history: createWebHashHistory(),
  routes,
})

export default router
