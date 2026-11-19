import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizarBriefing, textoBriefing, coresBriefing, CAMPOS_BRIEFING } from '../src/lib/briefing.ts'
test('cadastros antigos começam vazios e formulários não compartilham dados', () => {
  const a = normalizarBriefing({ sobre: ' Cliente A ', cores: '#ABC' })
  const b = normalizarBriefing()
  assert.equal(a.sobre, 'Cliente A')
  assert.equal(b.sobre, '')
  assert.equal(Object.keys(b).length, CAMPOS_BRIEFING.length)
  a.sobre = 'Alterado'
  assert.equal(b.sobre, '')
})
test('cópia inclui orientações preenchidas e não inclui campos vazios', () => {
  const texto = textoBriefing('Cliente A', { tomVoz: 'Acolhedor', restricoes: 'Evitar promessas', cores: '#123456' })
  assert.ok(texto.includes('Cliente A'))
  assert.ok(texto.includes('Evitar promessas'))
  assert.ok(texto.includes('Acolhedor'))
  assert.ok(!texto.includes('Produtos e serviços:'))
})
test('prévia de cores aceita somente códigos hexadecimais completos', () => {
  assert.deepEqual(coresBriefing('Principal #123456; secundária #abc; repetir #abc; inválida #12345; #ZZZZZZ'), ['#123456', '#abc'])
})
