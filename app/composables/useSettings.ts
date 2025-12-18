export interface Settings {
  homescreenInterval: 'disabled' | '6' | '12' | '24'
  trackInterval: 'disabled' | '1' | '3' | '6'
}

const STORAGE_KEY = 'mypaket_settings'

const DEFAULT: Settings = {
  homescreenInterval: '12',
  trackInterval: '6'
}
export const useSettings = () => {
  const read = (): Settings => {
    if (typeof window === 'undefined') return DEFAULT
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return DEFAULT
      const parsed = JSON.parse(raw)
      return { ...DEFAULT, ...parsed }
    } catch (err) {
      console.error('Failed to read settings', err)
      return DEFAULT
    }
  }

  const settings = ref<Settings>(read())

  const save = (s: Settings) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      settings.value = s
    } catch (err) {
      console.error('Failed to save settings', err)
    }
  }

  const set = (key: keyof Settings, value: Settings[typeof key]) => {
    const next = { ...settings.value, [key]: value } as Settings
    save(next)
    return next
  }

  const getIntervalMs = (val: Settings[keyof Settings]) => {
    if (!val || val === 'disabled') return 0
    const hours = Number(val)
    if (!hours || isNaN(hours)) return 0
    return hours * 60 * 60 * 1000
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : DEFAULT
          settings.value = { ...DEFAULT, ...parsed }
        } catch (err) {
          // ignore
        }
      }
    })
  }

  return {
    settings,
    read,
    save,
    set,
    getIntervalMs,
    DEFAULT
  }
}
