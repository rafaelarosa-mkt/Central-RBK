<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Field from './Field.vue'
import { CORES, contrato, fmtBR, type Cliente } from '@/lib/domain'
import { clientes, db } from '@/lib/store'
import { fechar, modal, salvar } from '@/lib/ui'

const aberto = computed(() => modal.atual.tipo === 'cliente')
const atual = computed(() => (modal.atual.tipo === 'cliente' ? modal.atual.cliente : undefined))
const f = reactive({
  nome: '', contato: '', telefone: '', instagram: '', plano: '', videosMes: 0, postsMes: 0, visitasMes: '' as string | number, valor: '' as string | number, valorPermuta: '' as string | number,
  diaPgto: '' as string | number, obsPgto: '', obs: '', cor: CORES[0], ativo: true, inicioContrato: '', mesesContrato: '' as string | number,
})
watch(aberto, a => {
  if (!a) return
  const c = atual.value
  Object.assign(f, {
    nome: c?.nome || '', contato: c?.contato || '', telefone: c?.telefone || '', instagram: c?.instagram || '', plano: c?.plano || '',
    visitasMes: c?.visitasMes ?? '', videosMes: Number(c?.videosMes) || 0, postsMes: Number(c?.postsMes) || 0, valor: c?.valor ?? '', valorPermuta: c?.valorPermuta ?? '', diaPgto: c?.diaPgto ?? '',
    obsPgto: c?.obsPgto || '', obs: c?.obs || '', cor: c?.cor || CORES[clientes.value.length % 8], ativo: c?.ativo !== false,
    inicioContrato: c?.inicioContrato || '', mesesContrato: c?.mesesContrato ?? '',
  })
})
const fim = computed(() => {
  const k = contrato({ inicioContrato: f.inicioContrato, mesesContrato: Number(f.mesesContrato) || null })
  return k ? `Contrato vai de ${fmtBR(k.ini)} até ${fmtBR(k.fim)}.` : 'Preencha início e duração para calcular o término.'
})
async function enviar() {
  if (!f.nome.trim()) return
  if (f.visitasMes !== '' && (!Number.isInteger(Number(f.visitasMes)) || Number(f.visitasMes) < 0)) return
  if (![f.valor, f.valorPermuta].every(v => Number.isFinite(Number(v)) && Number(v) >= 0)) return
  const d = {
    ...f, nome: f.nome.trim(), visitasMes: f.visitasMes === '' ? null : Number(f.visitasMes), videosMes: Number(f.videosMes) || 0, postsMes: Number(f.postsMes) || 0, valor: Number(f.valor) || 0,
    valorPermuta: Number(f.valorPermuta) || 0, diaPgto: Number(f.diaPgto) || null, mesesContrato: Number(f.mesesContrato) || null,
  }
  const c = atual.value
  const ok = await salvar(() => c
    ? db.salvar('clients', c.id, { ...(({ id, ...r }: Cliente) => r)(c), ...d, atualizado: Date.now() })
    : db.criar('clients', { ...d, criado: Date.now() }), 'Cliente salvo')
  if (ok) fechar()
}
</script>

<template>
  <Dialog :open="aberto" @update:open="v => !v && fechar()">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ atual ? 'Editar cliente' : 'Novo cliente' }}</DialogTitle>
        <DialogDescription>Plano, pagamento e contrato do cliente.</DialogDescription>
      </DialogHeader>
      <form class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="enviar">
        <Field label="Nome do cliente" for="cNome" class="sm:col-span-2"><Input id="cNome" v-model="f.nome" required placeholder="Ex.: Requipel" /></Field>
        <Field label="Pessoa de contato" for="cContato"><Input id="cContato" v-model="f.contato" /></Field>
        <Field label="WhatsApp" for="cTel"><Input id="cTel" v-model="f.telefone" inputmode="tel" placeholder="(51) 99999-9999" /></Field>
        <Field label="Instagram" for="cInsta"><Input id="cInsta" v-model="f.instagram" placeholder="@perfil" /></Field>
        <Field label="Plano" for="cPlano"><Input id="cPlano" v-model="f.plano" placeholder="Ex.: Bronze" /></Field>
        <Field label="Vídeos por mês" for="cVid"><Input id="cVid" v-model="f.videosMes" type="number" min="0" /></Field>
        <Field label="Visitas previstas por mês" for="cVisitas" hint="Ex.: 1 ou 2 visitas. Deixe vazio se ainda não foi definido."><Input id="cVisitas" v-model="f.visitasMes" type="number" min="0" step="1" placeholder="Ex.: 2" /></Field>
        <Field label="Posts por mês" for="cPost"><Input id="cPost" v-model="f.postsMes" type="number" min="0" /></Field>
        <Field label="A receber em dinheiro / mês (R$)" for="cVal"><Input id="cVal" v-model="f.valor" type="number" min="0" step="0.01" /></Field>
        <Field label="Permuta / mês (R$)" for="cPermuta"><Input id="cPermuta" v-model="f.valorPermuta" type="number" min="0" step="0.01" /></Field>
        <p class="text-muted-foreground text-xs sm:col-span-2">Informe os valores separadamente. A permuta não entra no valor a receber em dinheiro.</p>
        <Field label="Dia do pagamento" for="cDia"><Input id="cDia" v-model="f.diaPgto" type="number" min="1" max="31" /></Field>
        <Field label="Observação do pagamento" for="cObsP" class="sm:col-span-2"><Input id="cObsP" v-model="f.obsPgto" placeholder="Ex.: permuta em serviços de divulgação" /></Field>
        <Field label="Início do contrato" for="cIni"><Input id="cIni" v-model="f.inicioContrato" type="date" /></Field>
        <Field label="Duração (meses)" for="cMeses"><Input id="cMeses" v-model="f.mesesContrato" type="number" min="1" max="60" placeholder="Ex.: 6" /></Field>
        <p class="text-muted-foreground -mt-1 text-xs sm:col-span-2">{{ fim }}</p>
        <fieldset class="flex flex-col gap-2 sm:col-span-2">
          <legend class="text-muted-foreground mb-2 text-sm font-medium">Cor na agenda e no quadro</legend>
          <div class="flex flex-wrap gap-2">
            <label v-for="(k, i) in CORES" :key="k" class="cursor-pointer rounded-full border-[3px] has-checked:border-foreground has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 border-transparent">
              <input v-model="f.cor" type="radio" name="cCor" :value="k" class="sr-only" :aria-label="`Cor ${i + 1}`">
              <span class="block size-7 rounded-full" :style="{ background: k }" />
            </label>
          </div>
        </fieldset>
        <Field label="Observações" for="cObs" class="sm:col-span-2"><Textarea id="cObs" v-model="f.obs" class="min-h-20" /></Field>
        <label class="flex items-center gap-2 text-sm sm:col-span-2"><input id="cAtivo" v-model="f.ativo" type="checkbox" class="accent-primary size-4"> Cliente ativo (desmarque para arquivar)</label>
        <DialogFooter class="sm:col-span-2">
          <Button type="button" variant="outline" @click="fechar">Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
