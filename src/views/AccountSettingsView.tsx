import { defineComponent, computed, ref } from 'vue'
import { useSession } from '@/stores/session'
import { useProfileStore } from '@/stores/profile'
import { useTheme } from '@/lib/theme'
import Avatar from '@/components/Avatar'
import Icon from '@/components/Icon'
import type { NotificationPrefs } from '@/types'

export default defineComponent({
  name: 'AccountSettingsView',
  setup() {
    const session = useSession()
    const profile = useProfileStore()
    const { theme, toggle } = useTheme()

    const profileKey = computed(() => session.current?.id ?? session.role)
    const displayName = computed(() =>
      session.current ? `${session.current.firstName} ${session.current.lastName}` : session.roleLabel,
    )
    const busy = ref(false)
    const error = ref('')

    const prefs = computed<NotificationPrefs>(() => profile.getPrefs(profileKey.value))

    async function handleFile(files: FileList | null): Promise<void> {
      const file = files?.[0]
      if (!file) return
      error.value = ''
      busy.value = true
      const res = await profile.setAvatar(profileKey.value, file)
      if (!res.ok) error.value = res.error ?? 'Upload failed.'
      busy.value = false
    }

    function togglePref(key: keyof NotificationPrefs): void {
      profile.setPrefs(profileKey.value, { [key]: !prefs.value[key] })
    }

    return () => (
      <div class="grid two">
        <div class="card pad">
          <div class="card-h" style="border: none; padding: 0 0 16px">
            Profile picture
          </div>
          <div class="row gap" style="margin-bottom: 14px">
            <Avatar profileKey={profileKey.value} label={displayName.value} size={64} />
            <div>
              <div style="font-weight: 800; font-size: 15px">{displayName.value}</div>
              <div class="muted" style="font-size: 12.5px">{session.roleLabel}</div>
            </div>
          </div>
          <div class="row gap wrapf">
            <label class="btn sm" style="display: inline-flex">
              <Icon name="camera" size={14} /> {busy.value ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style="display: none"
                onChange={(e: Event) => {
                  const input = e.target as HTMLInputElement
                  void handleFile(input.files)
                  input.value = ''
                }}
              />
            </label>
            <button class="btn sm danger" onClick={() => void profile.removeAvatar(profileKey.value)}>
              <Icon name="trash" size={14} /> Remove
            </button>
          </div>
          {error.value && <p style="color: var(--red); font-size: 13px; margin-top: 10px">{error.value}</p>}
          <p class="muted" style="font-size: 12px; margin-top: 12px">
            JPG, PNG, or WEBP · up to 5 MB. Stored locally in your browser.
          </p>
        </div>

        <div>
          <div class="card pad mb">
            <div class="card-h" style="border: none; padding: 0 0 14px">
              Appearance
            </div>
            <div class="row spread">
              <div>
                <div style="font-weight: 700; font-size: 13.5px">Theme</div>
                <div class="muted" style="font-size: 12.5px">Switch between light and dark mode</div>
              </div>
              <button class="btn sm ghost" onClick={toggle}>
                <Icon name={theme.value === 'dark' ? 'sun' : 'moon'} size={14} />
                {theme.value === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>

          <div class="card pad">
            <div class="card-h" style="border: none; padding: 0 0 14px">
              Notification preferences
            </div>
            {(
              [
                ['leaveUpdates', 'Leave request updates', 'Approvals, rejections, and reminders about your leave filings'],
                ['payrollUpdates', 'Payroll & payslip updates', 'New payslips and payroll run notices'],
                ['announcements', 'Company announcements', 'General reminders posted by HR / Admin'],
              ] as Array<[keyof NotificationPrefs, string, string]>
            ).map(([key, label, desc]) => (
              <label key={key} class="row spread" style="padding: 10px 0; cursor: pointer; border-bottom: 1px solid var(--border-soft)">
                <span>
                  <div style="font-weight: 700; font-size: 13.5px">{label}</div>
                  <div class="muted" style="font-size: 12px">{desc}</div>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.value[key]}
                  onChange={() => togglePref(key)}
                  style="width: 18px; height: 18px; accent-color: var(--primary)"
                />
              </label>
            ))}
            <p class="muted" style="font-size: 12px; margin-top: 14px">
              These preferences control which bell notifications you'd receive in a production system. In this
              demo, all posted announcements still appear in your notification bell.
            </p>
          </div>
        </div>
      </div>
    )
  },
})
