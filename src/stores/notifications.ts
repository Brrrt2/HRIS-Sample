import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { AppNotification, NotificationAudience } from '@/types'
import type { Role } from '@/stores/session'
import { seedNotifications } from '@/lib/seed'

const STORAGE_KEY = 'sweldupro-notifications-v1'

function load(): AppNotification[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AppNotification[]) : null
  } catch {
    return null
  }
}

const uid = (): string => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export interface PostNotificationInput {
  title: string
  message: string
  audience: NotificationAudience
  postedBy: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<AppNotification[]>(load() ?? seedNotifications())

  watch(items, () => localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value)), { deep: true })

  function post(data: PostNotificationInput): void {
    items.value.unshift({ ...data, id: uid(), postedOn: new Date().toISOString(), readBy: [] })
  }

  function remove(id: string): void {
    items.value = items.value.filter((n) => n.id !== id)
  }

  /** Notifications visible to a given role (audience 'all' or matching the role). */
  function visibleTo(role: Role): AppNotification[] {
    return items.value.filter((n) => n.audience === 'all' || n.audience === role)
  }

  function unreadCount(readerKey: string, role: Role): number {
    return visibleTo(role).filter((n) => !n.readBy.includes(readerKey)).length
  }

  function markAllRead(readerKey: string, role: Role): void {
    visibleTo(role).forEach((n) => {
      if (!n.readBy.includes(readerKey)) n.readBy.push(readerKey)
    })
  }

  return { items, post, remove, visibleTo, unreadCount, markAllRead }
})
