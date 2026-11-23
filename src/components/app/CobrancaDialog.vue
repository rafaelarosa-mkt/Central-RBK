<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Copy, MessageCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Field from './Field.vue'
import OlhoValores from './OlhoValores.vue'
import { valoresVisiveis } from '@/lib/privacidade'
import { msgCobranca, pagStatus, valoresPagamento, waNum } from '@/lib/domain'
import { pagamentos } from '@/lib/store'
import { fechar, modal } from '@/lib/ui'

const aberto = computed(() => modal.atual.tipo === 'cobranca')
const ctx = computed(() => (modal.atual.tipo === 'cobranca' ? modal.atual : null))
const texto = ref('')
watch(aberto, a => {
  if (!a || !ctx.value) return
  const { cliente: c, mes } = ctx.value
  const v = valoresPagamento(c, pagamentos.value[`${c.id}_${mes}`]).dinheiro
  texto.value = msgCobranca(c, mes, v, pagStatus(c, mes, pagamentos.value))
})
const wa = computed(() => waNum(ctx.value?.cliente.telefone))
const link = computed(() => `https://wa.me/${wa.value}?text=${encodeURIComponent(texto.value)}`)
async function copiar() {
  try { await navigator.clipboard.writeText(texto.value); toast.success('Mensagem copiada') }
  catch { toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.') }
}
</script>

<template>
  <Dialog :open="aberto" @update:open="v => !v && fechar()">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Mensagem de cobrança</DialogTitle>
        <DialogDescription>{{ ctx?.cliente.nome }}. Você pode editar o texto antes de enviar.</DialogDescription>
      </DialogHeader>
      <Field label="Mensagem" for="mTxt" :hint="ctx?.cliente.telefone ? `WhatsApp: ${ctx.cliente.telefone}` : 'Cadastre o WhatsApp do cliente para abrir a conversa direto.'">
        <div class="flex items-center gap-2"><span class="text-sm">Visualizar mensagem e valor</span><OlhoValores /></div>
        <Textarea v-if="valoresVisiveis" id="mTxt" v-model="texto" class="min-h-48" />
        <p v-else class="rounded-lg border p-4">****</p>
      </Field>
      <DialogFooter>
        <Button variant="outline" :disabled="!valoresVisiveis" @click="copiar"><Copy />Copiar texto</Button>
        <Button v-if="wa && valoresVisiveis" as="a" :href="link" target="_blank" rel="noopener" variant="success"><MessageCircle />Abrir no WhatsApp</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
