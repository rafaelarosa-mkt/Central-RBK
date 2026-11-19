import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seal, unseal, monthRange, handleGoogle } from '../server/google-calendar.mjs'
import { googleEventsForMonth } from '../src/lib/google-events.ts'
const response = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v }, status(s) { this.statusCode = s; return this }, json(b) { this.body = b }, end() {} })
test('tokens encrypted and authenticated; tampering/wrong key rejected', () => {
  const value = seal({ refresh: 'private-token', uid: 'user' }, 'secret')
  assert.ok(!value.includes('private-token'))
  assert.equal(unseal(value, 'secret').uid, 'user')
  assert.equal(unseal(value, 'other'), null)
  assert.equal(unseal(`x${value.slice(1)}`, 'secret'), null)
})
test('validates month and December rollover', () => {
  assert.equal(monthRange('2026-13'), null)
  assert.equal(monthRange('2026-12').timeMax, '2027-01-01T00:00:00-03:00')
})
test('rejects unauthenticated access and cross-origin writes', async () => {
  const a = response(); await handleGoogle({ url: '/api/google-calendar?action=events', method: 'GET', headers: {} }, a, {})
  assert.equal(a.statusCode, 401)
  const b = response(); await handleGoogle({ url: '/api/google-calendar?action=start', method: 'POST', headers: { origin: 'https://wrong.example' } }, b, {})
  assert.equal(b.statusCode, 403)
})
test('callback rejects invalid state before exchanging any token', async () => {
  const r = response(); await handleGoogle({ url: '/api/google-calendar?action=callback&code=bad&state=bad', method: 'GET', headers: {} }, r, { GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' })
  assert.equal(r.statusCode, 303)
  assert.ok(r.headers.Location.endsWith('estado_invalido'))
})
test('all-day end exclusive, timezone conversion and multi-day clipping', () => {
  const events = [
    { id: 'a', summary: 'Dois dias', start: { date: '2026-11-18' }, end: { date: '2026-11-20' } },
    { id: 'b', summary: 'Noite', start: { dateTime: '2026-11-20T02:00:00Z' }, end: { dateTime: '2026-11-20T03:00:00Z' }, htmlLink: 'javascript:alert(1)' },
    { id: 'c', summary: 'Outro mês', start: { date: '2026-10-30' }, end: { date: '2026-11-02' } },
  ]
  const out = googleEventsForMonth(events, '2026-11')
  assert.deepEqual(out.filter(e => e.titulo === 'Dois dias').map(e => e.data), ['2026-11-18', '2026-11-19'])
  assert.equal(out.find(e => e.titulo === 'Noite').hora, '23:00')
  assert.equal(out.find(e => e.titulo === 'Noite').data, '2026-11-19')
  assert.equal(out.find(e => e.titulo === 'Noite').googleUrl, '')
  assert.deepEqual(out.filter(e => e.titulo === 'Outro mês').map(e => e.data), ['2026-11-01'])
  assert.equal(googleEventsForMonth([...events, ...events], '2026-11').length, out.length)
  assert.equal(googleEventsForMonth([], '2026-11').length, 0)
})
test('server binds connection to Supabase user and never exposes refresh token', async () => {
  const original = globalThis.fetch
  const env = { GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'public' }
  globalThis.fetch = async () => Response.json({ id: 'user-2', app_metadata: { central_rbk: true } })
  try {
    const r = response()
    await handleGoogle({ url: '/api/google-calendar', method: 'GET', headers: { authorization: 'Bearer session', cookie: `__Host-rbk_google=${seal({ uid: 'user-1', email: 'rafaelabose@gmail.com', refresh: 'private-token', expires: Date.now() + 60000 }, 'secret')}` } }, r, env)
    assert.equal(r.body.connected, false)
    assert.ok(!JSON.stringify(r.body).includes('private-token'))
  } finally { globalThis.fetch = original }
})
