import { defineComponent, computed, watchEffect, type PropType } from 'vue'
import { useProfileStore } from '@/stores/profile'

export default defineComponent({
  name: 'Avatar',
  props: {
    profileKey: { type: String, required: true },
    label: { type: String, required: true }, // used to derive initials, e.g. "Juan Dela Cruz"
    size: { type: [Number, String] as PropType<number | string>, default: 33 },
  },
  setup(props) {
    const profile = useProfileStore()

    watchEffect(() => {
      if (props.profileKey) void profile.loadAvatar(props.profileKey)
    })

    const url = computed(() => profile.avatarUrls[props.profileKey])
    const initials = computed(() => {
      const parts = props.label.trim().split(/\s+/)
      const first = parts[0]?.[0] ?? ''
      const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
      return (first + last).toUpperCase() || '?'
    })
    const px = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))

    return () =>
      url.value ? (
        <img
          src={url.value}
          class="av"
          style={{ width: px.value, height: px.value, objectFit: 'cover', padding: 0 }}
        />
      ) : (
        <span class="av" style={{ width: px.value, height: px.value }}>
          {initials.value}
        </span>
      )
  },
})
