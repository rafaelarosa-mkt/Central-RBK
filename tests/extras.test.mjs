import { test } from 'node:test'
import assert from 'node:assert/strict'
import { separarProducao, validarExtra } from '../src/lib/extras.ts'
test('extras não contam na produção do plano; registros antigos continuam incluídos', () => {
  const original = [{ id: 'video', tipo: 'video' }, { id: 'extra', tipoRegistro: 'demanda_extra' }, { id: 'arquivo', tipoRegistro: 'demanda_extra', arquivada: true }]
  const { plano, extras } = separarProducao(original)
  assert.deepEqual(plano.map(i => i.id), ['video'])
  assert.equal(extras.length, 2)
  assert.equal(original.length, 3)
})
test('valida título, cliente e prazo sem exigir data para um pedido ainda em definição', () => {
  const d = { clientId: 'c', titulo: 'Convite', etapa: 'recebido', prioridade: 'normal', prazo: '' }
  assert.equal(validarExtra(d), '')
  assert.ok(validarExtra({ ...d, clientId: '' }))
  assert.ok(validarExtra({ ...d, titulo: '  ' }))
  assert.ok(validarExtra({ ...d, prazo: '2026-02-30' }))
  assert.equal(validarExtra({ ...d, prazo: '2026-11-25' }), '')
})
