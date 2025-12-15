<template>
  <div class="fixed top-0 left-0 right-0 z-50 shadow-md p-4 backdrop-blur-sm bg-black/25">
    <div class="max-w-4xl mx-auto flex items-center gap-4">
      <NuxtLink to="/" class="fixed left-8 font-bold text-xl">myPaket</NuxtLink>
      <div class="flex-1">
        <input
          v-model="waybill"
          @keyup.enter="navigateTo('/track?waybill=' + waybill)"
          type="text"
          placeholder="Enter waybill number"
          class="input input-bordered w-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const waybill = ref('')
</script>