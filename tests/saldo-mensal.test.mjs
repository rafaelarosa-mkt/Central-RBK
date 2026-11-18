import { test } from 'node:test'
import assert from 'node:assert/strict'
import { saldoMensal } from '../src/lib/domain.ts'
const cliente = { id: 'a', nome: 'Cliente', valor: 1000, valorPermuta: 500 }
const conta = { id: 'd', tipoRegistro: 'conta_pagar', descricao: 'Despesa', fornecedor: '', categoria: '', observacoes: '', valor: 400, vencimento: '2026-11-10', pago: false, pagoEm: '' }
test('prevê sobra e separa valores pendentes sem incluir permuta', () => {
  const s = saldoMensal([cliente], {}, [conta], '2026-11')
  assert.equal(s.entradas, 1000); assert.equal(s.despesas, 400)
  assert.equal(s.sobra, 600); assert.equal(s.falta, 0)
  assert.equal(s.aReceber, 1000); assert.equal(s.aPagar, 400)
})
test('pagamento e recebimento não alteram a previsão total nem duplicam valores', () => {
  const p = { ['a_2026-11']: { clientId: 'a', mes: '2026-11', valor: 1000, pago: true } }
  const s = saldoMensal([cliente], p, [{ ...conta, pago: true }], '2026-11')
  assert.equal(s.saldo, 600); assert.equal(s.recebido, 1000); assert.equal(s.pago, 400)
  assert.equal(s.aReceber, 0); assert.equal(s.aPagar, 0)
})
test('usa valor específico do mês e prevê falta', () => {
  const s = saldoMensal([cliente], { ['a_2026-11']: { clientId: 'a', mes: '2026-11', valor: 200, pago: false } }, [conta], '2026-11')
  assert.equal(s.saldo, -200); assert.equal(s.sobra, 0); assert.equal(s.falta, 200)
})
test('exclui dispensas, clientes inativos, despesas excluídas e outros meses', () => {
  const s = saldoMensal([cliente, { ...cliente, id: 'b', ativo: false }], { ['a_2026-11']: { clientId: 'a', mes: '2026-11', pago: false, naoCobrar: true } }, [{ ...conta, excluida: true }, { ...conta, id: 'dez', vencimento: '2026-12-10' }], '2026-11')
  assert.equal(s.entradas, 0); assert.equal(s.despesas, 0); assert.equal(s.saldo, 0)
})
test('calcula centavos sem resíduos e aceita mês sem lançamentos', () => {
  assert.equal(saldoMensal([{ ...cliente, valor: 0.3 }], {}, [{ ...conta, valor: 0.1 }, { ...conta, id: 'e', valor: 0.2 }], '2026-11').saldo, 0)
  assert.equal(saldoMensal([], {}, [], '2026-11').saldo, 0)
})
