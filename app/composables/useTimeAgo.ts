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

function plural(n: number, s: string) { return `${n} ${s}${n !== 1 ? 's' : ''} ago` }

function describeDays(days: number) {
  const approx = Math.round(days * 10) / 10
  const display = approx % 1 === 0 ? approx.toFixed(0) : approx.toFixed(1)
  const unit = Number(display) === 1 ? 'day' : 'days'
  return `about ${display} ${unit} ago`
}

function computeAgo(date: string | number | Date) {
  if (!date) return ''
  const d = new Date(date).getTime()
  const diff = Math.floor((now.value - d) / 1000)
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

export function useTimeAgo() {
  const formatDate = (d: string | number | Date) => {
    if (!d) return ''
    try { return new Date(d).toLocaleString() } catch (e) { return String(d) }
  }

  const timeAgo = (d: string | number | Date) => computed(() => computeAgo(d))

  const timeAgoStr = (d: string | number | Date) => {
    if (!d) return ''
    return (function snap() {
      const t = new Date(d).getTime()
      const diff = Math.floor((Date.now() - t) / 1000)
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
    })()
  }

  return { formatDate, timeAgo, timeAgoStr }
}
