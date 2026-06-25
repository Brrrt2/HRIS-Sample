import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const KEY = 'sweldupro-theme'

function initial(): Theme {
  const saved = localStorage.getItem(KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Module-level singleton so every component shares one reactive theme.
const theme = ref<Theme>(initial())

function apply(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t)
}
apply(theme.value)

export function useTheme() {
  function set(t: Theme): void {
    theme.value = t
    localStorage.setItem(KEY, t)
    apply(t)
  }
  function toggle(): void {
    set(theme.value === 'light' ? 'dark' : 'light')
  }
  return { theme, set, toggle }
}
