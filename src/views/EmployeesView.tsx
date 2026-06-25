import { defineComponent, ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useHrisStore } from '@/stores/hris'
import { useDocStore } from '@/stores/documents'
import { useSession } from '@/stores/session'
import { peso } from '@/lib/payroll'
import { onText, onNum, onSelf } from '@/lib/form'
import { REQUIRED_DOCS, type Employee, type EmploymentStatus } from '@/types'
import PayslipCard from '@/components/PayslipCard'
import Icon from '@/components/Icon'

const COLORS = ['#1769aa', '#ce1126', '#15803d', '#b45309', '#6d28d9', '#0e7490']
const initials = (f: string, l: string): string => (f[0] + l[0]).toUpperCase()

const statusChip = (s: EmploymentStatus): { cls: string; text: string } => {
  if (s === 'active') return { cls: 'green', text: 'Active' }
  if (s === 'on_leave') return { cls: 'amber', text: 'On leave' }
  return { cls: 'gray', text: 'Resigned' }
}

const blank = (): Omit<Employee, 'id'> => ({
  firstName: '', lastName: '', position: '', department: '', email: '',
  monthlyBasic: 18000, dateHired: new Date().toISOString().slice(0, 10), status: 'active',
  sssNo: '', philhealthNo: '', pagibigNo: '', tin: '', vlBalance: 15, slBalance: 15,
})

export default defineComponent({
  name: 'EmployeesView',
  setup() {
    const store = useHrisStore()
    const docs = useDocStore()
    const session = useSession()
    const router = useRouter()

    const cols = computed(
      () => 4 + (session.canSeeAllSalaries ? 1 : 0) + (session.canManageEmployees ? 1 : 0),
    )

    const search = ref('')
    const deptFilter = ref('')
    const detail = ref<Employee | null>(null)
    const showForm = ref(false)
    const editingId = ref<string | null>(null)
    const form = reactive<Omit<Employee, 'id'>>(blank())

    const allDepts = computed(() =>
      [...new Set(session.scopedEmployees.map((e) => e.department))].sort(),
    )

    const filtered = computed(() => {
      const q = search.value.trim().toLowerCase()
      return session.scopedEmployees.filter((e) => {
        const matchesQ =
          !q || `${e.firstName} ${e.lastName} ${e.position} ${e.email}`.toLowerCase().includes(q)
        const matchesD = !deptFilter.value || e.department === deptFilter.value
        return matchesQ && matchesD
      })
    })

    function openAdd(): void {
      editingId.value = null
      Object.assign(form, blank())
      showForm.value = true
    }
    function openEdit(emp: Employee): void {
      editingId.value = emp.id
      const { id: _id, ...rest } = emp
      void _id
      Object.assign(form, rest)
      detail.value = null
      showForm.value = true
    }
    function save(): void {
      if (!form.firstName || !form.lastName) return
      if (editingId.value) store.updateEmployee(editingId.value, { ...form })
      else store.addEmployee({ ...form })
      showForm.value = false
    }
    function confirmRemove(emp: Employee): void {
      if (confirm(`Remove ${emp.firstName} ${emp.lastName} from the roster?`)) {
        store.removeEmployee(emp.id)
        detail.value = null
      }
    }

    const renderDetail = (emp: Employee) => (
      <div class="overlay" onClick={onSelf(() => (detail.value = null))}>
        <div class="modal wide">
          <div class="modal-h">
            <h3>
              {emp.firstName} {emp.lastName} — 201 File
            </h3>
            <button class="x" onClick={() => (detail.value = null)}>
              ×
            </button>
          </div>
          <div class="modal-b">
            <div class={['grid', session.canSeeAllSalaries ? 'two' : '']}>
              <div>
                <div class="card-h" style="border: none; padding: 0 0 10px">
                  Employment details
                </div>
                <table style="border: 1px solid var(--line); border-radius: 10px; overflow: hidden">
                  <tbody>
                    <tr>
                      <th style="width: 45%">Position</th>
                      <td>{emp.position}</td>
                    </tr>
                    <tr>
                      <th>Department</th>
                      <td>{emp.department}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{emp.email}</td>
                    </tr>
                    <tr>
                      <th>Date hired</th>
                      <td>{emp.dateHired}</td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>
                        <span class={['chip', statusChip(emp.status).cls]}>
                          {statusChip(emp.status).text}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th>SSS No.</th>
                      <td>{emp.sssNo}</td>
                    </tr>
                    <tr>
                      <th>PhilHealth No.</th>
                      <td>{emp.philhealthNo}</td>
                    </tr>
                    <tr>
                      <th>Pag-IBIG MID</th>
                      <td>{emp.pagibigNo}</td>
                    </tr>
                    <tr>
                      <th>TIN</th>
                      <td>{emp.tin}</td>
                    </tr>
                    <tr>
                      <th>VL / SL balance</th>
                      <td>
                        {emp.vlBalance} / {emp.slBalance} days
                      </td>
                    </tr>
                    <tr>
                      <th>201 documents</th>
                      <td>
                        {docs.byEmployee(emp.id).length} file(s) ·{' '}
                        {REQUIRED_DOCS.filter((c) => docs.hasCategory(emp.id, c)).length}/
                        {REQUIRED_DOCS.length} required on file
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {session.canSeeAllSalaries && (
                <div>
                  <div class="card-h" style="border: none; padding: 0 0 10px">
                    Monthly payslip
                  </div>
                  <PayslipCard name={`${emp.firstName} ${emp.lastName}`} basic={emp.monthlyBasic} />
                </div>
              )}
            </div>
          </div>
          <div class="modal-f">
            {session.canManageEmployees && (
              <button class="btn danger" onClick={() => confirmRemove(emp)}>
                Remove
              </button>
            )}
            <button
              class="btn ghost"
              onClick={() => {
                detail.value = null
                void router.push(`/documents?emp=${emp.id}`)
              }}
            >
              <Icon name="folder" size={15} /> Documents
            </button>
            {session.canManageEmployees && (
              <button class="btn ghost" onClick={() => openEdit(emp)}>
                Edit
              </button>
            )}
            <button class="btn" onClick={() => (detail.value = null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    )

    const renderForm = () => (
      <div class="overlay" onClick={onSelf(() => (showForm.value = false))}>
        <div class="modal">
          <div class="modal-h">
            <h3>{editingId.value ? 'Edit employee' : 'Add employee'}</h3>
            <button class="x" onClick={() => (showForm.value = false)}>
              ×
            </button>
          </div>
          <div class="modal-b">
            <div class="form-grid">
              <div class="field">
                <label>First name</label>
                <input value={form.firstName} onInput={onText((v) => (form.firstName = v))} />
              </div>
              <div class="field">
                <label>Last name</label>
                <input value={form.lastName} onInput={onText((v) => (form.lastName = v))} />
              </div>
              <div class="field">
                <label>Position</label>
                <input value={form.position} onInput={onText((v) => (form.position = v))} />
              </div>
              <div class="field">
                <label>Department</label>
                <input
                  list="depts"
                  value={form.department}
                  onInput={onText((v) => (form.department = v))}
                />
                <datalist id="depts">
                  {allDepts.value.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div class="field">
                <label>Email</label>
                <input type="email" value={form.email} onInput={onText((v) => (form.email = v))} />
              </div>
              <div class="field">
                <label>Monthly basic (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={form.monthlyBasic}
                  onInput={onNum((v) => (form.monthlyBasic = v))}
                />
              </div>
              <div class="field">
                <label>Date hired</label>
                <input
                  type="date"
                  value={form.dateHired}
                  onInput={onText((v) => (form.dateHired = v))}
                />
              </div>
              <div class="field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={onText((v) => (form.status = v as EmploymentStatus))}
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On leave</option>
                  <option value="resigned">Resigned</option>
                </select>
              </div>
              <div class="field">
                <label>SSS No.</label>
                <input value={form.sssNo} onInput={onText((v) => (form.sssNo = v))} />
              </div>
              <div class="field">
                <label>PhilHealth No.</label>
                <input value={form.philhealthNo} onInput={onText((v) => (form.philhealthNo = v))} />
              </div>
              <div class="field">
                <label>Pag-IBIG MID</label>
                <input value={form.pagibigNo} onInput={onText((v) => (form.pagibigNo = v))} />
              </div>
              <div class="field">
                <label>TIN</label>
                <input value={form.tin} onInput={onText((v) => (form.tin = v))} />
              </div>
              <div class="field">
                <label>VL balance (days)</label>
                <input
                  type="number"
                  min="0"
                  value={form.vlBalance}
                  onInput={onNum((v) => (form.vlBalance = v))}
                />
              </div>
              <div class="field">
                <label>SL balance (days)</label>
                <input
                  type="number"
                  min="0"
                  value={form.slBalance}
                  onInput={onNum((v) => (form.slBalance = v))}
                />
              </div>
            </div>
          </div>
          <div class="modal-f">
            <button class="btn ghost" onClick={() => (showForm.value = false)}>
              Cancel
            </button>
            <button class="btn green" onClick={save}>
              {editingId.value ? 'Save changes' : 'Add employee'}
            </button>
          </div>
        </div>
      </div>
    )

    return () => (
      <>
        <div class="toolbar">
          <div class="search">
            <input
              value={search.value}
              onInput={onText((v) => (search.value = v))}
              placeholder="Search name, position, email…"
            />
          </div>
          <select
            value={deptFilter.value}
            onChange={onText((v) => (deptFilter.value = v))}
            style="padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 9px"
          >
            <option value="">All departments</option>
            {allDepts.value.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {session.canManageEmployees && (
            <button class="btn" onClick={openAdd}>
              <Icon name="plus" size={15} /> Add employee
            </button>
          )}
        </div>

        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Position</th>
                <th>Department</th>
                {session.canSeeAllSalaries && <th class="num">Monthly basic</th>}
                <th>Status</th>
                {session.canManageEmployees && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.value.map((e, i) => (
                <tr key={e.id} class="clickable" onClick={() => (detail.value = e)}>
                  <td>
                    <span class="av-sm" style={{ background: COLORS[i % COLORS.length] }}>
                      {initials(e.firstName, e.lastName)}
                    </span>
                    {e.firstName} {e.lastName}
                    <div class="muted" style="font-size: 12px; margin-left: 37px">
                      {e.email}
                    </div>
                  </td>
                  <td>{e.position}</td>
                  <td>{e.department}</td>
                  {session.canSeeAllSalaries && <td class="num">{peso(e.monthlyBasic)}</td>}
                  <td>
                    <span class={['chip', statusChip(e.status).cls]}>
                      {statusChip(e.status).text}
                    </span>
                  </td>
                  {session.canManageEmployees && (
                  <td class="num">
                    <button
                      class="btn sm ghost"
                      onClick={(ev: MouseEvent) => {
                        ev.stopPropagation()
                        openEdit(e)
                      }}
                    >
                      Edit
                    </button>
                  </td>
                  )}
                </tr>
              ))}
              {filtered.value.length === 0 && (
                <tr>
                  <td colspan={cols.value} class="empty">
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {detail.value && renderDetail(detail.value)}
        {showForm.value && renderForm()}
      </>
    )
  },
})
