import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarDataPagamento } from '../src/lib/data-pagamento.ts'
test('aceita pagamento anterior e hoje, inclusive em outro mês, mas rejeita futuro e data inexistente', () => {
  assert.equal(validarDataPagamento('2026-11-20', '2026-11-24'), true)
  assert.equal(validarDataPagamento('2026-10-31', '2026-11-24'), true)
  assert.equal(validarDataPagamento('2026-11-24', '2026-11-24'), true)
  for (const data of ['', '2026-11-25', '2026-02-30', '24/11/2026']) assert.equal(validarDataPagamento(data, '2026-11-24'), false)
})
