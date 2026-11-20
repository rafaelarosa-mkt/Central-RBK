import type { Evento } from './domain'
export interface GoogleEvent { id: string; summary: string; start: { date?: string; dateTime?: string }; end: { date?: string; dateTime?: string }; location?: string; description?: string; htmlLink?: string }
const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
function localParts(date: Date) {
  const p = Object.fromEntries(dateFormatter.formatToParts(date).map(p => [p.type, p.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}
export function googleEventsForMonth(events: GoogleEvent[], month: string): Evento[] {
  const out: Evento[] = [], seen = new Set<string>()
  const [year, mm] = month.split('-').map(Number)
  const days = new Date(Date.UTC(year, mm, 0)).getUTCDate()
  for (const e of events) {
    const start = e.start?.dateTime ? new Date(e.start.dateTime) : null
    const end = e.end?.dateTime ? new Date(e.end.dateTime) : null
    if (start && !Number.isFinite(+start) || end && !Number.isFinite(+end)) continue
    const startParts = start ? localParts(start) : null
    const from = e.start?.date || startParts?.date || ''
    const to = e.end?.date ? new Date(Date.parse(`${e.end.date}T00:00:00Z`) - 86400000).toISOString().slice(0, 10) : end ? localParts(new Date(+end - 1)).date : from
    if (!from || !to) continue
    let link = ''
    try { const url = new URL(e.htmlLink || ''); if (url.protocol === 'https:' && url.hostname === 'calendar.google.com') link = url.href } catch { /* Missing link. */ }
    for (let day = 1; day <= days; day++) {
      const data = `${month}-${String(day).padStart(2, '0')}`
      const id = `google:${e.id}:${data}`
      if (data < from || data > to || seen.has(id)) continue
      seen.add(id)
      out.push({ id, tipo: 'outro', titulo: e.summary, data, hora: start && data === from ? startParts!.time : '', local: e.location || '', obs: (e.description || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, ''), origem: 'google', googleUrl: link })
    }
  }
  return out
}
