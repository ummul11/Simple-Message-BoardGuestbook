<template>
  <div class="home">
    <section class="message-form-section">
      <h2>Leave a Message</h2>
      <MessageForm v-if="isAuthenticated" />
      <div v-else class="auth-required">
        <p>Please connect your wallet to leave a message</p>
        <button @click="connectWallet" class="connect-button">Connect Wallet</button>
      </div>
    </section>

    <section class="messages-section">
      <h2>Messages</h2>
      <div v-if="loading" class="loading">
        <p>Loading messages...</p>
      </div>
      <div v-else-if="error" class="error">
        <p>Error loading messages: {{ error }}</p>
        <button @click="fetchMessages" class="retry-button">Retry</button>
      </div>
      <div v-else>
        <MessageList :messages="messages" />
      </div>
    </section>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import MessageForm from '@/components/MessageForm.vue';
import MessageList from '@/components/MessageList.vue';

export default {
  name: 'Home',
  components: {
    MessageForm,
    MessageList
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      messages: 'messages/allMessages',
      loading: 'messages/isLoading',
      error: 'messages/error'
    })
  },
  methods: {
    ...mapActions({
      fetchMessages: 'messages/fetchMessages',
      connectWallet: 'auth/connectWallet'
    })
  },
  mounted() {
    this.fetchMessages();
  }
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

h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
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