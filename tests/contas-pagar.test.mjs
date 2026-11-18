import { test } from 'node:test'
import assert from 'node:assert/strict'
import { statusConta, validarConta } from '../src/lib/domain.ts'
const conta = { descricao: 'Assinatura', valor: 99.90, vencimento: '2026-11-18', pago: false, pagoEm: '' }
test('classifica vencimentos e prioriza pagamento registrado', () => {
  assert.equal(statusConta(conta, '2026-11-17'), 'aberto')
  assert.equal(statusConta(conta, '2026-11-18'), 'hoje')
  assert.equal(statusConta(conta, '2026-11-19'), 'atrasado')
  assert.equal(statusConta({ ...conta, pago: true }, '2026-11-19'), 'pago')
})
test('valida valores, datas reais e data de pagamento', () => {
  assert.equal(validarConta(conta), '')
  for (const patch of [{ descricao: ' ' }, { valor: 0 }, { valor: -5 }, { valor: Infinity }, { vencimento: '2026-02-30' }, { pago: true, pagoEm: '' }, { pago: true, pagoEm: '2999-01-01' }]) assert.notEqual(validarConta({ ...conta, ...patch }), '')
  assert.equal(validarConta({ ...conta, pago: true, pagoEm: '2025-01-01' }), '')
})
