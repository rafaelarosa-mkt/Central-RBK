import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizarBriefingDia, validarBriefingDia } from '../src/lib/briefing-dia.ts'
import { validarExtra } from '../src/lib/extras.ts'
test('briefing antigo começa vazio e edição não modifica o registro antes de salvar', () => {
  const original = { objetivo: 'Evento', data: '2026-11-20' }
  const form = normalizarBriefingDia(original)
  form.objetivo = 'Mudou'
  assert.equal(original.objetivo, 'Evento')
  assert.equal(normalizarBriefingDia().objetivo, '')
  assert.equal(form.entregas, '')
})
test('cliente avulso exige nome e pode registrar briefing sem contrato', () => {
  const d = { atendimento: 'avulso', clienteAvulso: 'Maria', clientId: '', titulo: 'Cobertura', etapa: 'recebido', prioridade: 'normal', prazo: '', briefingDia: normalizarBriefingDia({ data: '2026-11-20', inicio: '09:00' }) }
  assert.equal(validarExtra(d), '')
  assert.ok(validarExtra({ ...d, clienteAvulso: '  ' }))
  assert.ok(validarExtra({ ...d, briefingDia: { data: '2026-02-30' } }))
  assert.ok(validarBriefingDia({ inicio: '25:90' }))
  assert.equal(validarBriefingDia({ inicio: '23:00', fim: '01:00' }), '')
})
