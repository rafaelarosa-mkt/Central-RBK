import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'painel', component: () => import('./views/PainelView.vue'), meta: { titulo: 'Painel' } },
    { path: '/producao', name: 'producao', component: () => import('./views/ProducaoView.vue'), meta: { titulo: 'Produção' } },
    { path: '/agenda', name: 'agenda', component: () => import('./views/AgendaView.vue'), meta: { titulo: 'Agenda' } },
    { path: '/financeiro', name: 'financeiro', component: () => import('./views/FinanceiroView.vue'), meta: { titulo: 'Financeiro' } },
    { path: '/clientes', name: 'clientes', component: () => import('./views/ClientesView.vue'), meta: { titulo: 'Clientes' } },
    { path: '/:p(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
