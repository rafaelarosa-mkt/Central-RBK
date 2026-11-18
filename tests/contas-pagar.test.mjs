import { test } from 'node:test'
import assert from 'node:assert/strict'
import { statusConta, validarConta, vencimentosMensais, gerarContasMensais } from '../src/lib/domain.ts'
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
test('recorrência inclui o último mês e conserva o dia original após fevereiro', () => {
  assert.deepEqual(vencimentosMensais('2027-01-31', '2027-03'), ['2027-01-31', '2027-02-28', '2027-03-31'])
  assert.deepEqual(vencimentosMensais('2028-01-31', '2028-03'), ['2028-01-31', '2028-02-29', '2028-03-31'])
  assert.deepEqual(vencimentosMensais('2026-12-10', '2027-01'), ['2026-12-10', '2027-01-10'])
  assert.deepEqual(vencimentosMensais('2026-11-10', '2026-11'), ['2026-11-10'])
})
test('recusa períodos invertidos, datas inválidas e períodos acima de 120 meses', () => {
  for (const [inicio, fim] of [['2026-02-30', '2026-03'], ['2026-11-18', '2026-10'], ['2026-11-18', ''], ['2026-11-18', '2036-11']]) assert.throws(() => vencimentosMensais(inicio, fim))
  assert.equal(vencimentosMensais('2026-11-18', '2036-10').length, 120)
})
test('conversão reaproveita a primeira conta e mantém parcelas futuras em aberto', () => {
  const base = { ...conta, tipoRegistro: 'conta_pagar', fornecedor: '', categoria: '', observacoes: '', pago: true, pagoEm: '2026-11-01' }
  const geradas = gerarContasMensais(base, '2027-01', 'serie-teste', 'conta-existente')
  assert.equal(geradas.length, 3)
  assert.equal(geradas[0].id, 'conta-existente')
  assert.equal(geradas[0].pago, true)
  assert.equal(geradas[1].pago, false)
  assert.equal(geradas[1].pagoEm, '')
  assert.equal(geradas[2].recorrenciaFim, '2027-01')
  assert.equal(geradas[2].parcela, 3)
  assert.equal(geradas[2].totalParcelas, 3)
  assert.deepEqual(geradas.map(c => c.id), gerarContasMensais(base, '2027-01', 'serie-teste', 'conta-existente').map(c => c.id))
  assert.equal(geradas.reduce((n, c) => n + c.valor, 0), 3 * conta.valor)
})
