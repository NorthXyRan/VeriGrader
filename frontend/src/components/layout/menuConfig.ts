import { DataAnalysis, Document, House, Setting, Upload } from '@element-plus/icons-vue'
import type { Component } from 'vue'

interface MenuChild {
  index: string
  title: string
  route: string
}

export interface MenuItem {
  index: string
  title: string
  icon: Component
  route?: string
  children?: MenuChild[]
}

export const menuItems: MenuItem[] = [
  { index: '0', title: 'Home', icon: House, route: '/' },
  { index: '1', title: 'File Upload', icon: Upload, route: '/uploading' },
  { index: '2', title: 'Grading', icon: Document, route: '/grading' },
  { index: '3', title: 'Score Report', icon: DataAnalysis, route: '/result' },
  {
    index: '4',
    title: 'Settings',
    icon: Setting,
    children: [
      { index: '4-1', title: 'Prompt Setting', route: '/prompt-setting' },
      { index: '4-2', title: 'Detail Docs', route: '/settings/docs' },
    ],
  },
]

export const createRouteToIndexMap = () => {
  const map: Record<string, string> = {}

  menuItems.forEach((item) => {
    if (item.route) {
      map[item.route] = item.index
    }
    if (item.children) {
      item.children.forEach((child) => {
        map[child.route] = child.index
      })
    }
  })

  return map
}

export const isMenuActive = (item: MenuItem, activeMenu: string): boolean => {
  if (item.children) {
    return activeMenu.startsWith(item.index)
  }
  return activeMenu === item.index
}
