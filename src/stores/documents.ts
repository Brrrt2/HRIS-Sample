import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { DocCategory, EmployeeDocument } from '@/types'
import { saveBlob, loadBlob, deleteBlob } from '@/lib/blobStore'

const KEY = 'sweldupro-docs-meta-v1'

export const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
export const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']

const uid = (): string => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function load(): EmployeeDocument[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as EmployeeDocument[]
  } catch {
    return []
  }
}

export interface UploadResult {
  ok: boolean
  error?: string
}

export const useDocStore = defineStore('docs', () => {
  const docs = ref<EmployeeDocument[]>(load())

  watch(docs, () => localStorage.setItem(KEY, JSON.stringify(docs.value)), { deep: true })

  const byEmployee = (employeeId: string): EmployeeDocument[] =>
    docs.value.filter((d) => d.employeeId === employeeId)

  function hasCategory(employeeId: string, category: DocCategory): boolean {
    return docs.value.some((d) => d.employeeId === employeeId && d.category === category)
  }

  async function upload(
    employeeId: string,
    category: DocCategory,
    file: File,
  ): Promise<UploadResult> {
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: `${file.name} exceeds the 10 MB limit.` }
    }
    if (file.type && !ACCEPTED_MIME.includes(file.type)) {
      return { ok: false, error: `${file.name}: only PDF, JPG, or PNG files are allowed.` }
    }
    const id = uid()
    await saveBlob(id, file)
    docs.value.unshift({
      id,
      employeeId,
      category,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      uploadedOn: new Date().toISOString().slice(0, 10),
    })
    return { ok: true }
  }

  async function openInTab(id: string): Promise<void> {
    const blob = await loadBlob(id)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  async function download(doc: EmployeeDocument): Promise<void> {
    const blob = await loadBlob(doc.id)
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = doc.fileName
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function remove(id: string): Promise<void> {
    await deleteBlob(id)
    docs.value = docs.value.filter((d) => d.id !== id)
  }

  return { docs, byEmployee, hasCategory, upload, openInTab, download, remove }
})
