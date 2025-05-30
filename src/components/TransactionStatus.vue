<template>
  <div class="transaction-status">
    <h3>Pending Transactions</h3>
    <div v-if="pendingTransactions.length === 0" class="no-transactions">
      <p>No pending transactions</p>
    </div>
    <div v-else class="transaction-list">
      <div 
        v-for="tx in pendingTransactions" 
        :key="tx.id" 
        class="transaction-item"
      >
        <div class="transaction-icon">
          <span v-if="tx.type === 'post'">📝</span>
          <span v-else-if="tx.type === 'like'">❤️</span>
          <span v-else>🔄</span>
        </div>
        <div class="transaction-details">
          <div class="transaction-type">
            {{ getTransactionTypeLabel(tx) }}
          </div>
          <div class="transaction-time">
            {{ formatDate(tx.timestamp) }}
          </div>
        </div>
        <div class="transaction-id">
          <a 
            :href="getExplorerUrl(tx.id)" 
            target="_blank" 
            rel="noopener noreferrer"
            class="explorer-link"
          >
            View in Explorer
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatDate } from '@/utils/date';
import { NETWORK } from '@/utils/stacks';

export default {
  name: 'TransactionStatus',
  computed: {
    ...mapGetters({
      pendingTransactions: 'messages/pendingTransactions'
    })
  },
  methods: {
    formatDate(timestamp) {
      return formatDate(timestamp);
    },
    
    getTransactionTypeLabel(tx) {
      switch (tx.type) {
        case 'post':
          return 'Posting message';
        case 'like':
          return 'Liking message';
        default:
          return 'Transaction';
      }
    },
    
    getExplorerUrl(txId) {
      // Use the appropriate explorer URL based on the network
      const baseUrl = NETWORK.isMainnet() 
        ? 'https://explorer.stacks.co/txid/' 
        : 'https://explorer.stacks.co/sandbox/txid/';
      
      return `${baseUrl}${txId}`;
    }
  }
};
</script>

<style scoped>
.transaction-status {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-top: 2rem;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.2rem;
}

.no-transactions {
  text-align: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 6px;
  color: #666;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  background-color: #f9f9f9;
  border-radius: 6px;
  gap: 1rem;
}

.transaction-icon {
  font-size: 1.2rem;
}

.transaction-details {
  flex: 1;
}

.transaction-type {
  font-weight: 500;
  color: #333;
}

.transaction-time {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.2rem;
}

.explorer-link {
  color: #5546FF;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid #5546FF;
  border-radius: 4px;
  transition: all 0.2s;
}

.explorer-link:hover {
  background-color: #5546FF;
  color: white;
}
</style>