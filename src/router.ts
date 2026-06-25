import { createRouter, createWebHashHistory } from 'vue-router'
import { useSession, type Role } from '@/stores/session'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', name: 'dashboard', meta: { roles: ['admin'] }, component: () => import('@/views/DashboardView') },
    { path: '/employees', name: 'employees', meta: { roles: ['admin', 'manager'] }, component: () => import('@/views/EmployeesView') },
    { path: '/documents', name: 'documents', meta: { roles: ['admin', 'manager', 'employee'] }, component: () => import('@/views/DocumentsView') },
    { path: '/payroll', name: 'payroll', meta: { roles: ['admin'] }, component: () => import('@/views/PayrollView') },
    { path: '/leave', name: 'leave', meta: { roles: ['admin', 'manager', 'employee'] }, component: () => import('@/views/LeaveView') },
    { path: '/settings', name: 'settings', meta: { roles: ['admin'] }, component: () => import('@/views/SettingsView') },
    { path: '/my-pay', name: 'my-pay', meta: { roles: ['employee'] }, component: () => import('@/views/MyPayView') },
    { path: '/my-profile', name: 'my-profile', meta: { roles: ['employee'] }, component: () => import('@/views/MyProfileView') },
  ],
})

router.beforeEach((to) => {
  const session = useSession()
  const home = session.homePath
  if (to.path === '/') return home
  const roles = to.meta.roles as Role[] | undefined
  if (roles && !roles.includes(session.role)) return home
  return true
})

export default router
