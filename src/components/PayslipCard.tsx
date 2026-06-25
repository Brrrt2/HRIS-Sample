import { defineComponent, computed, type PropType } from 'vue'
import { computePayslip, peso } from '@/lib/payroll'
import type { PayFrequency } from '@/types'

export default defineComponent({
  name: 'PayslipCard',
  props: {
    name: { type: String, required: true },
    basic: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    period: { type: String, default: 'June 2026' },
    frequency: { type: String as PropType<PayFrequency>, default: 'monthly' },
  },
  setup(props) {
    const slip = computed(() => computePayslip(props.basic, props.allowances))
    const div = computed(() => (props.frequency === 'semi' ? 2 : 1))
    const v = (n: number): string => peso(n / div.value)

    return () => {
      const s = slip.value
      return (
        <div>
          <div class="row spread" style="margin-bottom: 4px">
            <strong>{props.name}</strong>
            <span class="muted" style="font-size: 12px">
              {props.period} · {props.frequency === 'semi' ? 'Semi-monthly' : 'Monthly'}
            </span>
          </div>

          <div class="slip-line head">
            <span>Earnings</span>
            <span></span>
          </div>
          <div class="slip-line">
            <span>Basic salary</span>
            <span>{v(s.basic)}</span>
          </div>
          <div class="slip-line">
            <span>Allowances / OT</span>
            <span>{v(s.allowances)}</span>
          </div>
          <div class="slip-line tot">
            <span>Gross pay</span>
            <span>{v(s.gross)}</span>
          </div>

          <div class="slip-line head">
            <span>Employee deductions</span>
            <span></span>
          </div>
          <div class="slip-line">
            <span>SSS (5% of MSC)</span>
            <span class="neg">− {v(s.sssEE)}</span>
          </div>
          <div class="slip-line">
            <span>PhilHealth (2.5%)</span>
            <span class="neg">− {v(s.philhealthEE)}</span>
          </div>
          <div class="slip-line">
            <span>Pag-IBIG (2%)</span>
            <span class="neg">− {v(s.pagibigEE)}</span>
          </div>
          <div class="slip-line">
            <span>Withholding tax (BIR)</span>
            <span class="neg">− {v(s.withholdingTax)}</span>
          </div>
          <div class="slip-line tot">
            <span>Total deductions</span>
            <span class="neg">− {v(s.totalDeductions)}</span>
          </div>

          <div class="net-box">
            <span>NET PAY</span>
            <span class="v">{v(s.netPay)}</span>
          </div>

          <div class="slip-line head">
            <span>Employer contributions</span>
            <span></span>
          </div>
          <div class="slip-line muted">
            <span>SSS (10% of MSC)</span>
            <span>{v(s.sssER)}</span>
          </div>
          <div class="slip-line muted">
            <span>PhilHealth (2.5%)</span>
            <span>{v(s.philhealthER)}</span>
          </div>
          <div class="slip-line muted">
            <span>Pag-IBIG (2%)</span>
            <span>{v(s.pagibigER)}</span>
          </div>
          <div class="slip-line muted" style="font-weight: 700">
            <span>Total cost to employer</span>
            <span>{v(s.employerCost)}</span>
          </div>
        </div>
      )
    }
  },
})
