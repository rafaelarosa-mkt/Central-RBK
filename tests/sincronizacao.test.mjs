import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reactive } from 'vue'
import { criarFetchComPrazo, aplicarRegistro, criarListaEstavel } from '../src/lib/sincronizacao.ts'

test('salvar um registro mantém identidade dos demais e ignora eco realtime', () => {
  const registros = reactive({ a: { nome: 'A' }, b: { nome: 'B' } })
  const montar = criarListaEstavel()
  const antes = montar(registros)
  aplicarRegistro(registros, 'a', { nome: 'Novo A' })
  const depois = montar(registros)
  assert.notEqual(depois[0], antes[0])
  assert.equal(depois[1], antes[1])
  aplicarRegistro(registros, 'a', { nome: 'Novo A' })
  assert.equal(montar(registros)[0], depois[0])
})

test('conexão parada é cancelada sem repetição automática da escrita', async () => {
  let chamadas = 0
  const fake = async (_, { signal }) => {
    chamadas++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 1000)
      signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason) }, { once: true })
    })
  }
  await assert.rejects(criarFetchComPrazo(fake, 10)('https://example.test', { method: 'POST' }), { name: 'TimeoutError' })
  assert.equal(chamadas, 1)
})

test('preserva cancelamento do chamador e respostas bem sucedidas', async () => {
  const controller = new AbortController()
  controller.abort()
  const fake = async (_, { signal }) => { signal.throwIfAborted(); return new Response('ok') }
  await assert.rejects(criarFetchComPrazo(fake)('https://example.test', { signal: controller.signal }), { name: 'AbortError' })
  assert.equal(await (await criarFetchComPrazo(fake)('https://example.test')).text(), 'ok')
})
