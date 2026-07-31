import { defineComponent, ref, reactive, computed } from 'vue'
import { useHrisStore } from '@/stores/hris'
import { useSession } from '@/stores/session'
import { useAttendanceStore } from '@/stores/attendance'
import { onText, onSelf } from '@/lib/form'
import { toDtrRows, downloadDtrExcel, printDtrPdf } from '@/lib/dtr'
import type { OvertimeStatus, CorrectionStatus, CorrectionField } from '@/types'
import Icon from '@/components/Icon'

type Tab = 'overtime' | 'correction' | 'dtr'

const statusChip = (s: OvertimeStatus | CorrectionStatus): string =>
  s === 'approved' ? 'green' : s === 'pending' ? 'amber' : 'red'

const fieldLabel: Record<CorrectionField, string> = {
  clockIn: 'Time in',
  clockOut: 'Time out',
  both: 'Time in & out',
}

export default defineComponent({
  name: 'AttendanceOpsView',
  setup() {
    const store = useHrisStore()
    const session = useSession()
    const attendance = useAttendanceStore()

    const tab = ref<Tab>('overtime')
    const scopeIds = computed(() => new Set(session.scopedEmployees.map((e) => e.id)))
    const nameOf = (id: string): string => {
      const e = store.getEmployee(id)
      return e ? `${e.firstName} ${e.lastName}` : 'Unknown'
    }

    // ---------------- Overtime ----------------
    const otShowForm = ref(false)
    const otFilter = ref<'all' | OvertimeStatus>('all')
    const otForm = reactive({
      employeeId: '',
      date: '2026-06-30',
      startTime: '18:00',
      endTime: '20:00',
      reason: '',
    })
    const otHours = computed(() => {
      const [sh, sm] = otForm.startTime.split(':').map(Number)
      const [eh, em] = otForm.endTime.split(':').map(Number)
      const mins = eh * 60 + em - (sh * 60 + sm)
      return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0
    })
    function openOtForm(): void {
      otForm.employeeId = session.isEmployee ? (session.current?.id ?? '') : ''
      otForm.reason = ''
      otShowForm.value = true
    }
    function submitOt(): void {
      if (!otForm.employeeId || otHours.value <= 0) return
      attendance.fileOvertime({
        employeeId: otForm.employeeId,
        date: otForm.date,
        startTime: otForm.startTime,
        endTime: otForm.endTime,
        hours: otHours.value,
        reason: otForm.reason,
      })
      otShowForm.value = false
    }
    const otScoped = computed(() => attendance.overtime.filter((o) => scopeIds.value.has(o.employeeId)))
    const otRows = computed(() =>
      otScoped.value.filter((o) => otFilter.value === 'all' || o.status === otFilter.value),
    )
    const otPending = computed(() => otScoped.value.filter((o) => o.status === 'pending').length)
    const otApprovedHours = computed(() =>
      otScoped.value.filter((o) => o.status === 'approved').reduce((s, o) => s + o.hours, 0),
    )

    // ---------------- Corrections ----------------
    const coShowForm = ref(false)
    const coFilter = ref<'all' | CorrectionStatus>('all')
    const coForm = reactive({
      employeeId: '',
      date: '2026-06-30',
      field: 'clockIn' as CorrectionField,
      requestedClockIn: '09:00',
      requestedClockOut: '18:00',
      reason: '',
    })
    function openCoForm(): void {
      coForm.employeeId = session.isEmployee ? (session.current?.id ?? '') : ''
      coForm.reason = ''
      coShowForm.value = true
    }
    function submitCo(): void {
      if (!coForm.employeeId || !coForm.reason.trim()) return
      attendance.fileCorrection({
        employeeId: coForm.employeeId,
        date: coForm.date,
        field: coForm.field,
        requestedClockIn: coForm.field !== 'clockOut' ? coForm.requestedClockIn : undefined,
        requestedClockOut: coForm.field !== 'clockIn' ? coForm.requestedClockOut : undefined,
        reason: coForm.reason,
      })
      coShowForm.value = false
    }
    const coScoped = computed(() => attendance.corrections.filter((c) => scopeIds.value.has(c.employeeId)))
    const coRows = computed(() =>
      coScoped.value.filter((c) => coFilter.value === 'all' || c.status === coFilter.value),
    )
    const coPending = computed(() => coScoped.value.filter((c) => c.status === 'pending').length)

    // ---------------- DTR ----------------
    const dtrPeople = computed(() => session.scopedEmployees)
    const dtrSelectedId = ref<string>(session.isEmployee ? (session.current?.id ?? '') : (dtrPeople.value[0]?.id ?? ''))
    const dtrPeriod = ref('June 2026 cutoff')
    const dtrEmployee = computed(() => store.getEmployee(dtrSelectedId.value))
    const dtrLogs = computed(() => (dtrSelectedId.value ? attendance.logsFor(dtrSelectedId.value) : []))
    const dtrRows = computed(() => toDtrRows(dtrLogs.value))

    function exportExcel(): void {
      if (!dtrEmployee.value) return
      downloadDtrExcel(dtrRows.value, `${dtrEmployee.value.firstName} ${dtrEmployee.value.lastName}`)
    }
    function exportPdf(): void {
      if (!dtrEmployee.value) return
      printDtrPdf(dtrRows.value, `${dtrEmployee.value.firstName} ${dtrEmployee.value.lastName}`, dtrPeriod.value)
    }

    return () => (
      <>
        <div class="toolbar" style="margin-bottom: 20px">
          <button class={['btn', 'sm', tab.value === 'overtime' ? '' : 'ghost']} onClick={() => (tab.value = 'overtime')}>
            <Icon name="clock" size={14} /> Overtime
            {otPending.value > 0 && <span class="chip amber" style="margin-left: 4px">{otPending.value}</span>}
          </button>
          <button class={['btn', 'sm', tab.value === 'correction' ? '' : 'ghost']} onClick={() => (tab.value = 'correction')}>
            <Icon name="refresh" size={14} /> Attendance correction
            {coPending.value > 0 && <span class="chip amber" style="margin-left: 4px">{coPending.value}</span>}
          </button>
          <button class={['btn', 'sm', tab.value === 'dtr' ? '' : 'ghost']} onClick={() => (tab.value = 'dtr')}>
            <Icon name="fileText" size={14} /> Daily Time Record
          </button>
        </div>

        {tab.value === 'overtime' && (
          <>
            <div class="grid stats mb">
              <div class="card stat">
                <div class="label">Pending OT requests</div>
                <div class="val">{otPending.value}</div>
                <div class="sub">{session.canApproveLeave ? 'needs action' : 'awaiting approval'}</div>
              </div>
              <div class="card stat">
                <div class="label">Approved OT hours</div>
                <div class="val">{otApprovedHours.value.toFixed(1)}</div>
                <div class="sub">in scope</div>
              </div>
            </div>

            <div class="toolbar">
              <select
                value={otFilter.value}
                onChange={onText((v) => (otFilter.value = v as 'all' | OvertimeStatus))}
                style="padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 9px"
              >
                <option value="all">All requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div style="flex: 1"></div>
              <button class="btn" onClick={openOtForm}>
                <Icon name="plus" size={15} /> File overtime
              </button>
            </div>

            <div class="card">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th class="num">Hours</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {session.canApproveLeave && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {otRows.value.map((o) => (
                    <tr key={o.id}>
                      <td>{nameOf(o.employeeId)}</td>
                      <td class="muted">{o.date}</td>
                      <td class="muted">
                        {o.startTime} – {o.endTime}
                      </td>
                      <td class="num">{o.hours}</td>
                      <td class="muted" style="max-width: 220px">{o.reason}</td>
                      <td>
                        <span class={['chip', statusChip(o.status)]}>{o.status}</span>
                      </td>
                      {session.canApproveLeave && (
                        <td class="num">
                          {o.status === 'pending' ? (
                            <>
                              <button class="btn sm green" onClick={() => attendance.setOvertimeStatus(o.id, 'approved')}>
                                Approve
                              </button>
                              <button class="btn sm danger" onClick={() => attendance.setOvertimeStatus(o.id, 'rejected')}>
                                Reject
                              </button>
                            </>
                          ) : (
                            <button class="btn sm ghost" onClick={() => attendance.setOvertimeStatus(o.id, 'pending')}>
                              Reset
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {otRows.value.length === 0 && (
                    <tr>
                      <td colspan={session.canApproveLeave ? 7 : 6} class="empty">
                        No overtime requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {otShowForm.value && (
              <div class="overlay" onClick={onSelf(() => (otShowForm.value = false))}>
                <div class="modal">
                  <div class="modal-h">
                    <h3>File overtime</h3>
                    <button class="x" onClick={() => (otShowForm.value = false)}>×</button>
                  </div>
                  <div class="modal-b">
                    <div class="field">
                      <label>Employee</label>
                      {session.isEmployee ? (
                        <input value={`${session.current?.firstName ?? ''} ${session.current?.lastName ?? ''}`} disabled />
                      ) : (
                        <select value={otForm.employeeId} onChange={onText((v) => (otForm.employeeId = v))}>
                          <option value="">Select employee…</option>
                          {session.scopedEmployees.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.firstName} {e.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div class="field">
                      <label>Date</label>
                      <input type="date" value={otForm.date} onInput={onText((v) => (otForm.date = v))} />
                    </div>
                    <div class="form-grid">
                      <div class="field">
                        <label>Start time</label>
                        <input type="time" value={otForm.startTime} onInput={onText((v) => (otForm.startTime = v))} />
                      </div>
                      <div class="field">
                        <label>End time</label>
                        <input type="time" value={otForm.endTime} onInput={onText((v) => (otForm.endTime = v))} />
                      </div>
                    </div>
                    <div class="field">
                      <label>Reason</label>
                      <textarea rows="2" value={otForm.reason} onInput={onText((v) => (otForm.reason = v))}></textarea>
                    </div>
                    <p class="muted" style="font-size: 13px">
                      Duration: <strong>{otHours.value}</strong> hour(s).
                    </p>
                  </div>
                  <div class="modal-f">
                    <button class="btn ghost" onClick={() => (otShowForm.value = false)}>Cancel</button>
                    <button class="btn green" disabled={!otForm.employeeId || otHours.value <= 0} onClick={submitOt}>
                      Submit request
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab.value === 'correction' && (
          <>
            <div class="grid stats mb">
              <div class="card stat">
                <div class="label">Pending corrections</div>
                <div class="val">{coPending.value}</div>
                <div class="sub">{session.canApproveLeave ? 'needs action' : 'awaiting approval'}</div>
              </div>
              <div class="card stat">
                <div class="label">Total filed</div>
                <div class="val">{coScoped.value.length}</div>
                <div class="sub">in scope</div>
              </div>
            </div>

            <div class="toolbar">
              <select
                value={coFilter.value}
                onChange={onText((v) => (coFilter.value = v as 'all' | CorrectionStatus))}
                style="padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 9px"
              >
                <option value="all">All requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div style="flex: 1"></div>
              <button class="btn" onClick={openCoForm}>
                <Icon name="plus" size={15} /> File correction
              </button>
            </div>

            <div class="card">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Field</th>
                    <th>Requested time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {session.canApproveLeave && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {coRows.value.map((c) => (
                    <tr key={c.id}>
                      <td>{nameOf(c.employeeId)}</td>
                      <td class="muted">{c.date}</td>
                      <td>{fieldLabel[c.field]}</td>
                      <td class="muted">
                        {c.requestedClockIn && <span>In {c.requestedClockIn}</span>}
                        {c.requestedClockIn && c.requestedClockOut && <span> · </span>}
                        {c.requestedClockOut && <span>Out {c.requestedClockOut}</span>}
                      </td>
                      <td class="muted" style="max-width: 220px">{c.reason}</td>
                      <td>
                        <span class={['chip', statusChip(c.status)]}>{c.status}</span>
                      </td>
                      {session.canApproveLeave && (
                        <td class="num">
                          {c.status === 'pending' ? (
                            <>
                              <button class="btn sm green" onClick={() => attendance.setCorrectionStatus(c.id, 'approved')}>
                                Approve
                              </button>
                              <button class="btn sm danger" onClick={() => attendance.setCorrectionStatus(c.id, 'rejected')}>
                                Reject
                              </button>
                            </>
                          ) : (
                            <button class="btn sm ghost" onClick={() => attendance.setCorrectionStatus(c.id, 'pending')}>
                              Reset
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {coRows.value.length === 0 && (
                    <tr>
                      <td colspan={session.canApproveLeave ? 7 : 6} class="empty">
                        No attendance correction requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {coShowForm.value && (
              <div class="overlay" onClick={onSelf(() => (coShowForm.value = false))}>
                <div class="modal">
                  <div class="modal-h">
                    <h3>File an attendance correction</h3>
                    <button class="x" onClick={() => (coShowForm.value = false)}>×</button>
                  </div>
                  <div class="modal-b">
                    <div class="field">
                      <label>Employee</label>
                      {session.isEmployee ? (
                        <input value={`${session.current?.firstName ?? ''} ${session.current?.lastName ?? ''}`} disabled />
                      ) : (
                        <select value={coForm.employeeId} onChange={onText((v) => (coForm.employeeId = v))}>
                          <option value="">Select employee…</option>
                          {session.scopedEmployees.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.firstName} {e.lastName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div class="field">
                      <label>Date to correct</label>
                      <input type="date" value={coForm.date} onInput={onText((v) => (coForm.date = v))} />
                    </div>
                    <div class="field">
                      <label>What needs correcting</label>
                      <select value={coForm.field} onChange={onText((v) => (coForm.field = v as CorrectionField))}>
                        <option value="clockIn">Time in only</option>
                        <option value="clockOut">Time out only</option>
                        <option value="both">Both time in &amp; out</option>
                      </select>
                    </div>
                    <div class="form-grid">
                      {coForm.field !== 'clockOut' && (
                        <div class="field">
                          <label>Correct time in</label>
                          <input type="time" value={coForm.requestedClockIn} onInput={onText((v) => (coForm.requestedClockIn = v))} />
                        </div>
                      )}
                      {coForm.field !== 'clockIn' && (
                        <div class="field">
                          <label>Correct time out</label>
                          <input type="time" value={coForm.requestedClockOut} onInput={onText((v) => (coForm.requestedClockOut = v))} />
                        </div>
                      )}
                    </div>
                    <div class="field">
                      <label>Reason</label>
                      <textarea rows="2" value={coForm.reason} onInput={onText((v) => (coForm.reason = v))}></textarea>
                    </div>
                  </div>
                  <div class="modal-f">
                    <button class="btn ghost" onClick={() => (coShowForm.value = false)}>Cancel</button>
                    <button class="btn green" disabled={!coForm.employeeId || !coForm.reason.trim()} onClick={submitCo}>
                      Submit request
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab.value === 'dtr' && (
          <>
            <div class="toolbar">
              {!session.isEmployee && (
                <div class="field" style="margin: 0; min-width: 240px">
                  <label>Employee</label>
                  <select value={dtrSelectedId.value} onChange={onText((v) => (dtrSelectedId.value = v))}>
                    {dtrPeople.value.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div class="field" style="margin: 0; min-width: 200px">
                <label>Period label</label>
                <input value={dtrPeriod.value} onInput={onText((v) => (dtrPeriod.value = v))} />
              </div>
              <div style="flex: 1"></div>
              <button class="btn ghost" disabled={!dtrEmployee.value} onClick={exportExcel}>
                <Icon name="download" size={14} /> Excel (.csv)
              </button>
              <button class="btn" disabled={!dtrEmployee.value} onClick={exportPdf}>
                <Icon name="fileText" size={14} /> PDF
              </button>
            </div>

            <div class="card">
              <div class="card-h">
                {dtrEmployee.value ? `${dtrEmployee.value.firstName} ${dtrEmployee.value.lastName}'s DTR` : 'Daily Time Record'}
                <span class="muted" style="font-size: 13px; font-weight: 400">{dtrRows.value.length} record(s)</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th class="num">Time In</th>
                    <th class="num">Time Out</th>
                    <th class="num">Hours Worked</th>
                  </tr>
                </thead>
                <tbody>
                  {dtrRows.value.map((r) => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td class="num muted">{r.clockIn}</td>
                      <td class="num muted">{r.clockOut}</td>
                      <td class="num">{r.hours}</td>
                    </tr>
                  ))}
                  {dtrRows.value.length === 0 && (
                    <tr>
                      <td colspan="4" class="empty">No time records yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    )
  },
})
