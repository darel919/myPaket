<template>
  <div class="overflow-x-hidden mt-8 md:mt-0">
    <div v-if="loading" class="text-center mt-4">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    <div v-if="error" class="text-center mt-4 text-red-500">
      {{ error }}
    </div>
    <div v-if="data" class="mt-3 w-full px-2 sm:px-4 xl:px-8">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:h-[calc(100vh-7rem)]">
        <div v-if="hasCoordinates" class="xl:w-[40%] xl:h-full">
          <div class="h-[420px] xl:h-full w-full rounded-2xl border border-base-200 bg-base-100 shadow-lg overflow-hidden">
            <TrackingMap v-if="hasCoordinates" :records="data.records" class="h-full w-full" />
            <div v-else class="flex h-full items-center justify-center px-6 text-center text-sm text-base-content/60">
              Map view is not available. No location data found for this waybill.
            </div>
          </div>
        </div>
        <div :class="hasCoordinates ? 'xl:w-[60%] xl:h-full xl:overflow-y-auto' : 'xl:w-full xl:h-full xl:overflow-y-auto mt-8 md:mt-0'">
          <div class="card w-full bg-base-100 shadow-xl">
            <div class="card-body p-4 sm:p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h2 class="card-title">Courier: {{ data.courier.name }}</h2>
                  <div class="mt-2 flex items-center gap-2">
                    <span class="text-sm text-base-content/60">Package Name:</span>
                    <div v-if="!isEditingAlias" class="flex items-center gap-2">
                      <span class="text-sm font-medium">{{ packageAlias || 'Not set' }}</span>
                      <button
                        class="btn btn-xs btn-ghost"
                        @click="isEditingAlias = true"
                        title="Edit package name"
                      >
                        ✏️
                      </button>
                    </div>
                    <div v-else class="flex items-center gap-2">
                      <input
                        v-model="packageAlias"
                        type="text"
                        placeholder="Enter package name"
                        class="input input-sm input-bordered"
                        @keyup.enter="saveAlias"
                        @keyup.esc="isEditingAlias = false"
                      />
                      <button
                        class="btn btn-xs btn-primary"
                        @click="saveAlias"
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        class="btn btn-xs btn-ghost"
                        @click="isEditingAlias = false"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
                <section class="flex items-center gap-2">
                  <div v-if="!isMobile && lastFetched" class="self-center mr-2 text-sm text-base-content/60">{{ fetchedText }}</div>
                  <button
                    class="btn btn-soft p-4 rounded-full"
                    @click="fetchTracking"
                    :disabled="loading"
                    title="Retry fetch"
                  >
                    <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
                    <span v-if="!loading">Refresh</span>
                  </button>
                </section>
              </div>
              <p>Waybill: {{ data.courier.waybill }}</p>
              <p>ETA: {{ formatDate(data.courier.eta) }} ({{ timeAgo(data.courier.eta) }})</p>
              <p>Start Date: {{ formatDate(data.courier.startDate) }} ({{ timeAgo(data.courier.startDate) }})</p>
              <p v-if="isMobile && lastFetched" class="text-sm text-base-content/60 mt-1">{{ fetchedText }}</p>
              <h3 class="text-lg font-semibold mt-3">History:</h3>
              <ul class="steps steps-vertical mt-2">
                <li v-for="(record, idx) in sortedRecords" :key="record.timestamp || idx" class="step" :class="{ 'step-primary': idx === 0 }" data-content="●">
                  <div class="text-left py-2 xl:py-4 px-3 xl:px-8 w-full max-w-full box-border break-words whitespace-normal">
                    <p class="text-lg font-light mb-3">{{ record.name }}</p>
                    <section class="my-1">
                      <p class="text-base sm:text-lg">Time: {{ formatDate(record.timestamp) }} ({{ timeAgo(record.timestamp) }})</p>
                      <p class="text-base sm:text-lg">Status: <b>{{ record.status }}</b></p>
                    </section>
                    <p v-if="record.location" class="text-sm">From: {{ record.location.name }}</p>
                    <p v-if="record.next_location" class="text-sm">To: {{ record.next_location.name }}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
import { useTimeAgo } from '~/composables/useTimeAgo'
import { useSettings } from '~/composables/useSettings'
import { usePackageHistory } from '~/composables/usePackageHistory'
const { formatDate, timeAgo, timeAgoStr } = useTimeAgo()
const { addOrUpdatePackage, updateAlias, getHistory, setFetchedAt } = usePackageHistory()

const data = ref(null)
const loading = ref(false)
const error = ref('')
const packageAlias = ref('')
const isEditingAlias = ref(false)
const isMobile = ref(false)
const lastFetched = ref(null)
let _mm = null

const fetchedText = computed(() => {
  return lastFetched.value ? `Fetched ${timeAgo(lastFetched.value).value}` : ''
})

const currentWaybill = computed(() => String(route.query.waybill || ''))

onMounted(() => {
  const history = getHistory()
  const existing = history.find(p => p.waybill === currentWaybill.value)
  if (existing?.alias) {
    packageAlias.value = existing.alias
  }
  fetchTracking()

  if (process.client) {
    _mm = window.matchMedia('(max-width: 767px)')
    const _handler = (e) => { isMobile.value = e.matches }
    isMobile.value = _mm.matches
    if (_mm.addEventListener) _mm.addEventListener('change', _handler)
    else _mm.addListener(_handler)
    onUnmounted(() => {
      if (!_mm) return
      if (_mm.removeEventListener) _mm.removeEventListener('change', _handler)
      else _mm.removeListener(_handler)
      _mm = null
    })
  }
})

let _trackTimer = null
const { settings, getIntervalMs } = useSettings()
const lastIsDone = ref(false)

const clearTrackTimer = () => {
  if (_trackTimer) {
    clearInterval(_trackTimer)
    _trackTimer = null
  }
}

const setupTrackTimer = (isDone) => {
  clearTrackTimer()
  lastIsDone.value = !!isDone
  if (isDone) return
  const ms = getIntervalMs(settings.value.trackInterval)
  if (ms > 0) {
    _trackTimer = setInterval(() => {
      fetchTracking()
    }, ms)
  }
}

watch(() => settings.value.trackInterval, () => {
  setupTrackTimer(lastIsDone.value)
})

onUnmounted(() => {
  clearTrackTimer()
})

const fetchTracking = async () => {
  if (!currentWaybill.value) return
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch(`${runtimeConfig.public.apiBase}/?waybill=${currentWaybill.value}`)
    data.value = response
    lastFetched.value = new Date().toISOString()
    try {
      setFetchedAt(currentWaybill.value, lastFetched.value)
    } catch (e) {
      console.error('Failed to record fetchedAt:', e)
    }
    
    const latestRecord = sortedRecords.value[0]
    const isDone = latestRecord?.status?.toLowerCase().includes('delivered') || 
             latestRecord?.status?.toLowerCase().includes('selesai') ||
             latestRecord?.status?.toLowerCase().includes('complete')

    const lastLocation = latestRecord?.location?.name || latestRecord?.next_location?.name || ''
    const lastActivity = latestRecord?.name || latestRecord?.status || ''

    addOrUpdatePackage(
      currentWaybill.value,
      latestRecord?.status || 'Unknown',
      response.courier?.name || 'Unknown Courier',
      isDone,
      packageAlias.value || undefined,
      lastLocation,
      lastActivity, 
      latestRecord?.timestamp ? new Date(latestRecord.timestamp).toISOString() : undefined
    )
    setupTrackTimer(isDone)
  } catch (err) {
    error.value = 'Failed to fetch tracking information'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const saveAlias = () => {
  if (currentWaybill.value && packageAlias.value.trim()) {
    updateAlias(currentWaybill.value, packageAlias.value.trim())
    
    if (data.value) {
      const latestRecord = sortedRecords.value[0]
      const isDone = latestRecord?.status?.toLowerCase().includes('delivered') || 
                     latestRecord?.status?.toLowerCase().includes('selesai') ||
                     latestRecord?.status?.toLowerCase().includes('complete')
      
      const lastLocation = latestRecord?.location?.name || latestRecord?.next_location?.name || ''
      const lastActivity = latestRecord?.name || latestRecord?.status || ''

      addOrUpdatePackage(
        currentWaybill.value,
        latestRecord?.status || 'Unknown',
        data.value.courier?.name || 'Unknown Courier',
        isDone,
        packageAlias.value.trim(),
        lastLocation,
        lastActivity
        , latestRecord?.timestamp ? new Date(latestRecord.timestamp).toISOString() : undefined
      )
    }
  }
  isEditingAlias.value = false
}

const sortedRecords = computed(() => {
  const recs = (data.value && data.value.records) ? (Array.isArray(data.value.records) ? data.value.records.slice() : []) : []
  return recs.sort((a, b) => {
    const ta = a && a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tb = b && b.timestamp ? new Date(b.timestamp).getTime() : 0
    return tb - ta
  })
})

const hasCoordinates = computed(() => {
  const recs = data.value?.records || []
  return recs.some(r => 
    (r?.location?.lat && r?.location?.lng) || 
    (r?.next_location?.lat && r?.next_location?.lng)
  )
})

watch(
  () => route.query.waybill,
  (newWaybill, oldWaybill) => {
    if (!newWaybill) {
      data.value = null
      return
    }
    if (newWaybill === oldWaybill) return
    
    const history = getHistory()
    const existing = history.find(p => p.waybill === String(newWaybill))
    packageAlias.value = existing?.alias || ''
    
    fetchTracking()
  }
)
</script>