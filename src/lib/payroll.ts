/**
 * Philippine statutory payroll engine — 2026 schedules.
 *
 * Sources (published 2026 rates):
 *  - SSS: total 15% of Monthly Salary Credit (MSC), employee 5% / employer 10%.
 *         MSC floor PHP 5,000, ceiling PHP 35,000 (PHP 500 brackets). RA 11199.
 *  - PhilHealth: 5% premium of monthly basic, split 50/50 (2.5% each).
 *         Salary floor PHP 10,000, ceiling PHP 100,000. Universal Health Care Act.
 *  - Pag-IBIG (HDMF): 2% employee + 2% employer, monthly fund salary cap PHP 10,000
 *         (max PHP 200 each). 1% employee rate if monthly pay <= PHP 1,500.
 *  - BIR withholding: TRAIN law (RA 10963) monthly table, 2023+ phase-2 rates.
 *
 * Figures are simplified for an HRIS demo; confirm against official tables before remitting.
 */

export interface ShareEE_ER {
  employee: number
  employer: number
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

// ---------- SSS ----------
export const SSS_RATE_TOTAL = 0.15
export const SSS_RATE_EE = 0.05
export const SSS_RATE_ER = 0.1
export const SSS_MSC_FLOOR = 5000
export const SSS_MSC_CEIL = 35000

/** Resolve a salary to its SSS Monthly Salary Credit bracket (PHP 500 steps). */
export function sssMSC(salary: number): number {
  const bracket = Math.round(salary / 500) * 500
  return Math.min(SSS_MSC_CEIL, Math.max(SSS_MSC_FLOOR, bracket))
}

export function sss(salary: number): ShareEE_ER & { msc: number } {
  const msc = sssMSC(salary)
  return {
    msc,
    employee: round2(msc * SSS_RATE_EE),
    employer: round2(msc * SSS_RATE_ER),
  }
}

// ---------- PhilHealth ----------
export const PHIC_RATE = 0.05
export const PHIC_FLOOR = 10000
export const PHIC_CEIL = 100000

export function philhealth(salary: number): ShareEE_ER & { total: number } {
  const base = Math.min(PHIC_CEIL, Math.max(PHIC_FLOOR, salary))
  const total = round2(base * PHIC_RATE)
  const half = round2(total / 2)
  return { total, employee: half, employer: round2(total - half) }
}

// ---------- Pag-IBIG ----------
export const PAGIBIG_CAP = 10000

export function pagibig(salary: number): ShareEE_ER {
  const base = Math.min(salary, PAGIBIG_CAP)
  const eeRate = salary <= 1500 ? 0.01 : 0.02
  return {
    employee: round2(base * eeRate),
    employer: round2(base * 0.02),
  }
}

// ---------- BIR withholding tax (monthly, TRAIN phase 2) ----------
export function withholdingTax(monthlyTaxable: number): number {
  const t = monthlyTaxable
  if (t <= 20833) return 0
  if (t <= 33332) return round2((t - 20833) * 0.15)
  if (t <= 66666) return round2(1875 + (t - 33333) * 0.2)
  if (t <= 166666) return round2(8541.8 + (t - 66667) * 0.25)
  if (t <= 666666) return round2(33541.8 + (t - 166667) * 0.3)
  return round2(183541.8 + (t - 666667) * 0.35)
}

// ---------- Full payslip ----------
export interface PayslipResult {
  basic: number
  allowances: number
  gross: number
  sssEE: number
  philhealthEE: number
  pagibigEE: number
  taxableIncome: number
  withholdingTax: number
  totalDeductions: number
  netPay: number
  sssER: number
  philhealthER: number
  pagibigER: number
  employerCost: number
}

export function computePayslip(basic: number, allowances = 0): PayslipResult {
  const s = sss(basic)
  const ph = philhealth(basic)
  const pi = pagibig(basic)
  const gross = round2(basic + allowances)
  const taxableIncome = round2(Math.max(0, gross - s.employee - ph.employee - pi.employee))
  const tax = withholdingTax(taxableIncome)
  const totalDeductions = round2(s.employee + ph.employee + pi.employee + tax)
  const netPay = round2(gross - totalDeductions)
  const employerCost = round2(gross + s.employer + ph.employer + pi.employer)
  return {
    basic,
    allowances,
    gross,
    sssEE: s.employee,
    philhealthEE: ph.employee,
    pagibigEE: pi.employee,
    taxableIncome,
    withholdingTax: tax,
    totalDeductions,
    netPay,
    sssER: s.employer,
    philhealthER: ph.employer,
    pagibigER: pi.employer,
    employerCost,
  }
}

/** Pro-rated 13th month pay = total basic earned in the year / 12. */
export function thirteenthMonth(monthlyBasic: number, monthsWorked = 12): number {
  return round2((monthlyBasic * monthsWorked) / 12)
}

export const peso = (n: number): string =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
