import { defineComponent, computed } from 'vue'
import { useSession } from '@/stores/session'
import { computePayslip, peso } from '@/lib/payroll'
import PayslipCard from '@/components/PayslipCard'
import Icon from '@/components/Icon'

export default defineComponent({
  name: 'MyPayView',
  setup() {
    const session = useSession()
    const me = computed(() => session.current)
    const slip = computed(() => (me.value ? computePayslip(me.value.monthlyBasic) : null))

    return () => {
      const emp = me.value
      if (!emp || !slip.value) {
        return <div class="card empty">No employee selected.</div>
      }
      return (
        <>
          <div class="grid stats mb">
            <div class="card stat">
              <div class="ic">
                <Icon name="banknote" size={21} />
              </div>
              <div class="label">Net pay (monthly)</div>
              <div class="val">{peso(slip.value.netPay)}</div>
              <div class="sub">after statutory deductions</div>
            </div>
            <div class="card stat">
              <div class="ic">
                <Icon name="wallet" size={21} />
              </div>
              <div class="label">Gross pay</div>
              <div class="val">{peso(slip.value.gross)}</div>
              <div class="sub">basic + allowances</div>
            </div>
            <div class="card stat">
              <div class="ic">
                <Icon name="shield" size={21} />
              </div>
              <div class="label">Total deductions</div>
              <div class="val">{peso(slip.value.totalDeductions)}</div>
              <div class="sub">SSS · PhilHealth · Pag-IBIG · tax</div>
            </div>
            <div class="card stat">
              <div class="ic">
                <Icon name="calendar" size={21} />
              </div>
              <div class="label">Leave credits</div>
              <div class="val">
                {emp.vlBalance}/{emp.slBalance}
              </div>
              <div class="sub">VL / SL days left</div>
            </div>
          </div>

          <div class="grid two">
            <div class="card pad">
              <div class="card-h" style="border: none; padding: 0 0 12px">
                Latest payslip
              </div>
              <PayslipCard name={`${emp.firstName} ${emp.lastName}`} basic={emp.monthlyBasic} />
            </div>
            <div class="card pad" style="align-self: start">
              <div class="card-h" style="border: none; padding: 0 0 12px">
                How your pay is computed
              </div>
              <p class="muted" style="font-size: 13.5px; line-height: 1.6">
                Your employer deducts the mandatory Philippine government contributions from your
                gross pay each cutoff: <strong>SSS</strong> (5% of your salary credit),{' '}
                <strong>PhilHealth</strong> (2.5%), and <strong>Pag-IBIG</strong> (2%, up to ₱200).
                Your taxable income is what remains, and <strong>BIR withholding tax</strong> is
                applied on that using the TRAIN-law table. Whatever is left is your net take-home
                pay shown on the left.
              </p>
              <p class="muted" style="font-size: 12px; margin-top: 14px">
                Figures use 2026 statutory rates and are for reference. Your official payslip from HR
                is the final record.
              </p>
            </div>
          </div>
        </>
      )
    }
  },
})
