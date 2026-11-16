<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Field from '@/components/app/Field.vue'
import { supabase } from '@/lib/supabase'

const email = ref(''); const senha = ref(''); const erro = ref(''); const entrando = ref(false)
async function entrar() {
  erro.value = ''; entrando.value = true
  const { error } = await supabase!.auth.signInWithPassword({ email: email.value.trim(), password: senha.value })
  entrando.value = false
  if (error) erro.value = error.message.includes('Invalid') ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar: ' + error.message
}
</script>
<template>
  <div class="grid min-h-dvh place-items-center p-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <div class="mb-2 flex items-center gap-2"><span class="bg-rec size-2.5 rounded-full" /><span class="font-display font-extrabold">Central RBK</span></div>
        <CardTitle class="text-2xl font-extrabold">Entrar</CardTitle>
        <CardDescription>Use o e-mail e a senha cadastrados para a Central.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="entrar">
          <Field label="E-mail" for="lEmail"><Input id="lEmail" v-model="email" type="email" autocomplete="username" required /></Field>
          <Field label="Senha" for="lSenha"><Input id="lSenha" v-model="senha" type="password" autocomplete="current-password" required /></Field>
          <p v-if="erro" class="bg-danger-soft text-destructive rounded-md px-3 py-2 text-sm" role="alert">{{ erro }}</p>
          <Button type="submit" size="lg" :disabled="entrando">{{ entrando ? 'Entrando…' : 'Entrar' }}</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
