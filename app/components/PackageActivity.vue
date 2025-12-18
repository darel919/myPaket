<template>
  <div>
    <div v-if="activePackages.length > 0" class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold">Active Packages</h2>
        <div class="flex items-center gap-2">
              <button class="btn btn-soft rounded-full p-4" @click="refreshAll" :disabled="isRefreshing" title="Refresh package status">
                <span v-if="isRefreshing" class="loading loading-spinner loading-sm mr-2"></span>
                <ListRestart />
              </button>
              <button class="btn btn-soft rounded-full p-4 text-red-400" @click="clearAll" title="Delete all packages"><Trash /></button>
            </div>
      </div>
      <div class="flex flex-col gap-4">
        <NuxtLink v-for="pkg in activePackages" :key="pkg.waybill" :to="`/track?waybill=${pkg.waybill}`" class="block w-full overflow-hidden rounded-lg shadow-md bg-base-100 hover:shadow-lg cursor-pointer transition-shadow">
          <div class="p-4 flex gap-4 items-start">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold truncate">{{ pkg.alias || pkg.waybill }}</h3>
              <p class="text-sm text-base-content/70 md:truncate mt-1">{{ pkg.lastActivity || pkg.lastStatus }}</p>
              <div class="flex items-center gap-3 mt-3 text-xs text-base-content/60">
                <span class="font-medium">{{ pkg.courierName }}</span>
                <span v-if="pkg.lastLocation">• {{ pkg.lastLocation }}</span>
              </div>
              <p class="text-xs text-base-content/60 mt-2">{{ timeAgo(pkg.lastUpdate) }}</p>
            </div>

            <div class="flex flex-col items-end justify-between">
              <div class="flex flex-col items-end gap-2">
                <span :class="['px-3 py-1 rounded-full text-xs font-medium', pkg.isDone ? 'bg-green-100 text-green-800' : 'bg-sky-100 text-sky-800']">{{ pkg.lastStatus }}</span>
                <span v-if="loadingStates[pkg.waybill]" class="loading loading-spinner loading-sm"></span>
                <div class="flex items-center gap-2 mt-2">
                  <button @click.stop.prevent="removeSingle(pkg.waybill)" class="btn btn-ghost btn-square">
                    <Trash2 class="w-4 h-4 text-error" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div v-if="donePackages.length > 0" class="mb-12">
      <h2 class="text-2xl font-semibold mb-4">Delivered Packages</h2>
      <div class="flex flex-col gap-4">
        <NuxtLink v-for="pkg in donePackages" :key="pkg.waybill" :to="`/track?waybill=${pkg.waybill}`" class="block w-full overflow-hidden rounded-lg bg-base-100">
          <div class="p-4 flex gap-4 items-start">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold truncate">{{ pkg.alias || pkg.waybill }}</h3>
              <p class="text-sm text-base-content/70 md:truncate mt-1">{{ pkg.lastActivity || pkg.lastStatus }}</p>
              <div class="flex items-center gap-3 mt-3 text-xs text-base-content/60">
                <span class="font-medium">{{ pkg.courierName }}</span>
                <span v-if="pkg.lastLocation">• {{ pkg.lastLocation }}</span>
              </div>
              <p class="text-xs text-base-content/60 mt-2">{{ timeAgo(pkg.lastUpdate) }}</p>
            </div>

              <div class="flex flex-col items-end justify-between">
                <div class="flex flex-col items-end gap-2">
                  <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-800">Delivered</span>
                </div>
                <div class="flex items-center gap-2 mt-2">
                  <button @click.stop.prevent="removeSingle(pkg.waybill)" class="btn btn-ghost btn-square">
                    <Trash2 class="w-4 h-4 text-error" />
                  </button>
                </div>
              </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div v-if="activePackages.length === 0 && donePackages.length === 0" class="text-center mt-12">
      <p class="text-lg text-base-content/60">No packages tracked yet. Start by entering a waybill number above.</p>
    </div>
  </div>
</template>

<script setup>
import { usePackageHistory } from '~/composables/usePackageHistory'
import { useTimeAgo } from '~/composables/useTimeAgo'
import { Trash2, ListRestart, Trash } from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

const runtimeConfig = useRuntimeConfig()
const { getActivePackages, getDonePackages, addOrUpdatePackage, removePackage, getHistory, setFetchedAt } = usePackageHistory()
const { formatDate, timeAgo } = useTimeAgo()

const activePackages = ref([])
const donePackages = ref([])
const loadingStates = ref({})
const isRefreshing = ref(false)

const loadHistory = () => {
  activePackages.value = getActivePackages()
  donePackages.value = getDonePackages()
}

const refreshAll = async () => {
  loadHistory()
  isRefreshing.value = true
  try {
    await autoFetchActivePackages()
  } finally {
    isRefreshing.value = false
  }
}

const removeSingle = (waybill) => {
  if (!confirm('Remove this package from history?')) return
  removePackage(waybill)
  loadHistory()
}

const clearAll = () => {
  if (!confirm('Clear all tracked packages from history?')) return
  const all = getHistory() || []
  for (const p of all) {
    removePackage(p.waybill)
  }
  loadHistory()
}

const fetchPackageStatus = async (waybill) => {
  loadingStates.value[waybill] = true
  try {
    const response = await $fetch(`${runtimeConfig.public.apiBase}/?waybill=${waybill}`)

    const records = response.records || []
    const sortedRecords = records.slice().sort((a, b) => {
      const ta = a && a.timestamp ? new Date(a.timestamp).getTime() : 0
      const tb = b && b.timestamp ? new Date(b.timestamp).getTime() : 0
      return tb - ta
    })

    const latestRecord = sortedRecords[0]
    const isDone = latestRecord?.status?.toLowerCase().includes('delivered') || 
                   latestRecord?.status?.toLowerCase().includes('selesai') ||
                   latestRecord?.status?.toLowerCase().includes('complete')

    const existing = [...activePackages.value, ...donePackages.value].find(p => p.waybill === waybill)

    const lastLocation = latestRecord?.location?.name || latestRecord?.next_location?.name || ''
    const lastActivity = latestRecord?.name || latestRecord?.status || ''

    addOrUpdatePackage(
      waybill,
      latestRecord?.status || 'Unknown',
      response.courier?.name || 'Unknown Courier',
      isDone,
      existing?.alias,
      lastLocation,
      lastActivity
      , latestRecord?.timestamp ? new Date(latestRecord.timestamp).toISOString() : undefined
    )

    loadHistory()
    return true
  } catch (err) {
    console.error(`Failed to fetch status for ${waybill}:`, err)
    return false
  } finally {
    loadingStates.value[waybill] = false
  }
}

const autoFetchActivePackages = async () => {
  const active = getActivePackages()
  if (active.length === 0) return
  isRefreshing.value = true
  try {
    const results = []
    for (const pkg of active) {
      const ok = await fetchPackageStatus(pkg.waybill)
      results.push(ok)
    }

    const allSuccess = results.length > 0 && results.every(r => r === true)
    if (allSuccess) {
      const now = new Date().toISOString()
      for (const pkg of active) {
        try { setFetchedAt(pkg.waybill, now) } catch (e) { console.error('Failed to set fetchedAt for', pkg.waybill, e) }
      }
      loadHistory()
    }
  } finally {
    isRefreshing.value = false
  }
}

let _homescreenTimer = null
const { settings, getIntervalMs } = useSettings()

const startHomescreenTimer = () => {
  if (_homescreenTimer) clearInterval(_homescreenTimer)
  const ms = getIntervalMs(settings.value.homescreenInterval)
  if (ms > 0) {
    _homescreenTimer = setInterval(() => {
      autoFetchActivePackages()
    }, ms)
  }
}

onMounted(() => {
  loadHistory()
  autoFetchActivePackages()
  startHomescreenTimer()
})

watch(() => settings.value.homescreenInterval, () => {
  startHomescreenTimer()
})

onUnmounted(() => {
  if (_homescreenTimer) clearInterval(_homescreenTimer)
})
</script>
