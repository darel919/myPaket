const now = ref(Date.now())
let timerStarted = false
function startTimer() {
  if (timerStarted) return
  timerStarted = true
  setInterval(() => {
    now.value = Date.now()
  }, 60_000)
}
startTimer()

function plural(n: number, s: string, future = false) {
  const unit = `${n} ${s}${n !== 1 ? 's' : ''}`
  return future ? `in ${unit}` : `${unit} ago`
}

function describeDays(days: number, future = false) {
  const approx = Math.round(days * 10) / 10
  const display = approx % 1 === 0 ? approx.toFixed(0) : approx.toFixed(1)
  const unit = Number(display) === 1 ? 'day' : 'days'
  return future ? `in about ${display} ${unit}` : `about ${display} ${unit} ago`
}

function computeAgo(date: string | number | Date) {
  if (!date) return ''
  const d = new Date(date).getTime()
  const diff = Math.floor((now.value - d) / 1000)
  if (diff >= 0) {
    if (diff < 5) return 'just now'
    if (diff < 60) return plural(diff, 'second')
    const m = Math.floor(diff / 60)
    if (m < 60) return plural(m, 'minute')
    const h = Math.floor(m / 60)
    if (h < 24) return plural(h, 'hour')
    const days = diff / 86_400
    if (days < 30) return describeDays(days)
    const months = Math.floor(days / 30)
    if (months < 12) return plural(months, 'month')
    const years = Math.floor(months / 12)
    return plural(years, 'year')
  }
  const f = Math.abs(diff)
  if (f < 5) return 'just now'
  if (f < 60) return plural(f, 'second', true)
  const fm = Math.floor(f / 60)
  if (fm < 60) return plural(fm, 'minute', true)
  const fh = Math.floor(fm / 60)
  if (fh < 24) return plural(fh, 'hour', true)
  const fdays = f / 86_400
  if (fdays < 30) return describeDays(fdays, true)
  const fmonths = Math.floor(fdays / 30)
  if (fmonths < 12) return plural(fmonths, 'month', true)
  const fyears = Math.floor(fmonths / 12)
  return plural(fyears, 'year', true)
}

export function useTimeAgo() {
  const formatDate = (d: string | number | Date) => {
    if (!d) return ''
    try {
      const dt = new Date(d)
      return dt.toLocaleString()
    } catch (e) { return String(d) }
  }

  const timeAgo = (d: string | number | Date) => computed(() => computeAgo(d))

  const timeAgoStr = (d: string | number | Date) => {
    if (!d) return ''
    return (function snap() {
      const t = new Date(d).getTime()
      const diff = Math.floor((Date.now() - t) / 1000)
      if (diff === 0) return 'just now'
      if (diff > 0) {
        if (diff < 5) return 'just now'
        if (diff < 60) return `${diff} second${diff !== 1 ? 's' : ''} ago`
        const m = Math.floor(diff / 60)
        if (m < 60) return `${m} minute${m !== 1 ? 's' : ''} ago`
        const h = Math.floor(m / 60)
        if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`
        const days = diff / 86_400
        if (days < 30) return describeDays(days)
        const months = Math.floor(days / 30)
        if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
        const years = Math.floor(months / 12)
        return `${years} year${years !== 1 ? 's' : ''} ago`
      }
      const f = Math.abs(diff)
      if (f < 5) return 'just now'
      if (f < 60) return `in ${f} second${f !== 1 ? 's' : ''}`
      const fm = Math.floor(f / 60)
      if (fm < 60) return `in ${fm} minute${fm !== 1 ? 's' : ''}`
      const fh = Math.floor(fm / 60)
      if (fh < 24) return `in ${fh} hour${fh !== 1 ? 's' : ''}`
      const fdays = f / 86_400
      if (fdays < 30) return describeDays(fdays, true)
      const fmonths = Math.floor(fdays / 30)
      if (fmonths < 12) return `in ${fmonths} month${fmonths !== 1 ? 's' : ''}`
      const fyears = Math.floor(fmonths / 12)
      return `in ${fyears} year${fyears !== 1 ? 's' : ''}`
    })()
  }

  return { formatDate, timeAgo, timeAgoStr }
}
