import { test } from 'node:test'
import assert from 'node:assert/strict'
import { financeiroExtras, validarExtra } from '../src/lib/extras.ts'
import { saldoMensal } from '../src/lib/domain.ts'
const base = { id: 'e1', clientId: 'c', titulo: 'Arte extra', etapa: 'recebido', prioridade: 'normal', prazo: '', valorExtra: 200, vencimentoExtra: '2026-11-10' }
test('extras entram uma vez no mês do vencimento, inclusive arquivados e avulsos', () => {
  const dados = [base, { ...base, id: 'e2', valorExtra: 100, pagoExtra: true, arquivada: true, atendimento: 'avulso' }, { ...base, id: 'outro', vencimentoExtra: '2026-12-10' }, { ...base, id: 'gratis', valorExtra: 0 }]
  const r = financeiroExtras(dados, '2026-11', '2026-11-20')
  assert.equal(r.previsto, 300)
  assert.equal(r.recebido, 100)
  assert.equal(r.atrasado, 200)
  assert.equal(r.linhas.length, 2)
  const saldo = saldoMensal([], {}, [{ valor: 250, vencimento: '2026-11-20' }], '2026-11', r)
  assert.equal(saldo.entradas, 300)
  assert.equal(saldo.aReceber, 200)
  assert.equal(saldo.sobra, 50)
  assert.equal(financeiroExtras([{ ...base, pagoExtra: true }], '2026-11', '2026-11-20').atrasado, 0)
})
test('valida valor e datas sem criar cobrança em demandas antigas ou gratuitas', () => {
  assert.equal(validarExtra({ ...base, valorExtra: undefined, vencimentoExtra: undefined }), '')
  assert.ok(validarExtra({ ...base, valorExtra: -1 }))
  assert.ok(validarExtra({ ...base, vencimentoExtra: '' }))
  assert.ok(validarExtra({ ...base, vencimentoExtra: '2026-02-30' }))
  assert.ok(validarExtra({ ...base, pagoExtra: true, pagoEmExtra: '2999-01-01' }))
  assert.equal(validarExtra({ ...base, pagoExtra: true, pagoEmExtra: '2025-01-01' }), '')
})
