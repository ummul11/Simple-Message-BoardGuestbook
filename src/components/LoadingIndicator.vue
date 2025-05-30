<template>
  <div class="loading-indicator" :class="{ small, inline }">
    <div class="spinner"></div>
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<script>
export default {
  name: 'LoadingIndicator',
  props: {
    message: {
      type: String,
      default: ''
    },
    small: {
      type: Boolean,
      default: false
    },
    inline: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.loading-indicator.inline {
  flex-direction: row;
  gap: 0.5rem;
  padding: 0.5rem;
}

.loading-indicator.small {
  padding: 0.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(85, 70, 255, 0.2);
  border-radius: 50%;
  border-top-color: #5546FF;
  animation: spin 1s ease-in-out infinite;
}

.loading-indicator.small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.message {
  margin-top: 0.8rem;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
}

.loading-indicator.inline .message {
  margin-top: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>