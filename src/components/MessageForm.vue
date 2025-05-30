<template>
  <div class="message-form">
    <form @submit.prevent="submitMessage">
      <div class="form-group">
        <label for="message">Your Message:</label>
        <textarea 
          id="message" 
          v-model="message" 
          placeholder="Write your message here..." 
          :maxlength="maxLength"
          required
        ></textarea>
        <div class="character-count">
          {{ message.length }} / {{ maxLength }}
        </div>
      </div>
      <div class="form-actions">
        <button 
          type="submit" 
          class="submit-button" 
          :disabled="isSubmitting || !message.trim()"
        >
          {{ isSubmitting ? 'Posting...' : 'Post Message' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'MessageForm',
  data() {
    return {
      message: '',
      isSubmitting: false,
      maxLength: 280 // Twitter-like character limit
    };
  },
  methods: {
    async submitMessage() {
      if (!this.message.trim()) return;
      
      this.isSubmitting = true;
      
      try {
        // This is a placeholder for the actual contract interaction
        // Will be implemented in Part 2
        console.log('Submitting message:', this.message);
        
        // Simulate a delay for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add a mock message to the store
        const mockMessage = {
          id: Date.now(),
          author: this.$store.getters['auth/userAddress'],
          content: this.message,
          timestamp: Date.now(),
          likes: 0
        };
        
        this.$store.commit('messages/addMessage', mockMessage);
        
        // Clear the form
        this.message = '';
        this.$emit('message-posted');
      } catch (error) {
        console.error('Error posting message:', error);
        alert('Failed to post message. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.message-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
  position: relative;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
  border-color: #5546FF;
  box-shadow: 0 0 0 2px rgba(85, 70, 255, 0.1);
}

.character-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  font-size: 0.8rem;
  color: #777;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  background-color: #5546FF;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover:not(:disabled) {
  background-color: #4035cc;
}

.submit-button:disabled {
  background-color: #b4b4b4;
  cursor: not-allowed;
}
</style>