import { defineComponent, ref, reactive, computed } from 'vue'
import { useHrisStore } from '@/stores/hris'
import { useSession } from '@/stores/session'
import { onText, onSelf } from '@/lib/form'
import type { LeaveType, LeaveStatus } from '@/types'
import Icon from '@/components/Icon'

const types: LeaveType[] = [
  'Vacation Leave',
  'Sick Leave',
  'Service Incentive Leave',
  'Emergency Leave',
  'Maternity/Paternity',
]

const statusChip = (s: LeaveStatus): string =>
  s === 'approved' ? 'green' : s === 'pending' ? 'amber' : 'red'

export default defineComponent({
  name: 'LeaveView',
  setup() {
    const store = useHrisStore()
    const session = useSession()

    const showForm = ref(false)
    const filter = ref<'all' | LeaveStatus>('all')

    // Employees in scope for this session (all / team / just me).
    const scopeIds = computed(() => new Set(session.scopedEmployees.map((e) => e.id)))

    const form = reactive({
      employeeId: '',
      type: 'Vacation Leave' as LeaveType,
      startDate: '2026-06-25',
      endDate: '2026-06-25',
      reason: '',
    })

    function openForm(): void {
      form.employeeId = session.isEmployee ? (session.current?.id ?? '') : ''
      form.reason = ''
      showForm.value = true
    }

    const daysBetween = computed(() => {
      const a = new Date(form.startDate).getTime()
      const b = new Date(form.endDate).getTime()
      if (isNaN(a) || isNaN(b) || b < a) return 0
      return Math.round((b - a) / 86400000) + 1
    })

    const scopedLeaves = computed(() => store.leaves.filter((l) => scopeIds.value.has(l.employeeId)))

    const rows = computed(() =>
      scopedLeaves.value
        .filter((l) => filter.value === 'all' || l.status === filter.value)
        .map((l) => {
          const emp = store.getEmployee(l.employeeId)
          return { ...l, name: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown' }
        }),
    )

    const pendingCount = computed(() => scopedLeaves.value.filter((l) => l.status === 'pending').length)
    const approvedCount = computed(() => scopedLeaves.value.filter((l) => l.status === 'approved').length)
    const onLeaveCount = computed(() => session.scopedEmployees.filter((e) => e.status === 'on_leave').length)
    const avgVl = computed(
      () =>
        session.scopedEmployees.reduce((s, e) => s + e.vlBalance, 0) /
        Math.max(1, session.scopedEmployees.length),
    )

    function submit(): void {
      if (!form.employeeId || daysBetween.value < 1) return
      store.fileLeave({
        employeeId: form.employeeId,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        days: daysBetween.value,
        reason: form.reason,
      })
      showForm.value = false
      form.reason = ''
      form.employeeId = ''
    }

    return () => (
      <>
        <div class="grid stats mb">
          <div class="card stat">
            <div class="label">Pending requests</div>
            <div class="val">{pendingCount.value}</div>
            <div class="sub">{session.canApproveLeave ? 'needs action' : 'awaiting approval'}</div>
          </div>
          <div class="card stat">
            <div class="label">Approved</div>
            <div class="val">{approvedCount.value}</div>
            <div class="sub">{session.isEmployee ? 'your requests' : 'in scope'}</div>
          </div>
          <div class="card stat">
            <div class="label">On leave today</div>
            <div class="val">{onLeaveCount.value}</div>
            <div class="sub">marked unavailable</div>
          </div>
          <div class="card stat">
            <div class="label">Avg VL balance</div>
            <div class="val">{avgVl.value.toFixed(1)}</div>
            <div class="sub">days remaining</div>
          </div>
        </div>

        <div class="toolbar">
          <select
            value={filter.value}
            onChange={onText((v) => (filter.value = v as 'all' | LeaveStatus))}
            style="padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 9px"
          >
            <option value="all">All requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div style="flex: 1"></div>
          <button class="btn" onClick={openForm}>
            <Icon name="plus" size={15} /> File leave
          </button>
        </div>

        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th class="num">Days</th>
                <th>Reason</th>
                <th>Status</th>
                {session.canApproveLeave && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.value.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>{l.type}</td>
                  <td class="muted">
                    {l.startDate}
                    {l.endDate !== l.startDate && <span> → {l.endDate}</span>}
                  </td>
                  <td class="num">{l.days}</td>
                  <td class="muted" style="max-width: 220px">
                    {l.reason}
                  </td>
                  <td>
                    <span class={['chip', statusChip(l.status)]}>{l.status}</span>
                  </td>
                  {session.canApproveLeave && (
                    <td class="num">
                      {l.status === 'pending' ? (
                        <>
                          <button
                            class="btn sm green"
                            onClick={() => store.setLeaveStatus(l.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            class="btn sm danger"
                            onClick={() => store.setLeaveStatus(l.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          class="btn sm ghost"
                          onClick={() => store.setLeaveStatus(l.id, 'pending')}
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {rows.value.length === 0 && (
                <tr>
                  <td colspan={session.canApproveLeave ? 7 : 6} class="empty">
                    No leave requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm.value && (
          <div class="overlay" onClick={onSelf(() => (showForm.value = false))}>
            <div class="modal">
              <div class="modal-h">
                <h3>File a leave request</h3>
                <button class="x" onClick={() => (showForm.value = false)}>
                  ×
                </button>
              </div>
              <div class="modal-b">
                <div class="field">
                  <label>Employee</label>
                  {session.isEmployee ? (
                    <input
                      value={`${session.current?.firstName ?? ''} ${session.current?.lastName ?? ''}`}
                      disabled
                    />
                  ) : (
                    <select value={form.employeeId} onChange={onText((v) => (form.employeeId = v))}>
                      <option value="">Select employee…</option>
                      {session.scopedEmployees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} — VL {e.vlBalance} / SL {e.slBalance}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div class="field">
                  <label>Leave type</label>
                  <select value={form.type} onChange={onText((v) => (form.type = v as LeaveType))}>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div class="form-grid">
                  <div class="field">
                    <label>Start date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onInput={onText((v) => (form.startDate = v))}
                    />
                  </div>
                  <div class="field">
                    <label>End date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onInput={onText((v) => (form.endDate = v))}
                    />
                  </div>
                </div>
                <div class="field">
                  <label>Reason</label>
                  <textarea
                    rows="2"
                    value={form.reason}
                    onInput={onText((v) => (form.reason = v))}
                  ></textarea>
                </div>
                <p class="muted" style="font-size: 13px">
                  Duration: <strong>{daysBetween.value}</strong> day(s). Approving a VL/SL deducts
                  from the employee's balance.
                </p>
              </div>
              <div class="modal-f">
                <button class="btn ghost" onClick={() => (showForm.value = false)}>
                  Cancel
                </button>
                <button
                  class="btn green"
                  disabled={!form.employeeId || daysBetween.value < 1}
                  onClick={submit}
                >
                  Submit request
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  },
})
