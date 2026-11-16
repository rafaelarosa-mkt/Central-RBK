<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { abrir } from '@/lib/ui'
</script>
<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Nenhum cliente cadastrado</CardTitle>
      <CardDescription>Cadastre cada cliente com o plano (vídeos e posts por mês, valor e dia de pagamento). O painel, a produção e o financeiro se montam a partir disso.</CardDescription>
    </CardHeader>
    <CardContent><Button @click="abrir({ tipo: 'cliente' })">Cadastrar primeiro cliente</Button></CardContent>
  </Card>
</template>
