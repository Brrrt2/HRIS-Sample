// Domain models for the SwelduPro HRIS

export type EmploymentStatus = 'active' | 'on_leave' | 'resigned'

export type LeaveType =
  | 'Vacation Leave'
  | 'Sick Leave'
  | 'Service Incentive Leave'
  | 'Emergency Leave'
  | 'Maternity/Paternity'

export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export type PayFrequency = 'monthly' | 'semi'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  position: string
  department: string
  email: string
  monthlyBasic: number
  dateHired: string // ISO date
  status: EmploymentStatus
  // Government IDs (Philippine HR 201 file)
  sssNo: string
  philhealthNo: string
  pagibigNo: string
  tin: string
  // Leave credits (days)
  vlBalance: number
  slBalance: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  filedOn: string
}

export interface PayrollItem {
  employeeId: string
  employeeName: string
  basic: number
  allowances: number
  gross: number
  sssEE: number
  philhealthEE: number
  pagibigEE: number
  withholdingTax: number
  totalDeductions: number
  netPay: number
  sssER: number
  philhealthER: number
  pagibigER: number
  employerCost: number
}

export interface PayrollRun {
  id: string
  period: string // e.g. "June 2026"
  frequency: PayFrequency
  createdOn: string
  items: PayrollItem[]
}

export interface CompanySettings {
  companyName: string
  defaultFrequency: PayFrequency
}

// ---- Documents (201 file) ----
export const DOC_CATEGORIES = [
  'Signed Contract',
  'Valid Government ID',
  'SSS E-1 / UMID',
  'PhilHealth MDR',
  'Pag-IBIG MID',
  'BIR Form 2316 / TIN',
  'NBI / Police Clearance',
  'PSA Birth Certificate',
  'Resume / PDS',
  'Medical Certificate',
  'Other',
] as const

export type DocCategory = (typeof DOC_CATEGORIES)[number]

/** Documents required to complete an employee's 201 file. */
export const REQUIRED_DOCS: DocCategory[] = [
  'Signed Contract',
  'Valid Government ID',
  'SSS E-1 / UMID',
  'PhilHealth MDR',
  'Pag-IBIG MID',
  'BIR Form 2316 / TIN',
]

/** Metadata only — the actual file blob lives in IndexedDB, keyed by `id`. */
export interface EmployeeDocument {
  id: string
  employeeId: string
  category: DocCategory
  fileName: string
  mimeType: string
  size: number
  uploadedOn: string
}

// ---- Attendance: clock in/out, overtime, corrections ----

/** A single day's clock in/out record. */
export interface TimeLog {
  id: string
  employeeId: string
  date: string // ISO date
  clockIn?: string // ISO datetime
  clockOut?: string // ISO datetime
}

export type OvertimeStatus = 'pending' | 'approved' | 'rejected'

export interface OvertimeRequest {
  id: string
  employeeId: string
  date: string // ISO date
  startTime: string // HH:mm
  endTime: string // HH:mm
  hours: number
  reason: string
  status: OvertimeStatus
  filedOn: string
}

export type CorrectionField = 'clockIn' | 'clockOut' | 'both'
export type CorrectionStatus = 'pending' | 'approved' | 'rejected'

export interface AttendanceCorrection {
  id: string
  employeeId: string
  date: string // ISO date
  field: CorrectionField
  requestedClockIn?: string // HH:mm
  requestedClockOut?: string // HH:mm
  reason: string
  status: CorrectionStatus
  filedOn: string
}

// ---- Notifications / announcements ----

export type NotificationAudience = 'all' | 'admin' | 'manager' | 'employee'

export interface AppNotification {
  id: string
  title: string
  message: string
  audience: NotificationAudience
  postedBy: string
  postedOn: string // ISO datetime
  readBy: string[] // reader keys (employee id, or role name for admin/manager with no acting employee)
}

// ---- Personal account settings ----

export interface NotificationPrefs {
  leaveUpdates: boolean
  payrollUpdates: boolean
  announcements: boolean
}

export const defaultNotificationPrefs: NotificationPrefs = {
  leaveUpdates: true,
  payrollUpdates: true,
  announcements: true,
}
