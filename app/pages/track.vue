<template>
  <div class="overflow-x-hidden">
    <div v-if="loading" class="text-center mt-4">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    <div v-if="error" class="text-center mt-4 text-red-500">
      {{ error }}
    </div>
    <div v-if="data" class="mt-4 w-full px-4 xl:px-8">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:h-[calc(100vh-7rem)]">
        <div class="xl:w-[40%] xl:h-full">
          <div class="h-[420px] xl:h-full w-full rounded-2xl border border-base-200 bg-base-100 shadow-lg overflow-hidden">
            <TrackingMap v-if="hasCoordinates" :records="data.records" class="h-full w-full" />
            <div v-else class="flex h-full items-center justify-center px-6 text-center text-sm text-base-content/60">
              Map view is not available. No location data found for this waybill.
            </div>
          </div>
        </div>
        <div class="xl:w-[60%] xl:h-full xl:overflow-y-auto">
          <div class="card w-full bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-start justify-between">
                <h2 class="card-title">Courier: {{ data.courier.name }}</h2>
                <button
                  class="btn btn-soft p-4 rounded-full ml-2"
                  @click="fetchTracking"
                  :disabled="loading"
                  title="Retry fetch"
                >
                  <span v-if="loading" class="loading loading-spinner loading-sm mr-2"></span>
                  <span v-if="!loading">Refresh</span>
                </button>
              </div>
              <p>Waybill: {{ data.courier.waybill }}</p>
              <p>ETA: {{ formatDate(data.courier.eta) }}</p>
              <p>Start Date: {{ formatDate(data.courier.startDate) }}</p>
              <h3 class="text-lg font-semibold mt-4">History:</h3>
              <ul class="steps steps-vertical mt-4">
                <li v-for="(record, idx) in sortedRecords" :key="record.timestamp || idx" class="step" :class="{ 'step-primary': idx === 0 }" data-content="●">
                  <div class="text-left border-b-1 border-gray-600 py-4 px-8 w-full max-w-full box-border break-words whitespace-normal">
                    <p class="text-xl font-light mb-6">{{ record.name }}</p>
                    <section class="my-2">
                      <p class="text-lg">Time: {{ formatDate(record.timestamp) }} ({{ timeAgo(record.timestamp) }})</p>
                      <p class="text-lg">Status: <b>{{ record.status }}</b></p>
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
const { formatDate, timeAgo } = useTimeAgo()
const data = ref(null)
const loading = ref(false)
const error = ref('')

const fetchTracking = async () => {
  const currentWaybill = route.query.waybill
  if (!currentWaybill) return
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch(`${runtimeConfig.public.apiBase}/?waybill=${currentWaybill}`)
    data.value = response
  } catch (err) {
    error.value = 'Failed to fetch tracking information'
    console.error(err)
  } finally {
    loading.value = false
  }
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
    fetchTracking()
  }
)

onMounted(() => {
  fetchTracking()
})
</script>