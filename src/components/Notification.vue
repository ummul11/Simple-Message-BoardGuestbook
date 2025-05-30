<template>
  <transition name="notification">
    <div 
      v-if="show" 
      class="notification" 
      :class="typeClass"
    >
      <div class="notification-content">
        <span class="notification-icon">{{ icon }}</span>
        <span class="notification-message">{{ message }}</span>
      </div>
      <button @click="close" class="notification-close">×</button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Notification',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: value => ['success', 'error', 'info', 'warning'].includes(value)
    },
    message: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 5000 // 5 seconds
    },
    show: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    typeClass() {
      return `notification-${this.type}`;
    },
    icon() {
      const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
        warning: '⚠'
      };
      return icons[this.type] || icons.info;
    }
  },
  mounted() {
    if (this.duration > 0) {
      this.timer = setTimeout(() => {
        this.close();
      }, this.duration);
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  },
  methods: {
    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 450px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-icon {
  font-size: 1.2rem;
}

.notification-message {
  font-size: 0.95rem;
}

.notification-close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.notification-close:hover {
  opacity: 1;
}

.notification-success {
  background-color: #4caf50;
  color: white;
}

.notification-error {
  background-color: #f44336;
  color: white;
}

.notification-info {
  background-color: #2196f3;
  color: white;
}

.notification-warning {
  background-color: #ff9800;
  color: white;
}

/* Transition effects */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>