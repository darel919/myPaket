<template>
  <div v-if="loading" class="text-center mt-4">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
  <div v-if="error" class="text-center mt-4 text-red-500">
    {{ error }}
  </div>
  <div v-if="data" class="mt-4 max-w-4xl mx-auto">
    <TrackingMap v-if="hasCoordinates" :records="data.records" class="mb-6" />
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Courier: {{ data.courier.name }}</h2>
        <p>Waybill: {{ data.courier.waybill }}</p>
        <p>ETA: {{ formatDate(data.courier.eta) }}</p>
        <p>Start Date: {{ formatDate(data.courier.startDate) }}</p>
        <h3 class="text-lg font-semibold mt-4">History:</h3>
        <ul class="steps steps-vertical mt-4">
          <li v-for="(record, idx) in sortedRecords" :key="record.timestamp || idx" class="step" :class="{ 'step-primary': idx === 0 }" data-content="●">
            <div class="text-left ml-8 border-b-1 border-gray-600 py-4 w-full">
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
</template>

<script setup>
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
import { useTimeAgo } from '~/composables/useTimeAgo'
const { formatDate, timeAgo } = useTimeAgo()
const data = ref(null)
const loading = ref(false)
const error = ref('')

const waybill = route.query.waybill

const fetchTracking = async () => {
  if (!waybill) return
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch(`${runtimeConfig.public.apiBase}/?waybill=${waybill}`)
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

onMounted(() => {
  fetchTracking()
})
</script>