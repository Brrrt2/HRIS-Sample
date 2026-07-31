import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { saveBlob, loadBlob, deleteBlob } from '@/lib/blobStore'
import { defaultNotificationPrefs, type NotificationPrefs } from '@/types'

/**
 * Personal account settings: profile picture (blob lives in IndexedDB, same
 * store as documents) and per-account notification preferences. Keyed by
 * "profile key" — an employee id, or the role name for admin/manager
 * sessions with no acting employee selected.
 */

const PREFS_KEY = 'sweldupro-profile-prefs-v1'
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB
export const ACCEPTED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp']

const avatarBlobId = (profileKey: string): string => `avatar-${profileKey}`

function loadPrefs(): Record<string, NotificationPrefs> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Record<string, NotificationPrefs>
  } catch {
    return {}
  }
}

export interface AvatarResult {
  ok: boolean
  error?: string
}

export const useProfileStore = defineStore('profile', () => {
  const avatarUrls = ref<Record<string, string>>({})
  const prefs = ref<Record<string, NotificationPrefs>>(loadPrefs())

  watch(prefs, () => localStorage.setItem(PREFS_KEY, JSON.stringify(prefs.value)), { deep: true })

  async function loadAvatar(profileKey: string): Promise<void> {
    if (!profileKey || avatarUrls.value[profileKey]) return
    const blob = await loadBlob(avatarBlobId(profileKey))
    if (blob) avatarUrls.value[profileKey] = URL.createObjectURL(blob)
  }

  async function setAvatar(profileKey: string, file: File): Promise<AvatarResult> {
    if (file.size > MAX_AVATAR_BYTES) {
      return { ok: false, error: `${file.name} exceeds the 5 MB limit.` }
    }
    if (file.type && !ACCEPTED_AVATAR_MIME.includes(file.type)) {
      return { ok: false, error: 'Only JPG, PNG, or WEBP images are allowed.' }
    }
    await saveBlob(avatarBlobId(profileKey), file)
    const old = avatarUrls.value[profileKey]
    avatarUrls.value[profileKey] = URL.createObjectURL(file)
    if (old) URL.revokeObjectURL(old)
    return { ok: true }
  }

  async function removeAvatar(profileKey: string): Promise<void> {
    await deleteBlob(avatarBlobId(profileKey))
    const old = avatarUrls.value[profileKey]
    if (old) URL.revokeObjectURL(old)
    delete avatarUrls.value[profileKey]
  }

  function getPrefs(profileKey: string): NotificationPrefs {
    return prefs.value[profileKey] ?? defaultNotificationPrefs
  }

  function setPrefs(profileKey: string, patch: Partial<NotificationPrefs>): void {
    prefs.value[profileKey] = { ...getPrefs(profileKey), ...patch }
  }

  return { avatarUrls, loadAvatar, setAvatar, removeAvatar, getPrefs, setPrefs }
})
