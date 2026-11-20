import { test } from 'node:test'
import assert from 'node:assert/strict'
import { remarcarVisita } from '../src/lib/visitas.ts'
import { separarProducao } from '../src/lib/extras.ts'
const base = { id: 'v', tipoRegistro: 'visita', clientId: 'c', mes: '2026-11', data: '2026-11-21', hora: '09:00', status: 'agendada', historico: [] }
test('remarcações acumulam histórico sem duplicar visita ou perder mês original', () => {
  const a = remarcarVisita(base, '2026-11-22', '10:00', 'Cliente indisponível', 'Cliente', '2026-11-20T12:00:00Z')
  const b = remarcarVisita(a, '2026-12-03', '11:00', 'Chuva', 'Cliente', '2026-11-21T12:00:00Z')
  assert.equal(b.id, base.id)
  assert.equal(b.mes, '2026-11')
  assert.equal(b.historico.length, 2)
  assert.equal(b.historico[0].de, base.data)
  assert.equal(b.historico[1].de, a.data)
  assert.equal(base.historico.length, 0)
  assert.equal(a.historico.length, 1)
})
test('recusa remarcação inválida, sem mudança, sem motivo ou de visita encerrada', () => {
  for (const [data, hora, motivo] of [['2026-02-30','09:00','Motivo'], ['2026-11-21','09:00','Motivo'], ['2026-11-22','25:00','Motivo'], ['2026-11-22','09:00',' ']]) assert.throws(() => remarcarVisita(base, data, hora, motivo, 'Cliente'))
  assert.throws(() => remarcarVisita({ ...base, status: 'realizada' }, '2026-11-23', '', 'Teste', 'Cliente'))
})
test('visitas não contam como conteúdo contratado nem demanda extra', () => {
  const { plano, extras } = separarProducao([base, { id: 'i', tipo: 'video' }, { id: 'e', tipoRegistro: 'demanda_extra' }])
  assert.deepEqual(plano.map(i => i.id), ['i'])
  assert.deepEqual(extras.map(i => i.id), ['e'])
})

test('meta mensal conta realizadas e não gera saldo negativo ao superar o previsto', async () => {
  const { progressoVisitas } = await import('../src/lib/visitas.ts')
  assert.equal(progressoVisitas(undefined, 1), null)
  assert.deepEqual(progressoVisitas(2, 1), { previstas: 2, realizadas: 1, faltam: 1, completo: false, percentual: 50 })
  assert.equal(progressoVisitas(2, 2).completo, true)
  assert.equal(progressoVisitas(2, 3).faltam, 0)
  assert.equal(progressoVisitas(2, 3).percentual, 100)
})
