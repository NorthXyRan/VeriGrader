import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '@/components/layout/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/components/Home.vue'),
        },
        {
          path: 'uploading',
          name: 'Uploading',
          component: () => import('@/components/upload/Uploading.vue'),
        },
        {
          path: 'grading',
          name: 'Grading',
          component: () => import('@/components/grading/Grading.vue'),
        },
        {
          path: 'result',
          name: 'ResultReport',
          component: () => import('@/components/result/ReportPage.vue'),
        },
        { path: 'settings', redirect: '/prompt-setting' },
        {
          path: 'prompt-setting',
          name: 'PromptSetting',
          component: () => import('@/components/settings/PromptSetting/index.vue'),
        },
        {
          path: 'settings/docs',
          name: 'DetailDocs',
          component: () => import('@/components/settings/DetailDocs.vue'),
        },
      ],
    },
  ],
})

export default router
