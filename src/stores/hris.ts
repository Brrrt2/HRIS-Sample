import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Employee,
  LeaveRequest,
  PayrollRun,
  PayrollItem,
  CompanySettings,
  PayFrequency,
  LeaveStatus,
} from '@/types'
import { computePayslip } from '@/lib/payroll'
import { seedEmployees, seedLeaves, defaultSettings } from '@/lib/seed'

const STORAGE_KEY = 'sweldupro-hris-v1'

interface PersistShape {
  employees: Employee[]
  leaves: LeaveRequest[]
  payrollRuns: PayrollRun[]
  settings: CompanySettings
}

function load(): PersistShape | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistShape) : null
  } catch {
    return null
  }
}

const uid = (prefix: string): string =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const useHrisStore = defineStore('hris', () => {
  const saved = load()

  const employees = ref<Employee[]>(saved?.employees ?? seedEmployees())
  const leaves = ref<LeaveRequest[]>(saved?.leaves ?? seedLeaves())
  const payrollRuns = ref<PayrollRun[]>(saved?.payrollRuns ?? [])
  const settings = ref<CompanySettings>(saved?.settings ?? { ...defaultSettings })

  // ---- persistence ----
  watch(
    [employees, leaves, payrollRuns, settings],
    () => {
      const payload: PersistShape = {
        employees: employees.value,
        leaves: leaves.value,
        payrollRuns: payrollRuns.value,
        settings: settings.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
    { deep: true },
  )

  // ---- derived ----
  const fullName = (e: Employee): string => `${e.firstName} ${e.lastName}`

  const activeEmployees = computed(() => employees.value.filter((e) => e.status !== 'resigned'))

  const headcount = computed(() => activeEmployees.value.length)

  const monthlyPayrollCost = computed(() =>
    activeEmployees.value.reduce((sum, e) => sum + computePayslip(e.monthlyBasic).employerCost, 0),
  )

  const monthlyNetTotal = computed(() =>
    activeEmployees.value.reduce((sum, e) => sum + computePayslip(e.monthlyBasic).netPay, 0),
  )

  const pendingLeaves = computed(() => leaves.value.filter((l) => l.status === 'pending'))

  const onLeaveToday = computed(() => employees.value.filter((e) => e.status === 'on_leave').length)

  const departments = computed(() => {
    const map = new Map<string, number>()
    activeEmployees.value.forEach((e) => map.set(e.department, (map.get(e.department) ?? 0) + 1))
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  })

  const getEmployee = (id: string): Employee | undefined =>
    employees.value.find((e) => e.id === id)

  // ---- employee CRUD ----
  function addEmployee(data: Omit<Employee, 'id'>): Employee {
    const emp: Employee = { ...data, id: uid('e') }
    employees.value.push(emp)
    return emp
  }

  function updateEmployee(id: string, patch: Partial<Employee>): void {
    const idx = employees.value.findIndex((e) => e.id === id)
    if (idx !== -1) employees.value[idx] = { ...employees.value[idx], ...patch }
  }

  function removeEmployee(id: string): void {
    employees.value = employees.value.filter((e) => e.id !== id)
    leaves.value = leaves.value.filter((l) => l.employeeId !== id)
  }

  // ---- leave actions ----
  function fileLeave(data: Omit<LeaveRequest, 'id' | 'status' | 'filedOn'>): void {
    leaves.value.unshift({
      ...data,
      id: uid('l'),
      status: 'pending',
      filedOn: new Date().toISOString().slice(0, 10),
    })
  }

  function setLeaveStatus(id: string, status: LeaveStatus): void {
    const lv = leaves.value.find((l) => l.id === id)
    if (!lv) return
    const wasApproved = lv.status === 'approved'
    lv.status = status
    const emp = getEmployee(lv.employeeId)
    if (!emp) return

    // Deduct credits on first approval
    if (status === 'approved' && !wasApproved) {
      if (lv.type === 'Vacation Leave') emp.vlBalance = Math.max(0, emp.vlBalance - lv.days)
      if (lv.type === 'Sick Leave') emp.slBalance = Math.max(0, emp.slBalance - lv.days)
    }
    // Refund credits if an approved leave is later rejected
    if (status === 'rejected' && wasApproved) {
      if (lv.type === 'Vacation Leave') emp.vlBalance += lv.days
      if (lv.type === 'Sick Leave') emp.slBalance += lv.days
    }
  }

  // ---- payroll ----
  function buildPayrollItems(): PayrollItem[] {
    return activeEmployees.value.map((e) => {
      const p = computePayslip(e.monthlyBasic)
      return {
        employeeId: e.id,
        employeeName: fullName(e),
        basic: p.basic,
        allowances: p.allowances,
        gross: p.gross,
        sssEE: p.sssEE,
        philhealthEE: p.philhealthEE,
        pagibigEE: p.pagibigEE,
        withholdingTax: p.withholdingTax,
        totalDeductions: p.totalDeductions,
        netPay: p.netPay,
        sssER: p.sssER,
        philhealthER: p.philhealthER,
        pagibigER: p.pagibigER,
        employerCost: p.employerCost,
      }
    })
  }

  function runPayroll(period: string, frequency: PayFrequency): PayrollRun {
    const run: PayrollRun = {
      id: uid('p'),
      period,
      frequency,
      createdOn: new Date().toISOString().slice(0, 10),
      items: buildPayrollItems(),
    }
    payrollRuns.value.unshift(run)
    return run
  }

  function deletePayrollRun(id: string): void {
    payrollRuns.value = payrollRuns.value.filter((r) => r.id !== id)
  }

  // ---- demo reset ----
  function resetDemo(): void {
    employees.value = seedEmployees()
    leaves.value = seedLeaves()
    payrollRuns.value = []
    settings.value = { ...defaultSettings }
  }

  return {
    employees,
    leaves,
    payrollRuns,
    settings,
    fullName,
    activeEmployees,
    headcount,
    monthlyPayrollCost,
    monthlyNetTotal,
    pendingLeaves,
    onLeaveToday,
    departments,
    getEmployee,
    addEmployee,
    updateEmployee,
    removeEmployee,
    fileLeave,
    setLeaveStatus,
    runPayroll,
    deletePayrollRun,
    resetDemo,
  }
})
