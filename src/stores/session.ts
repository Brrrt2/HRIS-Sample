import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useHrisStore } from './hris'
import type { Employee } from '@/types'

export type Role = 'admin' | 'manager' | 'employee'

const KEY = 'sweldupro-session-v1'

interface Saved {
  role?: Role
  actingId?: string
}

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Saved
  } catch {
    return {}
  }
}

/**
 * Mock authentication / session. There is no backend, so this simply lets you
 * preview the app as each role. Permissions and data scope are derived here and
 * consumed by the views.
 */
export const useSession = defineStore('session', () => {
  const hris = useHrisStore()
  const saved = load()

  const role = ref<Role>(saved.role ?? 'admin')
  const actingId = ref<string>(saved.actingId ?? '')

  watch([role, actingId], () =>
    localStorage.setItem(KEY, JSON.stringify({ role: role.value, actingId: actingId.value })),
  )

  const current = computed<Employee | undefined>(() => hris.getEmployee(actingId.value))

  function ensureActing(): void {
    if (role.value !== 'admin' && !hris.getEmployee(actingId.value)) {
      actingId.value = hris.employees[0]?.id ?? ''
    }
  }
  function setRole(r: Role): void {
    role.value = r
    ensureActing()
  }
  function setActing(id: string): void {
    actingId.value = id
  }

  const isAdmin = computed(() => role.value === 'admin')
  const isManager = computed(() => role.value === 'manager')
  const isEmployee = computed(() => role.value === 'employee')

  const canManageEmployees = computed(() => role.value === 'admin')
  const canRunPayroll = computed(() => role.value === 'admin')
  const canSeeAllSalaries = computed(() => role.value === 'admin')
  const canApproveLeave = computed(() => role.value === 'admin' || role.value === 'manager')

  /** Employees this session is allowed to see. */
  const scopedEmployees = computed<Employee[]>(() => {
    if (role.value === 'admin') return hris.employees
    if (role.value === 'manager') {
      const dept = current.value?.department
      return hris.employees.filter((e) => e.department === dept)
    }
    return current.value ? [current.value] : []
  })

  const homePath = computed(() => (role.value === 'employee' ? '/my-pay' : role.value === 'manager' ? '/employees' : '/dashboard'))

  const roleLabel = computed(() =>
    role.value === 'admin' ? 'HR / Admin' : role.value === 'manager' ? 'Manager' : 'Employee',
  )

  return {
    role,
    actingId,
    current,
    setRole,
    setActing,
    ensureActing,
    isAdmin,
    isManager,
    isEmployee,
    canManageEmployees,
    canRunPayroll,
    canSeeAllSalaries,
    canApproveLeave,
    scopedEmployees,
    homePath,
    roleLabel,
  }
})
