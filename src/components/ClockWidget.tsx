import { defineComponent, computed } from 'vue'
import { useSession } from '@/stores/session'
import { useAttendanceStore } from '@/stores/attendance'
import Icon from '@/components/Icon'

function fmt(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

export default defineComponent({
  name: 'ClockWidget',
  setup() {
    const session = useSession()
    const attendance = useAttendanceStore()

    const empId = computed(() => session.current?.id ?? '')
    const log = computed(() => (empId.value ? attendance.todayLog(empId.value) : undefined))
    const clockedIn = computed(() => (empId.value ? attendance.isClockedIn(empId.value) : false))
    const doneToday = computed(() => !!log.value?.clockIn && !!log.value?.clockOut)

    function toggle(): void {
      if (!empId.value || doneToday.value) return
      if (clockedIn.value) attendance.clockOut(empId.value)
      else attendance.clockIn(empId.value)
    }

    return () => {
      if (!empId.value) return null
      const label = doneToday.value
        ? `Clocked out · ${fmt(log.value?.clockOut)}`
        : clockedIn.value
          ? `Clock out (in ${fmt(log.value?.clockIn)})`
          : 'Clock in'
      return (
        <button
          class={['btn', 'sm', doneToday.value ? 'ghost' : clockedIn.value ? 'danger' : 'green']}
          onClick={toggle}
          disabled={doneToday.value}
          title="Clock in / out for today"
        >
          <Icon name="clock" size={14} /> {label}
        </button>
      )
    }
  },
})
