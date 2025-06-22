<template>
  <div id="app">
    <header class="app-header">
      <div class="header-left">
        <h1>Stacks Guestbook</h1>
        <nav class="main-nav">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/about" class="nav-link">About</router-link>
        </nav>
      </div>
      <div class="auth-section">
        <div v-if="authLoading" class="loading-indicator">
          <span class="loading-spinner"></span>
        </div>
        <button v-else-if="!isAuthenticated" @click="connectWallet" class="auth-button">
          Connect Wallet
        </button>
        <div v-else class="user-info">
          <span class="wallet-address">{{ truncatedAddress }}</span>
          <button @click="disconnectWallet" class="disconnect-button">Disconnect</button>
        </div>
      </div>
    </header>
    
    <main>
      <router-view @show-notification="showNotification" />
    </main>
    
    <footer class="app-footer">
      <p>Built with Vue.js and Stacks Blockchain</p>
    </footer>
    
    <NotificationManager ref="notificationManager" />
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import NotificationManager from './components/NotificationManager.vue';

export default {
  name: 'App',
  components: {
    NotificationManager
  },
  computed: {
    ...mapState({
      authLoading: state => state.auth.loading
    }),
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      userAddress: 'auth/userAddress'
    }),
    truncatedAddress() {
      if (!this.userAddress) return '';
      return `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(this.userAddress.length - 4)}`;
    }
  },
  methods: {
    ...mapActions({
      connectWallet: 'auth/connectWallet',
      disconnectWallet: 'auth/disconnectWallet',
      checkAuth: 'auth/checkAuth'
    }),
    showNotification(notification) {
      this.$refs.notificationManager.addNotification(notification);
    }
  },
  created() {
    // Check if user is already authenticated
    this.checkAuth();
  }
};
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: #333;
}

.app-header {
  background-color: #5546FF;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.app-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.main-nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover, .router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-section {
  display: flex;
  align-items: center;
}

.auth-button {
  background-color: white;
  color: #5546FF;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.auth-button:hover {
  background-color: #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wallet-address {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-family: monospace;
}

.disconnect-button {
  background-color: transparent;
  color: white;
  border: 1px solid white;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.disconnect-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.app-footer {
  background-color: #f0f0f0;
  padding: 1rem;
  text-align: center;
  color: #666;
}
</style>