<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import Field from './Field.vue'
import { todayStr } from '@/lib/domain'
import { validarDataPagamento } from '@/lib/data-pagamento'
const props = defineProps<{ titulo: string; rotulo?: string; dataInicial?: string; salvarData: (data: string) => Promise<boolean> }>()
const aberto = ref(false), ocupado = ref(false), data = ref(''), erro = ref(''), tituloAtual = ref('')
let acao: (data: string) => Promise<boolean>
function abrir() { data.value = props.dataInicial || todayStr(); tituloAtual.value = props.titulo; acao = props.salvarData; erro.value = ''; aberto.value = true }
async function enviar() {
  if (ocupado.value) return
  if (!validarDataPagamento(data.value, todayStr())) { erro.value = 'Informe uma data válida, até hoje.'; return }
  ocupado.value = true
  try { if (await acao(data.value)) aberto.value = false }
  finally { ocupado.value = false }
}
</script>
<template>
  <Button type="button" size="sm" :variant="dataInicial ? 'outline' : 'default'" @click="abrir">{{ rotulo || 'Marcar pago' }}</Button>
  <Dialog :open="aberto" @update:open="v => { if (!ocupado) aberto = v }"><DialogContent><DialogHeader><DialogTitle>Data do pagamento</DialogTitle><DialogDescription>{{ tituloAtual }}. Informe o dia em que o valor foi realmente pago.</DialogDescription></DialogHeader><form class="grid gap-4" @submit.prevent="enviar"><Field label="Pago em" for="data-pagamento"><Input id="data-pagamento" v-model="data" type="date" :max="todayStr()" required :disabled="ocupado" /></Field><p v-if="erro" role="alert" class="text-destructive text-sm">{{ erro }}</p><DialogFooter><Button type="button" variant="outline" :disabled="ocupado" @click="aberto = false">Cancelar</Button><Button type="submit" :disabled="ocupado">{{ ocupado ? 'Salvando…' : 'Confirmar data' }}</Button></DialogFooter></form></DialogContent></Dialog>
</template>
