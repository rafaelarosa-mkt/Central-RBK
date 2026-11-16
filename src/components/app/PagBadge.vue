<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { PLBL, PVAR, type PagStatus } from '@/lib/domain'
defineProps<{ status: PagStatus }>()
</script>
<template><Badge :variant="PVAR[status]" dot>{{ PLBL[status] }}</Badge></template>
