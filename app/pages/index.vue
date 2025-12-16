<template>
  <div class="px-4 xl:px-8 mt-8">
    <div class="max-w-6xl mx-auto">
      <div v-if="!hasPackages">
        <h1 class="text-3xl font-bold mb-2">Welcome to myPaket!</h1>
        <p class="text-base-content/70 mb-8">Enter your waybill number in the search bar above to track your package.</p>
      </div>

      <PackageActivity />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePackageHistory } from '~/composables/usePackageHistory'

const { getActivePackages, getDonePackages } = usePackageHistory()

const hasPackages = computed(() => {
  return (getActivePackages() || []).length > 0 || (getDonePackages() || []).length > 0
})
</script>
