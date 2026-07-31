import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type {
  TimeLog,
  OvertimeRequest,
  OvertimeStatus,
  AttendanceCorrection,
  CorrectionStatus,
} from '@/types'
import { seedTimeLogs, seedOvertime, seedCorrections } from '@/lib/seed'

const STORAGE_KEY = 'sweldupro-attendance-v1'

interface PersistShape {
  timeLogs: TimeLog[]
  overtime: OvertimeRequest[]
  corrections: AttendanceCorrection[]
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

const today = (): string => new Date().toISOString().slice(0, 10)

export const useAttendanceStore = defineStore('attendance', () => {
  const saved = load()

  const timeLogs = ref<TimeLog[]>(saved?.timeLogs ?? seedTimeLogs())
  const overtime = ref<OvertimeRequest[]>(saved?.overtime ?? seedOvertime())
  const corrections = ref<AttendanceCorrection[]>(saved?.corrections ?? seedCorrections())

  watch(
    [timeLogs, overtime, corrections],
    () => {
      const payload: PersistShape = {
        timeLogs: timeLogs.value,
        overtime: overtime.value,
        corrections: corrections.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
    { deep: true },
  )

  // ---- clock in / out ----
  function todayLog(employeeId: string): TimeLog | undefined {
    const d = today()
    return timeLogs.value.find((t) => t.employeeId === employeeId && t.date === d)
  }

  function isClockedIn(employeeId: string): boolean {
    const log = todayLog(employeeId)
    return !!log?.clockIn && !log.clockOut
  }

  function clockIn(employeeId: string): void {
    const log = todayLog(employeeId)
    if (log) {
      if (!log.clockIn) log.clockIn = new Date().toISOString()
      return
    }
    timeLogs.value.unshift({ id: uid('t'), employeeId, date: today(), clockIn: new Date().toISOString() })
  }

  function clockOut(employeeId: string): void {
    const log = todayLog(employeeId)
    if (log && log.clockIn && !log.clockOut) log.clockOut = new Date().toISOString()
  }

  function logsFor(employeeId: string): TimeLog[] {
    return timeLogs.value
      .filter((t) => t.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // ---- overtime ----
  function fileOvertime(data: Omit<OvertimeRequest, 'id' | 'status' | 'filedOn'>): void {
    overtime.value.unshift({ ...data, id: uid('ot'), status: 'pending', filedOn: today() })
  }

  function setOvertimeStatus(id: string, status: OvertimeStatus): void {
    const r = overtime.value.find((o) => o.id === id)
    if (r) r.status = status
  }

  // ---- attendance corrections ----
  function fileCorrection(data: Omit<AttendanceCorrection, 'id' | 'status' | 'filedOn'>): void {
    corrections.value.unshift({ ...data, id: uid('c'), status: 'pending', filedOn: today() })
  }

  function setCorrectionStatus(id: string, status: CorrectionStatus): void {
    const r = corrections.value.find((c) => c.id === id)
    if (!r) return
    r.status = status
    if (status !== 'approved') return

    let log = timeLogs.value.find((t) => t.employeeId === r.employeeId && t.date === r.date)
    if (!log) {
      log = { id: uid('t'), employeeId: r.employeeId, date: r.date }
      timeLogs.value.push(log)
    }
    if (r.requestedClockIn) log.clockIn = `${r.date}T${r.requestedClockIn}:00`
    if (r.requestedClockOut) log.clockOut = `${r.date}T${r.requestedClockOut}:00`
  }

  return {
    timeLogs,
    overtime,
    corrections,
    todayLog,
    isClockedIn,
    clockIn,
    clockOut,
    logsFor,
    fileOvertime,
    setOvertimeStatus,
    fileCorrection,
    setCorrectionStatus,
  }
})
