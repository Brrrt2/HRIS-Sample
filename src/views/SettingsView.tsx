import { defineComponent } from 'vue'
import { useHrisStore } from '@/stores/hris'
import { onText } from '@/lib/form'
import type { PayFrequency } from '@/types'
import Icon from '@/components/Icon'

export default defineComponent({
  name: 'SettingsView',
  setup() {
    const store = useHrisStore()

    function reset(): void {
      if (confirm('Reset all data back to the seeded demo? This clears your changes.')) {
        store.resetDemo()
      }
    }

    return () => (
      <div class="grid two">
        <div>
          <div class="card pad mb">
            <div class="card-h" style="border: none; padding: 0 0 14px">
              Company
            </div>
            <div class="field">
              <label>Company name</label>
              <input
                value={store.settings.companyName}
                onInput={onText((v) => (store.settings.companyName = v))}
              />
            </div>
            <div class="field">
              <label>Default payroll frequency</label>
              <select
                value={store.settings.defaultFrequency}
                onChange={onText((v) => (store.settings.defaultFrequency = v as PayFrequency))}
              >
                <option value="monthly">Monthly</option>
                <option value="semi">Semi-monthly</option>
              </select>
            </div>
            <p class="muted" style="font-size: 13px">
              Changes save automatically to your browser's local storage.
            </p>
          </div>

          <div class="card pad">
            <div class="card-h" style="border: none; padding: 0 0 14px">
              Demo data
            </div>
            <p class="muted" style="font-size: 13px; margin-bottom: 14px">
              {store.employees.length} employees · {store.leaves.length} leave requests ·{' '}
              {store.payrollRuns.length} payroll runs stored.
            </p>
            <button class="btn danger" onClick={reset}>
              <Icon name="refresh" size={14} /> Reset to seeded demo
            </button>
          </div>
        </div>

        <div class="card pad">
          <div class="card-h" style="border: none; padding: 0 0 14px">
            2026 statutory reference
          </div>
          <table style="border: 1px solid var(--line); border-radius: 10px; overflow: hidden">
            <thead>
              <tr>
                <th>Contribution</th>
                <th>Rate</th>
                <th>Cap</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SSS (employee)</td>
                <td>5% of MSC</td>
                <td>MSC ₱5k–₱35k</td>
              </tr>
              <tr>
                <td>SSS (employer)</td>
                <td>10% of MSC</td>
                <td>+ EC</td>
              </tr>
              <tr>
                <td>PhilHealth</td>
                <td>5% (2.5% each)</td>
                <td>₱10k–₱100k</td>
              </tr>
              <tr>
                <td>Pag-IBIG</td>
                <td>2% + 2%</td>
                <td>₱10k salary cap</td>
              </tr>
              <tr>
                <td>BIR withholding</td>
                <td>0%–35%</td>
                <td>TRAIN monthly table</td>
              </tr>
              <tr>
                <td>13th month</td>
                <td>Total basic ÷ 12</td>
                <td>₱90k tax-exempt</td>
              </tr>
            </tbody>
          </table>
          <p class="muted" style="font-size: 12px; margin-top: 14px; line-height: 1.5">
            Rates reflect published 2026 SSS, PhilHealth, Pag-IBIG and BIR (TRAIN law) schedules,
            simplified for demonstration. Confirm final amounts against official government tables
            before remitting.
          </p>
        </div>
      </div>
    )
  },
})
