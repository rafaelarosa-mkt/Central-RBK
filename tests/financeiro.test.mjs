import { test } from 'node:test'
import assert from 'node:assert/strict'
import { valoresPagamento, pagStatus } from '../src/lib/domain.ts'

const cliente = { id: 'cliente', nome: 'Teste', valor: 1000, valorPermuta: 400, diaPgto: 5 }
test('separa dinheiro e permuta e mantém compatibilidade com cadastros antigos', () => {
  assert.deepEqual(valoresPagamento(cliente), { dinheiro: 1000, permuta: 400 })
  assert.deepEqual(valoresPagamento({ id: 'antigo', nome: 'Antigo', valor: 800 }), { dinheiro: 800, permuta: 0 })
})
test('dispensa apenas o mês escolhido, preservando os valores para reativar', () => {
  const pagamento = { clientId: cliente.id, mes: '2025-11', pago: false, valor: 900, valorPermuta: 200, naoCobrar: true }
  const pags = { ['cliente_2025-11']: pagamento }
  assert.equal(pagStatus(cliente, '2025-11', pags), 'dispensado')
  assert.deepEqual(valoresPagamento(cliente, pagamento), { dinheiro: 0, permuta: 0 })
  assert.equal(pagStatus(cliente, '2025-10', pags), 'atrasado')
  assert.deepEqual(valoresPagamento(cliente, { ...pagamento, naoCobrar: false }), { dinheiro: 900, permuta: 200 })
  assert.equal(pagamento.valor, 900)
  assert.equal(cliente.valor, 1000)
})
test('permuta integral não é tratada como dinheiro atrasado', () => {
  const pags = { ['cliente_2025-11']: { clientId: cliente.id, mes: '2025-11', pago: false, valor: 0, valorPermuta: 1400 } }
  assert.equal(pagStatus(cliente, '2025-11', pags), 'permuta')
  assert.deepEqual(valoresPagamento(cliente, pags['cliente_2025-11']), { dinheiro: 0, permuta: 1400 })
})
test('pagamento misto considera somente a parcela em dinheiro', () => {
  const p = { clientId: cliente.id, mes: '2025-11', pago: true, valor: 600, valorPermuta: 800 }
  assert.equal(pagStatus(cliente, p.mes, { ['cliente_2025-11']: p }), 'pago')
  assert.deepEqual(valoresPagamento(cliente, p), { dinheiro: 600, permuta: 800 })
  assert.deepEqual(valoresPagamento(cliente, { ...p, valorPermuta: 0 }), { dinheiro: 600, permuta: 0 })
})
