import type { ContentLayout } from '@/utils/responsive'
import { computed, inject, type InjectionKey, type Ref } from 'vue'

export const contentLayoutKey: InjectionKey<Readonly<Ref<ContentLayout>>> = Symbol('contentLayout')

/**
 * Layout of the main content area ('wide' | 'compact' | 'narrow'), measured by MainLayout from
 * the space actually available next to the navigation. Defaults to 'wide' outside the layout.
 */
export function useContentLayout() {
  const layout = inject(contentLayoutKey, undefined)
  return computed<ContentLayout>(() => layout?.value ?? 'wide')
}
