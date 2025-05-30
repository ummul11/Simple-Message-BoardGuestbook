<template>
  <div class="home">
    <section class="message-form-section">
      <h2>Leave a Message</h2>
      <MessageForm 
        v-if="isAuthenticated" 
        @message-posted="onMessagePosted"
        @show-notification="forwardNotification"
      />
      <div v-else class="auth-required">
        <p>Please connect your wallet to leave a message</p>
        <button @click="connectWallet" class="connect-button">Connect Wallet</button>
      </div>
    </section>

    <section class="messages-section">
      <div class="messages-header">
        <h2>Messages</h2>
        <button @click="refreshMessages" class="refresh-button" :disabled="loading">
          <LoadingIndicator v-if="loading" small inline />
          <span v-else>↻ Refresh</span>
        </button>
      </div>
      
      <div v-if="pendingTransactions.length > 0" class="pending-transactions">
        <p>
          <span class="pending-icon">⏳</span>
          You have {{ pendingTransactions.length }} pending transaction{{ pendingTransactions.length > 1 ? 's' : '' }}. 
          Your changes will appear after they are confirmed on the blockchain.
        </p>
      </div>
      
      <LoadingIndicator 
        v-if="loading && !messages.length" 
        message="Loading messages from the blockchain..."
      />
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchMessages" class="retry-button">Retry</button>
      </div>
      <div v-else-if="!messages.length" class="no-messages">
        <p>No messages yet. Be the first to leave a message!</p>
      </div>
      <div v-else>
        <MessageList 
          :messages="messages" 
          @show-notification="forwardNotification"
        />
      </div>
    </section>
    
    <!-- Show transaction status if user is authenticated and has pending transactions -->
    <TransactionStatus v-if="isAuthenticated && pendingTransactions.length > 0" />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import MessageForm from '@/components/MessageForm.vue';
import MessageList from '@/components/MessageList.vue';
import TransactionStatus from '@/components/TransactionStatus.vue';
import LoadingIndicator from '@/components/LoadingIndicator.vue';

export default {
  name: 'Home',
  components: {
    MessageForm,
    MessageList,
    TransactionStatus,
    LoadingIndicator
  },
  computed: {
    ...mapState({
      error: state => state.messages.error,
      loading: state => state.messages.loading
    }),
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      messages: 'messages/allMessages',
      pendingTransactions: 'messages/pendingTransactions'
    })
  },
  methods: {
    ...mapActions({
      fetchMessages: 'messages/fetchMessages',
      connectWallet: 'auth/connectWallet'
    }),
    
    refreshMessages() {
      this.fetchMessages();
      this.forwardNotification({
        type: 'info',
        message: 'Refreshing messages from the blockchain...'
      });
    },
    
    onMessagePosted() {
      this.forwardNotification({
        type: 'success',
        message: 'Your message has been submitted to the blockchain!'
      });
    },
    
    forwardNotification(notification) {
      this.$emit('show-notification', notification);
    }
  },
  data() {
    return {
      refreshInterval: null
    };
  },
  
  mounted() {
    this.fetchMessages();
    
    // Set up auto-refresh
    this.setupAutoRefresh();
  },
  
  beforeUnmount() {
    // Clear the refresh interval when component is destroyed
    this.clearAutoRefresh();
  },
  
  methods: {
    ...mapActions({
      fetchMessages: 'messages/fetchMessages',
      connectWallet: 'auth/connectWallet'
    }),
    
    setupAutoRefresh() {
      // Auto-refresh messages every minute
      this.refreshInterval = setInterval(() => {
        this.fetchMessages();
      }, 60000); // 60 seconds
    },
    
    clearAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },
};
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.message-form-section, .messages-section {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.messages-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

h2 {
  margin: 0;
  color: #333;
}

.refresh-button {
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.refresh-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pending-transactions {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
  padding: 0.8rem 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.pending-icon {
  margin-right: 8px;
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(85, 70, 255, 0.2);
  border-radius: 50%;
  border-top-color: #5546FF;
  animation: spin 1s ease-in-out infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.no-messages {
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 6px;
  color: #666;
}

.auth-required {
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.connect-button {
  background-color: #5546FF;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.connect-button:hover {
  background-color: #4035cc;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #d32f2f;
}

.retry-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.retry-button:hover {
  background-color: #b71c1c;
}
</style>