<template>
  <div class="tip-button">
    <button
      @click="showTipModal = true"
      :disabled="!isAuthenticated || isOwnMessage"
      class="tip-btn"
      :class="{ disabled: !isAuthenticated || isOwnMessage }"
    >
      <span class="tip-icon">💰</span>
      Tip
    </button>

    <!-- Tip Modal -->
    <div v-if="showTipModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Send Tip to {{ messageAuthor }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="tip-amount-section">
            <label for="tipAmount">Tip Amount (micro-STX):</label>
            <input
              id="tipAmount"
              v-model.number="tipAmount"
              type="number"
              min="1"
              placeholder="Enter amount"
              class="tip-input"
            />
            <small>1 STX = 1,000,000 micro-STX</small>
          </div>
          
          <div class="tip-preview">
            <p>You will send {{ formatAmount(tipAmount) }} to {{ messageAuthor }}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">Cancel</button>
          <button 
            @click="sendTip" 
            :disabled="!isValidAmount || isSending"
            class="send-tip-btn"
            :class="{ loading: isSending }"
          >
            {{ isSending ? 'Sending...' : 'Send Tip' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { sendTip } from '@/utils/stacks';

export default {
  name: 'TipButton',
  props: {
    messageId: {
      type: Number,
      required: true
    },
    messageAuthor: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showTipModal: false,
      tipAmount: 1000000, // Default 1 STX in micro-STX
      isSending: false
    };
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'userAddress']),
    
    isOwnMessage() {
      return this.userAddress === this.messageAuthor;
    },
    
    isValidAmount() {
      return this.tipAmount > 0 && this.tipAmount <= 1000000000; // Max 1000 STX
    }
  },
  methods: {
    closeModal() {
      this.showTipModal = false;
      this.tipAmount = 1000000;
    },
    
    formatAmount(amount) {
      if (!amount) return '0 STX';
      return `${(amount / 1000000).toFixed(6)} STX`;
    },
    
    async sendTip() {
      if (!this.isValidAmount) return;
      
      this.isSending = true;
      
      try {
        const result = await sendTip(
          this.messageAuthor,
          this.tipAmount,
          this.messageId
        );
        
        this.$emit('tip-sent', {
          messageId: this.messageId,
          amount: this.tipAmount,
          recipient: this.messageAuthor,
          txId: result.txid
        });
        
        this.closeModal();
        this.$store.dispatch('showNotification', {
          type: 'success',
          message: `Tip of ${this.formatAmount(this.tipAmount)} sent successfully!`
        });
      } catch (error) {
        console.error('Error sending tip:', error);
        this.$store.dispatch('showNotification', {
          type: 'error',
          message: 'Failed to send tip. Please try again.'
        });
      } finally {
        this.isSending = false;
      }
    }
  }
};
</script>

<style scoped>
.tip-button {
  display: inline-block;
}

.tip-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tip-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.tip-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ccc;
}

.tip-icon {
  font-size: 16px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f5f5f5;
}

.modal-body {
  padding: 24px;
}

.tip-amount-section {
  margin-bottom: 20px;
}

.tip-amount-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.tip-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.tip-input:focus {
  outline: none;
  border-color: #667eea;
}

.tip-amount-section small {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}

.tip-preview {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.tip-preview p {
  margin: 0;
  color: #333;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #eee;
}

.cancel-btn, .send-tip-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e1e5e9;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.send-tip-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.send-tip-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-tip-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-tip-btn.loading {
  position: relative;
  color: transparent;
}

.send-tip-btn.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}
</style> 