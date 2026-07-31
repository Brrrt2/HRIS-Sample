import { defineComponent, ref, computed, reactive } from 'vue'
import { useSession } from '@/stores/session'
import { useNotificationsStore } from '@/stores/notifications'
import { onText } from '@/lib/form'
import type { NotificationAudience } from '@/types'
import Icon from '@/components/Icon'

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default defineComponent({
  name: 'NotificationBell',
  setup() {
    const session = useSession()
    const notifications = useNotificationsStore()
    const open = ref(false)
    const showCompose = ref(false)

    const readerKey = computed(() => session.current?.id ?? session.role)
    const visible = computed(() => notifications.visibleTo(session.role))
    const unread = computed(() => notifications.unreadCount(readerKey.value, session.role))
    const canPost = computed(() => session.isAdmin || session.isManager)

    const form = reactive({ title: '', message: '', audience: 'all' as NotificationAudience })

    function togglePanel(): void {
      open.value = !open.value
      if (open.value) notifications.markAllRead(readerKey.value, session.role)
      else showCompose.value = false
    }

    function submitPost(): void {
      if (!form.title.trim() || !form.message.trim()) return
      notifications.post({
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        postedBy: session.current ? `${session.current.firstName} ${session.current.lastName}` : session.roleLabel,
      })
      form.title = ''
      form.message = ''
      form.audience = 'all'
      showCompose.value = false
    }

    return () => (
      <div class="notif-wrap">
        <button class="theme-toggle" style="position: relative" onClick={togglePanel} title="Notifications">
          <Icon name="bell" size={18} />
          {unread.value > 0 && <span class="notif-dot">{unread.value > 9 ? '9+' : unread.value}</span>}
        </button>
        {open.value && (
          <>
            <div class="notif-backdrop" onClick={() => (open.value = false)}></div>
            <div class="notif-panel">
              <div class="notif-panel-h">
                <strong>Notifications</strong>
                {canPost.value && (
                  <button class="btn sm ghost" onClick={() => (showCompose.value = !showCompose.value)}>
                    <Icon name="plus" size={12} /> New
                  </button>
                )}
              </div>
              {showCompose.value && (
                <div class="notif-compose">
                  <input placeholder="Title" value={form.title} onInput={onText((v) => (form.title = v))} />
                  <textarea
                    rows="2"
                    placeholder="Message"
                    value={form.message}
                    onInput={onText((v) => (form.message = v))}
                  ></textarea>
                  <select value={form.audience} onChange={onText((v) => (form.audience = v as NotificationAudience))}>
                    <option value="all">Everyone</option>
                    <option value="employee">Employees</option>
                    <option value="manager">Managers</option>
                    <option value="admin">HR / Admin</option>
                  </select>
                  <button class="btn sm" disabled={!form.title.trim() || !form.message.trim()} onClick={submitPost}>
                    Post
                  </button>
                </div>
              )}
              <div class="notif-list">
                {visible.value.map((n) => (
                  <div key={n.id} class="notif-item">
                    <div class="row spread">
                      <strong style="font-size: 13px">{n.title}</strong>
                      <span class="muted" style="font-size: 11px; white-space: nowrap; margin-left: 8px">
                        {timeAgo(n.postedOn)}
                      </span>
                    </div>
                    <p class="muted" style="font-size: 12.5px; margin-top: 3px">
                      {n.message}
                    </p>
                    <div class="muted" style="font-size: 11px; margin-top: 5px">
                      — {n.postedBy}
                    </div>
                  </div>
                ))}
                {visible.value.length === 0 && <div class="empty" style="padding: 24px">No notifications yet.</div>}
              </div>
            </div>
          </>
        )}
      </div>
    )
  },
})
