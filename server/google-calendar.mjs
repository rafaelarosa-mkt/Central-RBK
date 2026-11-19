import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
export const ACCOUNT = 'rafaelabose@gmail.com'
export const SCOPE = 'openid email https://www.googleapis.com/auth/calendar.events.readonly'
const STATE_COOKIE = '__Host-rbk_google_state'
const TOKEN_COOKIE = '__Host-rbk_google'
const MAX_AGE = 180 * 86400
const origin = env => new URL(env.CENTRAL_APP_URL || 'https://central-rbk.vercel.app').origin
export const callbackUrl = env => `${origin(env)}/api/google-calendar?action=callback`
const key = secret => createHash('sha256').update(secret).digest()
export function seal(value, secret) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(secret), iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url')
}
export function unseal(value, secret) {
  try {
    const data = Buffer.from(value || '', 'base64url')
    const cipher = createDecipheriv('aes-256-gcm', key(secret), data.subarray(0, 12))
    cipher.setAuthTag(data.subarray(12, 28))
    return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString())
  } catch { return null }
}
const cookie = (name, value, age) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`
const getCookie = (req, name) => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`))?.slice(name.length + 1)
export function monthRange(month) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month || '')) return null
  const [y, m] = month.split('-').map(Number)
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
  return { timeMin: `${month}-01T00:00:00-03:00`, timeMax: `${next}T00:00:00-03:00` }
}
async function jsonFetch(url, options = {}) {
  const r = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) })
  const data = await r.json()
  if (!r.ok) { const e = new Error('Provider request failed'); e.status = r.status; e.providerCode = data.error; throw e }
  return data
}
async function currentUser(req, env) {
  const token = req.headers.authorization
  if (!token?.startsWith('Bearer ')) return null
  const url = env.VITE_SUPABASE_URL, anon = env.VITE_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  try {
    const user = await jsonFetch(`${url}/auth/v1/user`, { headers: { Authorization: token, apikey: anon } })
    return user.app_metadata?.central_rbk === true ? user : null
  } catch { return null }
}
export async function handleGoogle(req, res, env = process.env) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Referrer-Policy', 'no-referrer')
  const url = new URL(req.url, origin(env)), action = url.searchParams.get('action') || 'status'
  const configured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  const secret = env.GOOGLE_CLIENT_SECRET
  const send = (code, body) => res.status(code).json(body)
  const redirect = status => { res.statusCode = 303; res.setHeader('Location', `${origin(env)}/agenda?google=${status}`); res.end() }
  if (action === 'callback') {
    if (req.method !== 'GET') return send(405, { error: 'Método inválido.' })
    if (!configured) return redirect('configuracao')
    const state = unseal(getCookie(req, STATE_COOKIE), secret)
    res.setHeader('Set-Cookie', cookie(STATE_COOKIE, '', 0))
    if (!state || state.expires < Date.now() || state.state !== url.searchParams.get('state')) return redirect('estado_invalido')
    if (url.searchParams.has('error') || !url.searchParams.get('code')) return redirect('cancelado')
    try {
      const token = await jsonFetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: secret, code: url.searchParams.get('code'), code_verifier: state.verifier, grant_type: 'authorization_code', redirect_uri: callbackUrl(env) }) })
      const profile = await jsonFetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } })
      if (profile.email !== ACCOUNT || profile.email_verified !== true) return redirect('conta_incorreta')
      if (!token.refresh_token || !token.scope?.split(' ').includes('https://www.googleapis.com/auth/calendar.events.readonly')) return redirect('permissao')
      const encrypted = seal({ uid: state.uid, refresh: token.refresh_token, email: profile.email, expires: Date.now() + MAX_AGE * 1000 }, secret)
      res.setHeader('Set-Cookie', [cookie(STATE_COOKIE, '', 0), cookie(TOKEN_COOKIE, encrypted, MAX_AGE)])
      return redirect('conectado')
    } catch { return redirect('falha') }
  }
  const methods = { status: 'GET', events: 'GET', start: 'POST', disconnect: 'POST' }
  if (!methods[action]) return send(404, { error: 'Operação não encontrada.' })
  if (req.method !== methods[action]) return send(405, { error: 'Método inválido.' })
  if (req.method === 'POST' && req.headers.origin !== origin(env)) return send(403, { error: 'Origem não autorizada.' })
  const user = await currentUser(req, env)
  if (!user) return send(401, { error: 'Entre na Central com uma conta autorizada.' })
  const stored = configured ? unseal(getCookie(req, TOKEN_COOKIE), secret) : null
  const connected = Boolean(stored && stored.uid === user.id && stored.email === ACCOUNT && stored.expires > Date.now())
  if (action === 'status') return send(200, { configured, connected, account: ACCOUNT })
  if (action === 'disconnect') { res.setHeader('Set-Cookie', [cookie(TOKEN_COOKIE, '', 0), cookie(STATE_COOKIE, '', 0)]); return send(200, { disconnected: true }) }
  if (!configured) return send(503, { error: 'A conexão Google ainda precisa ser configurada na Central.' })
  if (action === 'start') {
    const state = randomBytes(32).toString('base64url'), verifier = randomBytes(32).toString('base64url')
    res.setHeader('Set-Cookie', cookie(STATE_COOKIE, seal({ state, verifier, uid: user.id, expires: Date.now() + 600000 }, secret), 600))
    const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: callbackUrl(env), response_type: 'code', scope: SCOPE, access_type: 'offline', prompt: 'consent', login_hint: ACCOUNT, state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' })
    return send(200, { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` })
  }
  if (!connected) return send(409, { reconnect: true, error: 'Conecte sua conta Google neste navegador.' })
  const range = monthRange(url.searchParams.get('month'))
  if (!range) return send(400, { error: 'Mês inválido.' })
  try {
    const token = await jsonFetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: secret, refresh_token: stored.refresh, grant_type: 'refresh_token' }) })
    const events = []
    let pageToken
    for (let page = 0; page < 20; page++) {
      const params = new URLSearchParams({ ...range, singleEvents: 'true', orderBy: 'startTime', timeZone: 'America/Sao_Paulo', maxResults: '2500', ...(pageToken ? { pageToken } : {}) })
      const data = await jsonFetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ACCOUNT)}/events?${params}`, { headers: { Authorization: `Bearer ${token.access_token}` } })
      events.push(...(data.items || []).filter(e => e.status !== 'cancelled').map(e => ({ id: e.id, summary: e.summary || 'Sem título', start: e.start, end: e.end, location: e.location || '', description: e.description || '', htmlLink: e.htmlLink || '' })))
      pageToken = data.nextPageToken
      if (!pageToken) return send(200, { events, syncedAt: new Date().toISOString(), account: ACCOUNT })
    }
    return send(502, { error: 'Muitos eventos neste mês. Não foi possível concluir a atualização.' })
  } catch (e) {
    if (e.providerCode === 'invalid_grant' || e.status === 401) {
      res.setHeader('Set-Cookie', cookie(TOKEN_COOKIE, '', 0))
      return send(409, { reconnect: true, error: 'A autorização do Google expirou ou foi revogada. Conecte novamente.' })
    }
    return send(502, { error: 'Não foi possível atualizar o Google Agenda. Tente novamente.' })
  }
}
