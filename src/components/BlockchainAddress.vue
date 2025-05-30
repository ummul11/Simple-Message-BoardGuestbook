<template>
  <span 
    class="blockchain-address" 
    :class="{ 'is-clickable': clickable }"
    @click="handleClick"
  >
    <slot>{{ displayAddress }}</slot>
  </span>
</template>

<script>
import { getCurrentNetwork } from '@/config';

export default {
  name: 'BlockchainAddress',
  props: {
    address: {
      type: String,
      required: true
    },
    truncate: {
      type: Boolean,
      default: true
    },
    truncateLength: {
      type: Number,
      default: 4
    },
    clickable: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    displayAddress() {
      if (!this.truncate) return this.address;
      
      const start = this.address.substring(0, this.truncateLength + 2); // +2 for "ST" prefix
      const end = this.address.substring(this.address.length - this.truncateLength);
      return `${start}...${end}`;
    },
    explorerUrl() {
      const networkConfig = getCurrentNetwork();
      return `${networkConfig.addressUrl}${this.address}`;
    }
  },
  methods: {
    handleClick() {
      if (!this.clickable) return;
      
      window.open(this.explorerUrl, '_blank', 'noopener,noreferrer');
    }
  }
};
</script>

<style scoped>
.blockchain-address {
  font-family: monospace;
  background-color: rgba(85, 70, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #5546FF;
}

.is-clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.is-clickable:hover {
  background-color: rgba(85, 70, 255, 0.2);
}
</style>