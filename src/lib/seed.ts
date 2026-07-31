import type {
  Employee,
  LeaveRequest,
  CompanySettings,
  TimeLog,
  OvertimeRequest,
  AttendanceCorrection,
  AppNotification,
} from '@/types'

export const defaultSettings: CompanySettings = {
  companyName: 'Mabuhay Foods Inc.',
  defaultFrequency: 'monthly',
}

export function seedEmployees(): Employee[] {
  return [
    {
      id: 'e1', firstName: 'Juan', lastName: 'Dela Cruz', position: 'Operations Manager',
      department: 'Operations', email: 'juan.delacruz@mabuhay.ph', monthlyBasic: 30000,
      dateHired: '2019-03-04', status: 'active',
      sssNo: '34-1234567-8', philhealthNo: '12-345678901-2', pagibigNo: '1234-5678-9012', tin: '123-456-789-000',
      vlBalance: 9, slBalance: 11,
    },
    {
      id: 'e2', firstName: 'Maria Clara', lastName: 'Reyes', position: 'HR Officer',
      department: 'People', email: 'mc.reyes@mabuhay.ph', monthlyBasic: 24000,
      dateHired: '2021-07-12', status: 'active',
      sssNo: '34-2234567-8', philhealthNo: '12-245678901-2', pagibigNo: '2234-5678-9012', tin: '223-456-789-000',
      vlBalance: 13, slBalance: 14,
    },
    {
      id: 'e3', firstName: 'Jose Rizal', lastName: 'Santos', position: 'Senior Accountant',
      department: 'Finance', email: 'jr.santos@mabuhay.ph', monthlyBasic: 42000,
      dateHired: '2018-01-15', status: 'active',
      sssNo: '34-3234567-8', philhealthNo: '12-345678911-2', pagibigNo: '3234-5678-9012', tin: '323-456-789-000',
      vlBalance: 6, slBalance: 15,
    },
    {
      id: 'e4', firstName: 'Andres', lastName: 'Bonifacio', position: 'Warehouse Lead',
      department: 'Logistics', email: 'a.bonifacio@mabuhay.ph', monthlyBasic: 18500,
      dateHired: '2022-09-01', status: 'active',
      sssNo: '34-4234567-8', philhealthNo: '12-445678901-2', pagibigNo: '4234-5678-9012', tin: '423-456-789-000',
      vlBalance: 10, slBalance: 12,
    },
    {
      id: 'e5', firstName: 'Gabriela', lastName: 'Silang', position: 'Marketing Associate',
      department: 'Marketing', email: 'g.silang@mabuhay.ph', monthlyBasic: 21000,
      dateHired: '2023-02-20', status: 'on_leave',
      sssNo: '34-5234567-8', philhealthNo: '12-545678901-2', pagibigNo: '5234-5678-9012', tin: '523-456-789-000',
      vlBalance: 4, slBalance: 9,
    },
    {
      id: 'e6', firstName: 'Emilio', lastName: 'Aguinaldo', position: 'Sales Executive',
      department: 'Sales', email: 'e.aguinaldo@mabuhay.ph', monthlyBasic: 16000,
      dateHired: '2024-05-06', status: 'active',
      sssNo: '34-6234567-8', philhealthNo: '12-645678901-2', pagibigNo: '6234-5678-9012', tin: '623-456-789-000',
      vlBalance: 8, slBalance: 10,
    },
    {
      id: 'e7', firstName: 'Melchora', lastName: 'Aquino', position: 'Admin Assistant',
      department: 'Admin', email: 'm.aquino@mabuhay.ph', monthlyBasic: 15000,
      dateHired: '2024-11-18', status: 'active',
      sssNo: '34-7234567-8', philhealthNo: '12-745678901-2', pagibigNo: '7234-5678-9012', tin: '723-456-789-000',
      vlBalance: 7, slBalance: 8,
    },
  ]
}

export function seedLeaves(): LeaveRequest[] {
  return [
    {
      id: 'l1', employeeId: 'e5', type: 'Vacation Leave', startDate: '2026-06-24',
      endDate: '2026-06-26', days: 3, reason: 'Family trip to Baguio', status: 'approved', filedOn: '2026-06-10',
    },
    {
      id: 'l2', employeeId: 'e6', type: 'Sick Leave', startDate: '2026-06-22',
      endDate: '2026-06-22', days: 1, reason: 'Flu / fever', status: 'pending', filedOn: '2026-06-21',
    },
    {
      id: 'l3', employeeId: 'e4', type: 'Service Incentive Leave', startDate: '2026-06-30',
      endDate: '2026-06-30', days: 1, reason: 'Personal errand', status: 'pending', filedOn: '2026-06-20',
    },
    {
      id: 'l4', employeeId: 'e2', type: 'Vacation Leave', startDate: '2026-06-12',
      endDate: '2026-06-13', days: 2, reason: 'Hometown fiesta', status: 'approved', filedOn: '2026-06-01',
    },
  ]
}

export function seedTimeLogs(): TimeLog[] {
  const mk = (id: string, employeeId: string, date: string, clockIn: string, clockOut: string): TimeLog => ({
    id, employeeId, date, clockIn: `${date}T${clockIn}:00`, clockOut: `${date}T${clockOut}:00`,
  })
  return [
    mk('t1', 'e1', '2026-06-29', '08:58', '18:05'),
    mk('t2', 'e1', '2026-06-30', '09:02', '18:00'),
    mk('t3', 'e2', '2026-06-29', '08:55', '17:58'),
    mk('t4', 'e2', '2026-06-30', '08:59', '18:10'),
    mk('t5', 'e4', '2026-06-29', '07:58', '17:02'),
    mk('t6', 'e4', '2026-06-30', '08:01', '17:00'),
    mk('t7', 'e6', '2026-06-30', '09:05', '18:03'),
  ]
}

export function seedOvertime(): OvertimeRequest[] {
  return [
    {
      id: 'ot1', employeeId: 'e4', date: '2026-06-27', startTime: '18:00', endTime: '20:00',
      hours: 2, reason: 'Inventory count for month-end', status: 'pending', filedOn: '2026-06-27',
    },
  ]
}

export function seedCorrections(): AttendanceCorrection[] {
  return [
    {
      id: 'c1', employeeId: 'e6', date: '2026-06-26', field: 'clockIn', requestedClockIn: '09:00',
      reason: 'Biometric scanner was offline at time-in', status: 'pending', filedOn: '2026-06-26',
    },
  ]
}

export function seedNotifications(): AppNotification[] {
  const now = Date.now()
  const daysAgo = (n: number): string => new Date(now - n * 86400000).toISOString()
  return [
    {
      id: 'n1',
      title: 'Payroll cutoff moved to June 28',
      message:
        "Due to the holiday, this cutoff's payroll will be processed a day early. Please file any pending leave, overtime, or attendance correction requests before end of day.",
      audience: 'all', postedBy: 'HR / Admin', postedOn: daysAgo(1), readBy: [],
    },
    {
      id: 'n2',
      title: 'Reminder: submit missing 201 documents',
      message: 'A few employees are still missing required 201 file documents. Please upload them via the Documents tab.',
      audience: 'employee', postedBy: 'HR / Admin', postedOn: daysAgo(3), readBy: [],
    },
  ]
}
