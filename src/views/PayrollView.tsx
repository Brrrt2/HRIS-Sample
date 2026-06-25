import { defineComponent, ref, computed } from 'vue'
import { useHrisStore } from '@/stores/hris'
import { peso } from '@/lib/payroll'
import { onText, onSelf } from '@/lib/form'
import type { PayFrequency, PayrollRun } from '@/types'
import PayslipCard from '@/components/PayslipCard'
import Icon from '@/components/Icon'

const runTotals = (run: PayrollRun) => ({
  gross: run.items.reduce((s, i) => s + i.gross, 0),
  ded: run.items.reduce((s, i) => s + i.totalDeductions, 0),
  net: run.items.reduce((s, i) => s + i.netPay, 0),
  cost: run.items.reduce((s, i) => s + i.employerCost, 0),
})

function exportCsv(r: PayrollRun): void {
  const head = ['Employee', 'Basic', 'Gross', 'SSS', 'PhilHealth', 'Pag-IBIG', 'Tax', 'Deductions', 'Net', 'Employer cost']
  const rows = r.items.map((i) =>
    [i.employeeName, i.basic, i.gross, i.sssEE, i.philhealthEE, i.pagibigEE, i.withholdingTax, i.totalDeductions, i.netPay, i.employerCost].join(','),
  )
  const csv = [head.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `payroll-${r.period.replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default defineComponent({
  name: 'PayrollView',
  setup() {
    const store = useHrisStore()

    const frequency = ref<PayFrequency>(store.settings.defaultFrequency)
    const period = ref('June 2026')
    const viewing = ref<PayrollRun | null>(null)
    const payslipFor = ref<{ name: string; basic: number } | null>(null)

    const div = computed(() => (viewing.value?.frequency === 'semi' ? 2 : 1))
    const v = (n: number): string => peso(n / div.value)

    function run(): void {
      viewing.value = store.runPayroll(period.value, frequency.value)
    }

    return () => (
      <>
        <div class="card pad mb">
          <div class="row gap wrapf spread">
            <div class="row gap wrapf">
              <div class="field" style="margin: 0">
                <label>Pay period</label>
                <input value={period.value} onInput={onText((x) => (period.value = x))} style="width: 160px" />
              </div>
              <div class="field" style="margin: 0">
                <label>Frequency</label>
                <select
                  value={frequency.value}
                  onChange={onText((x) => (frequency.value = x as PayFrequency))}
                >
                  <option value="monthly">Monthly</option>
                  <option value="semi">Semi-monthly (÷2)</option>
                </select>
              </div>
            </div>
            <div style="align-self: flex-end">
              <button class="btn green" onClick={run}>
                <Icon name="play" size={13} /> Run payroll for {store.activeEmployees.length} employees
              </button>
            </div>
          </div>
        </div>

        <div class="card mb">
          <div class="card-h">
            <span>
              {viewing.value
                ? `Payroll register — ${viewing.value.period} (${viewing.value.frequency === 'semi' ? 'Semi-monthly' : 'Monthly'})`
                : 'Live preview — current roster'}
            </span>
            {viewing.value && (
              <button class="btn sm ghost" onClick={() => exportCsv(viewing.value as PayrollRun)}>
                <Icon name="download" size={14} /> Export CSV
              </button>
            )}
          </div>

          {viewing.value ? (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th class="num">Gross</th>
                  <th class="num">SSS</th>
                  <th class="num">PhilHealth</th>
                  <th class="num">Pag-IBIG</th>
                  <th class="num">Tax</th>
                  <th class="num">Net pay</th>
                </tr>
              </thead>
              <tbody>
                {viewing.value.items.map((i) => (
                  <tr
                    key={i.employeeId}
                    class="clickable"
                    onClick={() => (payslipFor.value = { name: i.employeeName, basic: i.basic })}
                  >
                    <td>{i.employeeName}</td>
                    <td class="num">{v(i.gross)}</td>
                    <td class="num neg">{v(i.sssEE)}</td>
                    <td class="num neg">{v(i.philhealthEE)}</td>
                    <td class="num neg">{v(i.pagibigEE)}</td>
                    <td class="num neg">{v(i.withholdingTax)}</td>
                    <td class="num">
                      <strong>{v(i.netPay)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style="background: var(--surface-2); font-weight: 800">
                  <td>Totals ({viewing.value.items.length})</td>
                  <td class="num">{v(runTotals(viewing.value).gross)}</td>
                  <td colspan="3" class="num muted">
                    deductions {v(runTotals(viewing.value).ded)}
                  </td>
                  <td class="num muted">cost {v(runTotals(viewing.value).cost)}</td>
                  <td class="num">{v(runTotals(viewing.value).net)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th class="num">Monthly basic</th>
                  </tr>
                </thead>
                <tbody>
                  {store.activeEmployees.map((e) => (
                    <tr
                      key={e.id}
                      class="clickable"
                      onClick={() => (payslipFor.value = { name: store.fullName(e), basic: e.monthlyBasic })}
                    >
                      <td>{store.fullName(e)}</td>
                      <td>{e.department}</td>
                      <td class="num">{peso(e.monthlyBasic)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div class="empty" style="padding: 16px">
                Click <strong>Run payroll</strong> to generate the register, or click any employee to preview their payslip.
              </div>
            </>
          )}
        </div>

        {store.payrollRuns.length > 0 && (
          <div class="card">
            <div class="card-h">Payroll history</div>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Frequency</th>
                  <th>Run on</th>
                  <th class="num">Net total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {store.payrollRuns.map((r) => (
                  <tr key={r.id}>
                    <td>{r.period}</td>
                    <td>{r.frequency === 'semi' ? 'Semi-monthly' : 'Monthly'}</td>
                    <td class="muted">{r.createdOn}</td>
                    <td class="num">{peso(runTotals(r).net / (r.frequency === 'semi' ? 2 : 1))}</td>
                    <td class="num">
                      <button class="btn sm ghost" onClick={() => (viewing.value = r)}>
                        View
                      </button>
                      <button class="btn sm danger" onClick={() => store.deletePayrollRun(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payslipFor.value && (
          <div class="overlay" onClick={onSelf(() => (payslipFor.value = null))}>
            <div class="modal">
              <div class="modal-h">
                <h3>Payslip</h3>
                <button class="x" onClick={() => (payslipFor.value = null)}>
                  ×
                </button>
              </div>
              <div class="modal-b">
                <PayslipCard
                  name={payslipFor.value.name}
                  basic={payslipFor.value.basic}
                  period={period.value}
                  frequency={frequency.value}
                />
              </div>
              <div class="modal-f">
                <button class="btn" onClick={() => (payslipFor.value = null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  },
})
