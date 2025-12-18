<template>
  <div class="px-4 xl:px-8 mt-16 md:mt-8">
    <div class="max-w-6xl mx-auto">
      <div v-if="!hasPackages">
        <h1 class="text-3xl font-bold mb-2">Welcome to myPaket!</h1>
        <p class="text-base-content/70 mb-8">Enter your waybill number in the search bar above to track your package.</p>
      </div>

      <div v-if="lastFetchedLabel" class="flex justify-end mb-4">
        <div class="text-sm text-base-content/60">{{ lastFetchedLabel }}</div>
      </div>

      <PackageActivity />
    </div>
  </div>
</template>

<script setup>
import { usePackageHistory } from '~/composables/usePackageHistory'
import { useTimeAgo } from '~/composables/useTimeAgo'

const { getActivePackages, getDonePackages, getHistory } = usePackageHistory()
const { timeAgo } = useTimeAgo()

const hasPackages = computed(() => {
  return (getActivePackages() || []).length > 0 || (getDonePackages() || []).length > 0
})

const lastFetchedLabel = computed(() => {
  const history = getHistory() || []
  if (history.length === 0) return ''
  const times = history.map(p => (p.fetchedAt || p.lastUpdate) ? new Date(p.fetchedAt || p.lastUpdate).getTime() : 0)
  const max = Math.max(...times)
  if (!max || max <= 0) return ''
  return `Fetched ${timeAgo(new Date(max).toISOString()).value}`
})
</script>
