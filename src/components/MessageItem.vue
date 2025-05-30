<template>
  <div class="message-item">
    <div class="message-header">
      <div class="author">{{ truncatedAuthor }}</div>
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
        :disabled="!isAuthenticated || isProcessing"
      >
        <span class="like-icon">❤</span>
        <span class="like-count">{{ message.likes }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'MessageItem',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isProcessing: false,
      hasLiked: false // This will be tracked properly in Part 2
    };
  },
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      userAddress: 'auth/userAddress'
    }),
    truncatedAuthor() {
      const author = this.message.author;
      return `${author.substring(0, 6)}...${author.substring(author.length - 4)}`;
    },
    formattedDate() {
      const date = new Date(this.message.timestamp);
      return date.toLocaleString();
    }
  },
  methods: {
    async likeMessage() {
      if (!this.isAuthenticated || this.isProcessing) return;
      
      this.isProcessing = true;
      
      try {
        // This is a placeholder for the actual contract interaction
        // Will be implemented in Part 2
        console.log('Liking message:', this.message.id);
        
        // Simulate a delay for now
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the like count in the store
        const newLikeCount = this.message.likes + 1;
        this.$store.commit('messages/updateMessageLikes', {
          messageId: this.message.id,
          likes: newLikeCount
        });
        
        this.hasLiked = true;
      } catch (error) {
        console.error('Error liking message:', error);
        alert('Failed to like message. Please try again.');
      } finally {
        this.isProcessing = false;
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
  font-weight: 500;
  color: #5546FF;
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