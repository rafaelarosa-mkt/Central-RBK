import { test } from 'node:test'
import assert from 'node:assert/strict'
import { valoresVisiveis, ocultarValores, brl } from '../src/lib/privacidade.ts'
import { brl as moeda } from '../src/lib/domain.ts'
test('valores começam ocultos, revelam por ação explícita e voltam a ocultar sem alterar os dados', () => {
  assert.equal(valoresVisiveis.value, false)
  assert.equal(brl(1234.56), '****')
  assert.equal(brl(0), '****')
  valoresVisiveis.value = true
  assert.equal(brl(1234.56), moeda(1234.56))
  ocultarValores()
  assert.equal(brl(1234.56), '****')
  assert.notEqual(moeda(1234.56), '****')
})
