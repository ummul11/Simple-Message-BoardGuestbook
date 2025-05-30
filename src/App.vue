<template>
  <div id="app">
    <header class="app-header">
      <h1>Stacks Guestbook</h1>
      <div class="auth-section">
        <button v-if="!isAuthenticated" @click="connectWallet" class="auth-button">
          Connect Wallet
        </button>
        <div v-else class="user-info">
          <span class="wallet-address">{{ truncatedAddress }}</span>
          <button @click="disconnectWallet" class="disconnect-button">Disconnect</button>
        </div>
      </div>
    </header>
    
    <main>
      <router-view />
    </main>
    
    <footer class="app-footer">
      <p>Built with Vue.js and Stacks Blockchain</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isAuthenticated() {
      return this.$store.state.auth.isAuthenticated;
    },
    userAddress() {
      return this.$store.state.auth.userAddress;
    },
    truncatedAddress() {
      if (!this.userAddress) return '';
      return `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(this.userAddress.length - 4)}`;
    }
  },
  methods: {
    connectWallet() {
      this.$store.dispatch('auth/connectWallet');
    },
    disconnectWallet() {
      this.$store.dispatch('auth/disconnectWallet');
    }
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

.app-header h1 {
  margin: 0;
  font-size: 1.8rem;
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