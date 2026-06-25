import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHrisStore } from '@/stores/hris'
import { peso } from '@/lib/payroll'
import Icon from '@/components/Icon'

const COLORS = ['#1769aa', '#ce1126', '#15803d', '#b45309', '#6d28d9', '#0e7490']
const initials = (f: string, l: string): string => (f[0] + l[0]).toUpperCase()

export default defineComponent({
  name: 'DashboardView',
  setup() {
    const store = useHrisStore()
    const router = useRouter()

    const recentHires = computed(() =>
      [...store.employees]
        .filter((e) => e.status !== 'resigned')
        .sort((a, b) => b.dateHired.localeCompare(a.dateHired))
        .slice(0, 5),
    )
    const maxDept = computed(() => Math.max(1, ...store.departments.map((d) => d.count)))

    return () => (
      <>
        <div class="grid stats mb">
          <div class="card stat">
            <div class="ic">
              <Icon name="users" size={21} />
            </div>
            <div class="label">Headcount</div>
            <div class="val">{store.headcount}</div>
            <div class="sub">{store.onLeaveToday} on leave today</div>
          </div>
          <div class="card stat">
            <div class="ic">
              <Icon name="banknote" size={21} />
            </div>
            <div class="label">Monthly payroll cost</div>
            <div class="val">{peso(store.monthlyPayrollCost)}</div>
            <div class="sub">incl. employer contributions</div>
          </div>
          <div class="card stat">
            <div class="ic">
              <Icon name="wallet" size={21} />
            </div>
            <div class="label">Net pay / month</div>
            <div class="val">{peso(store.monthlyNetTotal)}</div>
            <div class="sub">take-home across staff</div>
          </div>
          <div class="card stat">
            <div class="ic">
              <Icon name="clipboard" size={21} />
            </div>
            <div class="label">Pending leaves</div>
            <div class="val">{store.pendingLeaves.length}</div>
            <div class="sub">awaiting approval</div>
          </div>
        </div>

        <div class="grid two">
          <div class="card">
            <div class="card-h">Headcount by department</div>
            <div style="padding: 18px 20px">
              {store.departments.map((d) => (
                <div key={d.name} style="margin-bottom: 13px">
                  <div class="row spread" style="font-size: 13px; margin-bottom: 4px">
                    <span>{d.name}</span>
                    <strong>{d.count}</strong>
                  </div>
                  <div style="height: 8px; background: var(--track); border-radius: 6px; overflow: hidden">
                    <div
                      style={{
                        width: (d.count / maxDept.value) * 100 + '%',
                        height: '100%',
                        borderRadius: '6px',
                        background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2))',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="card">
            <div class="card-h">
              Recent hires
              <button class="btn sm ghost" onClick={() => router.push('/employees')}>
                View all
              </button>
            </div>
            <table>
              <tbody>
                {recentHires.value.map((e, i) => (
                  <tr key={e.id} class="clickable" onClick={() => router.push('/employees')}>
                    <td>
                      <span class="av-sm" style={{ background: COLORS[i % COLORS.length] }}>
                        {initials(e.firstName, e.lastName)}
                      </span>
                      {e.firstName} {e.lastName}
                    </td>
                    <td class="muted">{e.position}</td>
                    <td class="num muted">{e.dateHired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  },
})
