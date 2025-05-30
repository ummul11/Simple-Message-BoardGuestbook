<template>
  <div class="message-list">
    <div v-if="messages.length === 0" class="no-messages">
      <p>No messages yet. Be the first to leave a message!</p>
    </div>
    <div v-else>
      <MessageItem 
        v-for="message in messages" 
        :key="message.id" 
        :message="message" 
      />
    </div>
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