import { ref } from 'vue'
import { brl as formatarMoeda } from './domain.ts'
export const valoresVisiveis = ref(false)
export const ocultarValores = () => { valoresVisiveis.value = false }
export const brl = (valor: unknown) => valoresVisiveis.value ? formatarMoeda(valor) : '****'
