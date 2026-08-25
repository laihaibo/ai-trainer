import { createRouter, createWebHistory } from 'vue-router'
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
    path: '/plan',
    name: 'plan',
    component: () => import('@/views/PlanView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
