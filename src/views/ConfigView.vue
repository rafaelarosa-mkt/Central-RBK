<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
</script>
<template>
  <div class="grid min-h-dvh place-items-center p-4">
    <Card class="w-full max-w-lg">
      <CardHeader><CardTitle class="text-xl">Falta conectar o banco de dados</CardTitle></CardHeader>
      <CardContent class="text-sm leading-relaxed">
        Cadastre as variáveis <code class="bg-muted rounded px-1.5">VITE_SUPABASE_URL</code> e
        <code class="bg-muted rounded px-1.5">VITE_SUPABASE_ANON_KEY</code> na Vercel
        (Settings › Environment Variables) e faça um novo deploy. O passo a passo está no LEIA-ME.
      </CardContent>
    </Card>
  </div>
</template>
