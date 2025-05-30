<template>
  <div class="message-item" :class="{ 'own-message': isOwnMessage }">
    <div class="message-header">
      <div class="author">
        <BlockchainAddress :address="message.author" />
        <span v-if="isOwnMessage" class="own-message-badge">You</span>
      </div>
      <div class="timestamp">{{ formattedDate }}</div>
    </div>
    <div class="message-content">
      {{ message.content }}
    </div>
    <div class="message-actions">
      <button 
        @click="likeMessage" 
        class="like-button"
        :class="{ 'liked': hasLiked }"
        :disabled="!isAuthenticated || isProcessing || hasLiked || isOwnMessage"
        :title="getLikeButtonTitle"
      >
        <span class="like-icon">❤</span>
        <span class="like-count">{{ message.likes }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import { formatDate } from '@/utils/date';
import BlockchainAddress from './BlockchainAddress.vue';

export default {
  name: 'MessageItem',
  components: {
    BlockchainAddress
  },
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      userAddress: 'auth/userAddress',
      hasUserLiked: 'messages/hasUserLiked'
    }),
    ...mapState({
      isProcessing: state => state.messages.loading
    }),
    getLikeButtonTitle() {
      if (!this.isAuthenticated) return 'Connect your wallet to like messages';
      if (this.hasLiked) return 'You already liked this message';
      if (this.isOwnMessage) return 'You cannot like your own messages';
      if (this.isProcessing) return 'Processing...';
      return 'Like this message';
    },
    formattedDate() {
      // Use our date formatting utility
      return this.formatDate(this.message.timestamp, true); // true indicates it's a block height
    },
    hasLiked() {
      return this.hasUserLiked(this.message.id);
    },
    isOwnMessage() {
      return this.isAuthenticated && this.userAddress === this.message.author;
    }
  },
  methods: {
    formatDate,
    ...mapActions({
      likeMessageAction: 'messages/likeMessageAction'
    }),
    
    async likeMessage() {
      if (!this.isAuthenticated || this.isProcessing || this.hasLiked) return;
      
      try {
        await this.likeMessageAction(this.message.id);
        
        // Show success notification
        this.$emit('show-notification', {
          type: 'success',
          message: 'Your like has been submitted to the blockchain.'
        });
      } catch (error) {
        console.error('Error liking message:', error);
        this.$emit('show-notification', {
          type: 'error',
          message: 'Failed to like message. Please try again.'
        });
      }
    }
  }
};
</script>

<style scoped>
.message-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #5546FF;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.own-message-badge {
  background-color: #5546FF;
  color: white;
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.own-message {
  border-left-color: #5546FF;
  background-color: rgba(85, 70, 255, 0.05);
}

.timestamp {
  color: #777;
}

.message-content {
  margin-bottom: 1rem;
  line-height: 1.5;
  word-break: break-word;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
}

.like-button {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background-color: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
}

.like-button:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.like-button.liked {
  color: #e91e63;
  border-color: #e91e63;
}

.like-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.like-icon {
  font-size: 0.9rem;
}

.like-count {
  font-size: 0.9rem;
  font-weight: 500;
}
</style>