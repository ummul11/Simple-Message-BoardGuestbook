<template>
  <div class="notification-manager">
    <Notification
      v-for="notification in notifications"
      :key="notification.id"
      :type="notification.type"
      :message="notification.message"
      :duration="notification.duration"
      @close="removeNotification(notification.id)"
    />
  </div>
</template>

<script>
import Notification from './Notification.vue';

export default {
  name: 'NotificationManager',
  components: {
    Notification
  },
  data() {
    return {
      notifications: [],
      nextId: 1
    };
  },
  methods: {
    addNotification({ type = 'info', message, duration = 5000 }) {
      const id = this.nextId++;
      this.notifications.push({
        id,
        type,
        message,
        duration
      });
      
      return id;
    },
    
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    }
  }
};
</script>

<style scoped>
.notification-manager {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>