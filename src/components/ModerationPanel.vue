<template>
  <div class="moderation-panel">
    <div class="panel-header">
      <h2>Message Moderation</h2>
      <p class="subtitle">Report inappropriate messages and manage moderation</p>
    </div>

    <!-- Report Form Section -->
    <div class="section">
      <h3>Report a Message</h3>
      <div class="form-group">
        <label for="messageId">Message ID:</label>
        <input 
          id="messageId" 
          v-model.number="reportForm.messageId" 
          type="number" 
          placeholder="Enter message ID"
          min="1"
        />
      </div>
      <div class="form-group">
        <label for="reason">Reason for Report:</label>
        <textarea 
          id="reason" 
          v-model="reportForm.reason" 
          placeholder="Describe why this message should be reviewed..."
          maxlength="280"
          rows="4"
        ></textarea>
        <div class="character-count">
          {{ reportForm.reason.length }} / 280
        </div>
      </div>
      <button 
        @click="submitReport" 
        class="btn btn-primary"
        :disabled="isSubmitting || !reportForm.messageId || !reportForm.reason.trim()"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit Report' }}
      </button>
    </div>

    <!-- Moderator Actions Section -->
    <div v-if="isModerator" class="section moderator-section">
      <h3>Moderator Actions</h3>
      <div class="form-group">
        <label for="reportId">Report ID:</label>
        <input 
          id="reportId" 
          v-model.number="moderationForm.reportId" 
          type="number" 
          placeholder="Enter report ID"
          min="1"
        />
      </div>
      <div class="form-group">
        <label for="action">Action:</label>
        <select v-model="moderationForm.action" id="action">
          <option value="">Select action...</option>
          <option value="warn">Warn User</option>
          <option value="ban">Ban User</option>
          <option value="dismiss">Dismiss Report</option>
        </select>
      </div>
      <button 
        @click="submitModeration" 
        class="btn btn-warning"
        :disabled="isSubmitting || !moderationForm.reportId || !moderationForm.action"
      >
        {{ isSubmitting ? 'Processing...' : 'Apply Action' }}
      </button>
    </div>

    <!-- Recent Reports Section -->
    <div class="section">
      <h3>Recent Reports</h3>
      <div v-if="recentReports.length === 0" class="empty-state">
        <p>No reports yet</p>
      </div>
      <div v-else class="reports-list">
        <div v-for="report in recentReports" :key="report.id" class="report-item">
          <div class="report-header">
            <span class="report-id">Report #{{ report.id }}</span>
            <span :class="['status', report.status]">{{ report.status }}</span>
          </div>
          <div class="report-details">
            <p><strong>Message ID:</strong> {{ report.messageId }}</p>
            <p><strong>Reason:</strong> {{ report.reason }}</p>
            <p><strong>Reporter:</strong> <BlockchainAddress :address="report.reporter" /></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <Notification 
      v-if="notification" 
      :type="notification.type" 
      :message="notification.message"
      @close="notification = null"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import BlockchainAddress from './BlockchainAddress.vue';
import Notification from './Notification.vue';

export default {
  name: 'ModerationPanel',
  components: {
    BlockchainAddress,
    Notification
  },
  data() {
    return {
      reportForm: {
        messageId: null,
        reason: ''
      },
      moderationForm: {
        reportId: null,
        action: ''
      },
      recentReports: [],
      isSubmitting: false,
      isModerator: false,
      notification: null
    };
  },
  computed: {
    ...mapState({
      userAddress: state => state.auth.userAddress,
      isConnected: state => state.auth.isConnected
    })
  },
  mounted() {
    this.checkModeratorStatus();
    this.loadRecentReports();
  },
  methods: {
    async submitReport() {
      if (!this.isConnected) {
        this.showNotification('error', 'Please connect your wallet first');
        return;
      }

      if (!this.reportForm.messageId || !this.reportForm.reason.trim()) {
        this.showNotification('error', 'Please fill in all fields');
        return;
      }

      this.isSubmitting = true;
      try {
        // Call smart contract to submit report
        // This would integrate with the message-moderation contract
        await this.callContract('report-message', [
          this.reportForm.messageId,
          this.reportForm.reason
        ]);

        this.showNotification('success', 'Report submitted successfully');
        this.reportForm = { messageId: null, reason: '' };
        this.loadRecentReports();
      } catch (error) {
        console.error('Error submitting report:', error);
        this.showNotification('error', 'Failed to submit report');
      } finally {
        this.isSubmitting = false;
      }
    },

    async submitModeration() {
      if (!this.isModerator) {
        this.showNotification('error', 'Only moderators can perform this action');
        return;
      }

      this.isSubmitting = true;
      try {
        // Call smart contract to moderate report
        await this.callContract('moderate-report', [
          this.moderationForm.reportId,
          this.moderationForm.action
        ]);

        this.showNotification('success', 'Moderation action applied');
        this.moderationForm = { reportId: null, action: '' };
        this.loadRecentReports();
      } catch (error) {
        console.error('Error applying moderation:', error);
        this.showNotification('error', 'Failed to apply moderation action');
      } finally {
        this.isSubmitting = false;
      }
    },

    async checkModeratorStatus() {
      // Check if current user is a moderator
      // This would call a read-only function from the contract
      try {
        this.isModerator = await this.callReadOnly('is-moderator', [this.userAddress]);
      } catch (error) {
        console.error('Error checking moderator status:', error);
        this.isModerator = false;
      }
    },

    async loadRecentReports() {
      // Load recent reports from contract
      try {
        this.recentReports = await this.callReadOnly('get-recent-reports', []);
      } catch (error) {
        console.error('Error loading reports:', error);
        this.recentReports = [];
      }
    },

    async callContract(functionName, args) {
      // Placeholder for contract interaction
      // Would be implemented with actual Stacks.js integration
      console.log(`Calling ${functionName} with args:`, args);
    },

    async callReadOnly(functionName, args) {
      // Placeholder for read-only contract calls
      console.log(`Calling read-only ${functionName} with args:`, args);
      return null;
    },

    showNotification(type, message) {
      this.notification = { type, message };
      setTimeout(() => {
        this.notification = null;
      }, 5000);
    }
  }
};
</script>

<style scoped>
.moderation-panel {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.panel-header {
  margin-bottom: 2rem;
  border-bottom: 2px solid #5546FF;
  padding-bottom: 1rem;
}

.panel-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #5546FF;
}

.section h3 {
  margin-top: 0;
  color: #333;
}

.moderator-section {
  border-left-color: #ff6b6b;
  background-color: #fff5f5;
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

input, textarea, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus, textarea:focus, select:focus {
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

.btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #5546FF;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #4035cc;
}

.btn-warning {
  background-color: #ff6b6b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: #ff5252;
}

.btn:disabled {
  background-color: #b4b4b4;
  cursor: not-allowed;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-item {
  background-color: white;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.report-id {
  font-weight: 600;
  color: #333;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status.approved {
  background-color: #d4edda;
  color: #155724;
}

.status.rejected {
  background-color: #f8d7da;
  color: #721c24;
}

.report-details p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: #555;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}
</style>

