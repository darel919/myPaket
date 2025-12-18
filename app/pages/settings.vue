<template>
  <div class="px-4 xl:px-8 mt-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-4">Settings</h1>

    <div class="card p-6 mb-6">
      <h2 class="text-lg font-semibold mb-3">Autofetch intervals</h2>
      <p class="text-sm text-base-content/60 mb-4">Choose how often the app should auto-fetch tracking updates.</p>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="font-medium">Home screen</label>
          <div class="mt-2 flex flex-col gap-2">
            <label v-for="opt in optionsHome" :key="opt.value" class="flex items-center gap-3">
              <input type="radio" name="homescreen" :value="opt.value" v-model="settings.homescreenInterval" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div>
          <label class="font-medium">Track page</label>
          <div class="mt-2 flex flex-col gap-2">
            <label v-for="opt in optionsTrack" :key="opt.value + '_t'" class="flex items-center gap-3">
              <input type="radio" name="track" :value="opt.value" v-model="settings.trackInterval" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center gap-3">
        <button class="btn btn-primary" @click="save">Save</button>
        <button class="btn btn-ghost" @click="load">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSettings } from '~/composables/useSettings'
const { read, save: saveToStorage, DEFAULT } = useSettings()

const optionsHome = [
  { value: 'disabled', label: 'Disabled' },
  { value: '6', label: 'Every 6h' },
  { value: '12', label: 'Every 12h' },
  { value: '24', label: 'Every 24h' }
]

const optionsTrack = [
  { value: 'disabled', label: 'Disabled' },
  { value: '1', label: 'Every 1h' },
  { value: '3', label: 'Every 3h' },
  { value: '6', label: 'Every 6h' }
]

const settings = ref(read())

const load = () => {
  settings.value = read()
}

const saveSettings = () => {
  saveToStorage(settings.value)
}

const save = saveSettings
</script>

