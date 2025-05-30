import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { APP_CONFIG } from './config';

// Import global styles
import './assets/styles/global.css';

// Create Vue app
const app = createApp(App);

// Add global error handling
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err);
  console.error('Info:', info);
  
  // You could also send errors to a monitoring service here
  
  // Dispatch to store for UI notification if needed
  if (store) {
    store.dispatch('showGlobalError', {
      error: err,
      info: info
    });
  }
};

// Add global properties
app.config.globalProperties.$appConfig = APP_CONFIG;

// Use plugins
app.use(router);
app.use(store);

// Mount the app
app.mount('#app');