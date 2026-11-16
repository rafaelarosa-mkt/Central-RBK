import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { iniciarAuth } from './lib/store'
import './index.css'

iniciarAuth()
createApp(App).use(router).mount('#app')

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
