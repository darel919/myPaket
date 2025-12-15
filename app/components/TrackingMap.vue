<template>
  <ClientOnly v-if="hasCoords">
    <div v-if="leafletLoaded" class="h-full w-full overflow-hidden">
      <LMap 
        ref="mapRef" 
        :zoom="zoom" 
        :center="center" 
        :use-global-leaflet="true"
        style="height: 100%; width: 100%;"
      >
        <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" :attribution="osmAttribution" />

        <LMarker v-for="(p, idx) in points" :key="idx" :lat-lng="[p.lat, p.lng]">
          <LPopup>
            <div v-html="p.popup"></div>
          </LPopup>
        </LMarker>

        <LCircleMarker v-if="master" :lat-lng="[master.lat, master.lng]" :radius="8" :color="'#e11d48'" :fill-color="'#fda4af'" :fill-opacity="0.9">
            <LPopup>
              <div v-html="`<strong>Current (approx)</strong><br/>${master.info}<br/><small>${master.timeAbs || ''} (${master.timeRel || ''})</small>`"></div>
            </LPopup>
        </LCircleMarker>
      </LMap>
    </div>
    <div v-else class="h-full w-full overflow-hidden bg-base-200 flex items-center justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  </ClientOnly>
</template>

<script setup>
import { LMap, LTileLayer, LMarker, LPopup, LCircleMarker } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { useTimeAgo } from '~/composables/useTimeAgo'

const props = defineProps({ records: { type: Array, default: () => [] } })

const mapRef = ref(null)
const leafletLoaded = ref(false)
const { formatDate, timeAgoStr } = useTimeAgo()
const osmAttribution = '&copy; OpenStreetMap contributors'

const parseNum = (v) => {
  const n = parseFloat(v)
  return Number.isNaN(n) ? null : n
}

const points = computed(() => {
  const out = []
  for (const r of props.records || []) {
    if (r?.location?.lat && r?.location?.lng) {
      const lat = parseNum(r.location.lat)
      const lng = parseNum(r.location.lng)
      if (lat !== null && lng !== null) {
        const statusPart = r.status ? `${r.status} — ` : ''
        const timeAbs = formatDate(r.timestamp)
        const timeRel = timeAgoStr(r.timestamp)
        const popupHtml = `${r.location.name || ''} — ${statusPart}${r.name || ''}<br/><small>${timeAbs} (${timeRel})</small>`
        out.push({ lat, lng, popup: popupHtml, ts: r.timestamp })
      }
    }
    if (r?.next_location?.lat && r?.next_location?.lng) {
      const lat2 = parseNum(r.next_location.lat)
      const lng2 = parseNum(r.next_location.lng)
      if (lat2 !== null && lng2 !== null) {
        const statusPart = r.status ? `${r.status} — ` : ''
        const timeAbs = formatDate(r.timestamp)
        const timeRel = timeAgoStr(r.timestamp)
        const popupHtml = `Next: ${r.next_location.name || ''} — ${statusPart}${r.name || ''}<br/><small>${timeAbs} (${timeRel})</small>`
        out.push({ lat: lat2, lng: lng2, popup: popupHtml, ts: r.timestamp })
      }
    }
  }
  return out
})

const master = computed(() => {
  try {
    const recs = (props.records || []).filter(r => r && r.timestamp)
    const withCoords = recs.filter(r => (r.location && r.location.lat && r.location.lng) || (r.next_location && r.next_location.lat && r.next_location.lng))
    withCoords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    if (withCoords.length) {
      const mr = withCoords[0]
      const loc = (mr.location && mr.location.lat && mr.location.lng) ? mr.location : mr.next_location
      const lat = parseNum(loc.lat)
      const lng = parseNum(loc.lng)
      if (lat !== null && lng !== null) {
        const statusPart = mr.status ? `${mr.status} — ` : ''
        const timeAbs = formatDate(mr.timestamp)
        const timeRel = timeAgoStr(mr.timestamp)
        return { lat, lng, info: `${loc.name || ''} — ${statusPart}${mr.name || ''}`, ts: mr.timestamp, timeAbs, timeRel }
      }
    }
  } catch (e) { }
  return null
})

const hasCoords = computed(() => points.value.length > 0 || !!master.value)

const center = computed(() => {
  if (points.value.length) return [points.value[0].lat, points.value[0].lng]
  if (master.value) return [master.value.lat, master.value.lng]
  return [-6.2, 106.8]
})

const zoom = ref(points.value.length ? 6 : 5)

const fitBounds = async () => {
  if (!process.client) return
  const comp = mapRef.value
  if (!comp || !comp.mapObject) return
  const map = comp.mapObject
  const coords = []
  for (const p of points.value) coords.push([p.lat, p.lng])
  if (master.value) coords.push([master.value.lat, master.value.lng])
  if (master.value) {
    try { map.setView([master.value.lat, master.value.lng], 16) } catch (e) { }
  } else if (coords.length) {
    try { map.fitBounds(coords, { padding: [50, 50] }) } catch (e) { }
  } else {
    try { map.setView(center.value, zoom.value) } catch (e) { }
  }
}

onMounted(async () => {
  if (!process.client) return
  
  try {
    const L = await import('leaflet')
    const leaflet = L.default || L
    
    if (!window.L) {
      window.L = leaflet
    }
    
    if (leaflet.Icon && leaflet.Icon.Default) {
      leaflet.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      })
    }
    
    leafletLoaded.value = true
    await nextTick()
    
    setTimeout(async () => {
      await fitBounds()
      try {
        const comp = mapRef.value
        if (comp && comp.mapObject && master.value) {
          comp.mapObject.setView([master.value.lat, master.value.lng], 16)
        }
      } catch (e) {}
    }, 300)
  } catch (e) {
    console.error('Failed to load Leaflet:', e)
  }
})

watch(() => props.records, async () => {
  await nextTick()
  await fitBounds()
}, { deep: true })

onBeforeUnmount(() => {
  try {
    if (mapRef.value && mapRef.value.mapObject) mapRef.value.mapObject.remove()
  } catch (e) {}
})
</script>

<style scoped>
:deep(.leaflet-container) { 
  height: 100%; 
  width: 100%; 
  z-index: 0;
}
</style>
