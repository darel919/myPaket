export interface PackageRecord {
  waybill: string
  alias?: string
  lastStatus: string
  lastLocation?: string
  lastActivity?: string
  lastUpdate: string
  courierName: string
  isDone: boolean
  addedAt: string
}

export const usePackageHistory = () => {
  const STORAGE_KEY = 'mypaket_history'

  const getHistory = (): PackageRecord[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveHistory = (history: PackageRecord[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (err) {
      console.error('Failed to save history:', err)
    }
  }

  const addOrUpdatePackage = (waybill: string, status: string, courierName: string, isDone: boolean = false, alias?: string, lastLocation?: string, lastActivity?: string, courierUpdatedAt?: string) => {
    const history = getHistory()
    const existingIndex = history.findIndex(p => p.waybill === waybill)
    const existing = existingIndex >= 0 ? history[existingIndex] : null
    
    const packageRecord: PackageRecord = {
      waybill,
      alias: alias || existing?.alias,
      lastStatus: status,
      lastLocation: lastLocation || existing?.lastLocation,
      lastActivity: lastActivity || existing?.lastActivity,
      lastUpdate: courierUpdatedAt || existing?.lastUpdate || new Date().toISOString(),
      courierName,
      isDone,
      addedAt: existing?.addedAt || new Date().toISOString()
    }

    if (existingIndex >= 0) {
      history[existingIndex] = packageRecord
    } else {
      history.unshift(packageRecord)
    }

    saveHistory(history)
  }

  const updateAlias = (waybill: string, alias: string) => {
    const history = getHistory()
    const existingIndex = history.findIndex(p => p.waybill === waybill)
    
    if (existingIndex >= 0 && history[existingIndex]) {
      history[existingIndex].alias = alias
      saveHistory(history)
    }
  }

  const removePackage = (waybill: string) => {
    const history = getHistory()
    const filtered = history.filter(p => p.waybill !== waybill)
    saveHistory(filtered)
  }

  const getActivePackages = (): PackageRecord[] => {
    return getHistory().filter(p => !p.isDone)
  }

  const getDonePackages = (): PackageRecord[] => {
    return getHistory().filter(p => p.isDone)
  }

  return {
    getHistory,
    addOrUpdatePackage,
    updateAlias,
    removePackage,
    getActivePackages,
    getDonePackages
  }
}
