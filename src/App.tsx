import { defineComponent, computed } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useHrisStore } from '@/stores/hris'
import { useSession, type Role } from '@/stores/session'
import { useTheme } from '@/lib/theme'
import { onText } from '@/lib/form'
import Icon from '@/components/Icon'
import Avatar from '@/components/Avatar'
import ClockWidget from '@/components/ClockWidget'
import NotificationBell from '@/components/NotificationBell'

interface NavItem {
  to: string
  icon: string
  label: string
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { to: '/dashboard', icon: 'grid', label: 'Dashboard' },
    { to: '/employees', icon: 'users', label: 'Employees' },
    { to: '/documents', icon: 'folder', label: 'Documents' },
    { to: '/payroll', icon: 'calculator', label: 'Payroll' },
    { to: '/leave', icon: 'calendar', label: 'Leave & Attendance' },
    { to: '/attendance-ops', icon: 'clock', label: 'Overtime & DTR' },
    { to: '/settings', icon: 'settings', label: 'Company Settings' },
    { to: '/account', icon: 'idCard', label: 'My Settings' },
  ],
  manager: [
    { to: '/employees', icon: 'users', label: 'My Team' },
    { to: '/leave', icon: 'calendar', label: 'Leave Approvals' },
    { to: '/attendance-ops', icon: 'clock', label: 'Overtime & DTR' },
    { to: '/documents', icon: 'folder', label: 'Team Documents' },
    { to: '/account', icon: 'idCard', label: 'My Settings' },
  ],
  employee: [
    { to: '/my-pay', icon: 'banknote', label: 'My Payslip' },
    { to: '/leave', icon: 'calendar', label: 'My Leave' },
    { to: '/attendance-ops', icon: 'clock', label: 'Overtime & DTR' },
    { to: '/documents', icon: 'folder', label: 'My Documents' },
    { to: '/my-profile', icon: 'idCard', label: 'My Profile' },
    { to: '/account', icon: 'settings', label: 'My Settings' },
  ],
}

const titles: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  documents: 'Documents',
  payroll: 'Payroll',
  leave: 'Leave & Attendance',
  'attendance-ops': 'Overtime & DTR',
  settings: 'Company Settings',
  account: 'My Settings',
  'my-pay': 'My Payslip',
  'my-profile': 'My Profile',
}

export default defineComponent({
  name: 'App',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useHrisStore()
    const session = useSession()
    const { theme, toggle } = useTheme()

    const pageTitle = computed(() => {
      const name = String(route.name ?? '')
      if (name === 'employees' && session.isManager) return 'My Team'
      if (name === 'documents' && session.isEmployee) return 'My Documents'
      if (name === 'documents' && session.isManager) return 'Team Documents'
      if (name === 'leave' && session.isEmployee) return 'My Leave'
      if (name === 'leave' && session.isManager) return 'Leave Approvals'
      return titles[name] ?? 'SwelduPro'
    })

    const navItems = computed(() => NAV[session.role])

    function changeRole(r: Role): void {
      session.setRole(r)
      void router.push(session.homePath)
    }

    const selectStyle =
      'padding:7px 10px;border:1px solid var(--border);border-radius:9px;background:var(--surface-2);color:var(--text);font-size:12.5px;font-weight:600;max-width:170px'

    return () => (
      <div class="layout">
        <aside class="sidebar">
          <div class="brand">
            <span class="mark">
              <Icon name="spark" size={20} />
            </span>
            <div>
              SwelduPro<small>PH HRIS &amp; Payroll</small>
            </div>
          </div>
          <nav class="nav">
            {navItems.value.map((item) => (
              <RouterLink key={item.to} to={item.to}>
                <Icon name={item.icon} /> {item.label}
              </RouterLink>
            ))}
          </nav>
          <div class="foot">
            <Icon name="shield" size={15} />
            <span>
              Signed in as <strong style="color:var(--side-strong)">{session.roleLabel}</strong>
              {session.current ? (
                <>
                  <br />
                  {session.current.firstName} {session.current.lastName}
                </>
              ) : (
                <>
                  <br />
                  {store.settings.companyName}
                </>
              )}
            </span>
          </div>
        </aside>

        <div class="main">
          <header class="topbar">
            <h1>{pageTitle.value}</h1>
            <div class="who">
              <span class="muted" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.4px">
                View as
              </span>
              <select
                style={selectStyle}
                value={session.role}
                onChange={onText((v) => changeRole(v as Role))}
              >
                <option value="admin">HR / Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
              {!session.isAdmin && (
                <select
                  style={selectStyle}
                  value={session.actingId}
                  onChange={onText((v) => session.setActing(v))}
                >
                  {store.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} · {e.department}
                    </option>
                  ))}
                </select>
              )}
              <ClockWidget />
              <NotificationBell />
              <button
                class="theme-toggle"
                onClick={toggle}
                title={theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <Icon name={theme.value === 'dark' ? 'sun' : 'moon'} size={18} />
              </button>
              <Avatar
                profileKey={session.current?.id ?? session.role}
                label={session.current ? `${session.current.firstName} ${session.current.lastName}` : session.roleLabel}
                size={33}
              />
            </div>
          </header>
          <main class="content">
            <RouterView />
          </main>
        </div>
      </div>
    )
  },
})
