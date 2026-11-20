import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { session } from './store'
import type { Evento } from './domain'
import { googleEventsForMonth } from './google-events'
export function useGoogleCalendar(month: Ref<string>) {
  const events = ref<Evento[]>([]), connected = ref(false), configured = ref(false), checking = ref(true), busy = ref(false), error = ref(''), syncedAt = ref('')
  let controller: AbortController | undefined, sequence = 0, stopped = false, timer: ReturnType<typeof setInterval> | undefined
  let lastSync = 0
  async function api(action: string, method = 'GET', signal?: AbortSignal) {
    const token = session.value?.access_token
    if (!token) throw new Error('Entre novamente na Central.')
    const response = await fetch(`/api/google-calendar?action=${action}`, { method, credentials: 'same-origin', headers: { Authorization: `Bearer ${token}` }, signal })
    const data = await response.json()
    if (!response.ok) { if (data.reconnect) { connected.value = false; events.value = []; syncedAt.value = '' }; throw new Error(data.error || 'Falha na conexão Google.') }
    return data
  }
  async function sync() {
    if (!connected.value || stopped) return
    controller?.abort(); controller = new AbortController()
    const current = ++sequence, selected = month.value
    busy.value = true
    try {
      const data = await api(`events&month=${encodeURIComponent(selected)}`, 'GET', controller.signal)
      if (current !== sequence || stopped) return
      events.value = googleEventsForMonth(data.events, selected)
      lastSync = Date.now()
      syncedAt.value = new Date(data.syncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      error.value = ''
    } catch (e) { if (current === sequence && !stopped && !(e instanceof Error && e.name === 'AbortError')) error.value = e instanceof Error ? e.message : 'Falha ao atualizar a agenda.' }
    finally { if (current === sequence) busy.value = false }
  }
  async function check() {
    checking.value = true
    try { const data = await api('status'); if (stopped) return; configured.value = data.configured; connected.value = data.connected; if (connected.value) await sync() }
    catch { if (!stopped) error.value = 'Não foi possível verificar a conexão Google. Atualize a página.' }
    finally { checking.value = false }
  }
  async function connect() {
    busy.value = true; error.value = ''
    try { const data = await api('start', 'POST'); window.location.assign(data.url) }
    catch (e) { error.value = e instanceof Error ? e.message : 'Falha ao conectar.'; busy.value = false }
  }
  async function disconnect() {
    busy.value = true
    controller?.abort(); sequence++
    try { await api('disconnect', 'POST'); connected.value = false; events.value = []; syncedAt.value = ''; error.value = '' }
    catch (e) { error.value = e instanceof Error ? e.message : 'Falha ao desconectar.' }
    finally { busy.value = false }
  }
  const visible = () => { if (document.visibilityState === 'visible' && !busy.value && Date.now() - lastSync >= 60000) void sync() }
  watch(month, () => { events.value = []; syncedAt.value = ''; void sync() })
  onMounted(() => { void check(); timer = setInterval(() => { if (document.visibilityState === 'visible' && !busy.value) void sync() }, 60000); document.addEventListener('visibilitychange', visible) })
  onUnmounted(() => { stopped = true; sequence++; controller?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visible) })
  return { events, connected, configured, checking, busy, error, syncedAt, sync, connect, disconnect }
}
