import type { TimeLog } from '@/types'

export interface DtrRow {
  date: string
  clockIn: string
  clockOut: string
  hours: string
}

function fmtTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function hoursWorked(log: TimeLog): string {
  if (!log.clockIn || !log.clockOut) return '—'
  const ms = new Date(log.clockOut).getTime() - new Date(log.clockIn).getTime()
  return ms > 0 ? (ms / 3_600_000).toFixed(2) : '—'
}

export function toDtrRows(logs: TimeLog[]): DtrRow[] {
  return logs.map((l) => ({
    date: l.date,
    clockIn: fmtTime(l.clockIn),
    clockOut: fmtTime(l.clockOut),
    hours: hoursWorked(l),
  }))
}

/** Downloads the DTR as a CSV file that opens directly in Excel. */
export function downloadDtrExcel(rows: DtrRow[], employeeName: string): void {
  const header = ['Date', 'Time In', 'Time Out', 'Hours Worked']
  const escape = (v: string): string => `"${v.replace(/"/g, '""')}"`
  const lines = [header, ...rows.map((r) => [r.date, r.clockIn, r.clockOut, r.hours])]
    .map((cols) => cols.map(escape).join(','))
    .join('\r\n')
  const blob = new Blob(['﻿' + lines], { type: 'application/vnd.ms-excel' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `DTR-${employeeName.replace(/\s+/g, '_')}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Opens a print-ready DTR in a new tab; the user can "Save as PDF" from the print dialog. */
export function printDtrPdf(rows: DtrRow[], employeeName: string, period: string): void {
  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  const rowsHtml = rows
    .map((r) => `<tr><td>${r.date}</td><td>${r.clockIn}</td><td>${r.clockOut}</td><td>${r.hours}</td></tr>`)
    .join('')
  win.document.write(`<!doctype html>
<html>
<head>
<title>DTR - ${employeeName}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; padding: 28px; color: #111; }
  h1 { font-size: 19px; margin-bottom: 2px; }
  p.meta { margin: 0 0 18px; color: #555; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 7px 10px; font-size: 12.5px; text-align: left; }
  th { background: #f2f2f2; text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; }
  td:nth-child(n+2) { text-align: right; }
  th:nth-child(n+2) { text-align: right; }
</style>
</head>
<body>
  <h1>Daily Time Record</h1>
  <p class="meta">${employeeName} &middot; ${period}</p>
  <table>
    <thead><tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours Worked</th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="4" style="text-align:center;color:#888">No records for this period.</td></tr>'}</tbody>
  </table>
</body>
</html>`)
  win.document.close()
  win.focus()
  win.print()
}
