<template>
  <div class="fixed top-0 left-0 right-0 z-50 shadow-md backdrop-blur-sm bg-black/25 items-center py-1 sm:py-4 pb-4 sm:pb-4">
    <NuxtLink to="/" class="block pl-4 pr-16 py-4 font-bold text-xl md:absolute md:left-6 md:top-1/2 md:-translate-y-1/2 md:py-0 md:px-0 md:z-20">myPaket</NuxtLink>

    <div class="max-w-6xl mx-auto px-4 md:pl-24 lg:pl-28">
      <div class="flex flex-col md:flex-row md:items-center md:justify-center gap-4">
        <div class="w-full md:w-auto md:flex-1 flex justify-center">
          <input
            v-model="waybill"
            @keyup.enter="navigateTo('/track?waybill=' + waybill)"
            type="text"
            placeholder="Enter waybill number"
            class="input input-bordered w-full max-w-2xl"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const waybill = ref('')
</script>