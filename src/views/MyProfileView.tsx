import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSession } from '@/stores/session'
import { useDocStore } from '@/stores/documents'
import { REQUIRED_DOCS } from '@/types'
import Icon from '@/components/Icon'

export default defineComponent({
  name: 'MyProfileView',
  setup() {
    const session = useSession()
    const docs = useDocStore()
    const router = useRouter()
    const me = computed(() => session.current)

    const docCount = computed(() => (me.value ? docs.byEmployee(me.value.id).length : 0))
    const requiredOnFile = computed(() =>
      me.value ? REQUIRED_DOCS.filter((c) => docs.hasCategory(me.value!.id, c)).length : 0,
    )

    return () => {
      const emp = me.value
      if (!emp) return <div class="card empty">No employee selected.</div>

      const rows: Array<[string, string]> = [
        ['Position', emp.position],
        ['Department', emp.department],
        ['Email', emp.email],
        ['Date hired', emp.dateHired],
        ['SSS No.', emp.sssNo],
        ['PhilHealth No.', emp.philhealthNo],
        ['Pag-IBIG MID', emp.pagibigNo],
        ['TIN', emp.tin],
      ]

      return (
        <div class="grid two">
          <div class="card pad">
            <div class="row gap" style="margin-bottom: 16px">
              <span
                class="av"
                style="width:54px;height:54px;font-size:20px;border-radius:14px"
              >
                {(emp.firstName[0] + emp.lastName[0]).toUpperCase()}
              </span>
              <div>
                <div style="font-size: 19px; font-weight: 800">
                  {emp.firstName} {emp.lastName}
                </div>
                <div class="muted">{emp.position}</div>
              </div>
            </div>
            <table style="border: 1px solid var(--border); border-radius: 12px; overflow: hidden">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <th style="width: 42%">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p class="muted" style="font-size: 12px; margin-top: 12px">
              To correct any personal details, please contact your HR department.
            </p>
          </div>

          <div>
            <div class="grid stats mb" style="grid-template-columns: 1fr 1fr">
              <div class="card stat">
                <div class="label">Vacation leave</div>
                <div class="val">{emp.vlBalance}</div>
                <div class="sub">days remaining</div>
              </div>
              <div class="card stat">
                <div class="label">Sick leave</div>
                <div class="val">{emp.slBalance}</div>
                <div class="sub">days remaining</div>
              </div>
            </div>
            <div class="card pad">
              <div class="card-h" style="border: none; padding: 0 0 12px">
                My 201 documents
              </div>
              <p class="muted" style="font-size: 13.5px; margin-bottom: 14px">
                You have <strong>{docCount.value}</strong> document(s) on file, with{' '}
                <strong>
                  {requiredOnFile.value}/{REQUIRED_DOCS.length}
                </strong>{' '}
                required documents submitted.
              </p>
              <button class="btn" onClick={() => void router.push('/documents')}>
                <Icon name="folder" size={15} /> Manage my documents
              </button>
            </div>
          </div>
        </div>
      )
    }
  },
})
