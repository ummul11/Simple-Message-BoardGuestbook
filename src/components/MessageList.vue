<template>
  <div class="message-list">
    <MessageItem 
      v-for="message in messages" 
      :key="message.id" 
      :message="message"
      @show-notification="forwardNotification"
    />
  </div>
</template>

<script>
import MessageItem from './MessageItem.vue';

export default {
  name: 'MessageList',
  components: {
    MessageItem
  },
  props: {
    messages: {
      type: Array,
      required: true
    }
  },
  methods: {
    forwardNotification(notification) {
      this.$emit('show-notification', notification);
    }
  }
};
</script>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-messages {
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 6px;
  color: #666;
}
</style>