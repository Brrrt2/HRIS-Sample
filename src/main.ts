import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App'
import router from './router'
import './style.css'

createApp(App).use(createPinia()).use(router).mount('#app')
