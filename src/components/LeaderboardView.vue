<template>
  <div class="leaderboard-view">
    <div class="panel-header">
      <h2>Community Leaderboard</h2>
      <p class="subtitle">Rankings across multiple dimensions</p>
    </div>

    <!-- Dimension Selector -->
    <div class="dimension-selector">
      <button 
        v-for="dimension in dimensions" 
        :key="dimension.id"
        @click="selectedDimension = dimension.id"
        class="dimension-btn"
        :class="{ active: selectedDimension === dimension.id }"
      >
        <span class="dimension-icon">{{ dimension.icon }}</span>
        <span class="dimension-name">{{ dimension.name }}</span>
      </button>
    </div>

    <!-- Leaderboard Table -->
    <div class="section">
      <div class="leaderboard-header">
        <h3>{{ currentDimensionName }}</h3>
        <div class="header-info">
          <span class="last-updated">Last updated: {{ lastUpdated }}</span>
          <button @click="refreshLeaderboard" class="refresh-btn" :disabled="isLoading">
            {{ isLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>Loading leaderboard...</p>
      </div>

      <div v-else-if="leaderboardEntries.length === 0" class="empty-state">
        <p>No entries yet for this dimension</p>
      </div>

      <div v-else class="leaderboard-table">
        <div class="table-header">
          <div class="rank-col">Rank</div>
          <div class="user-col">User</div>
          <div class="score-col">{{ currentDimensionUnit }}</div>
          <div class="change-col">Change</div>
        </div>

        <div 
          v-for="(entry, index) in leaderboardEntries" 
          :key="entry.user"
          class="table-row"
          :class="{ 'is-current-user': isCurrentUser(entry.user) }"
        >
          <div class="rank-col">
            <span class="rank-badge" :class="getRankClass(index)">
              {{ index + 1 }}
            </span>
          </div>
          <div class="user-col">
            <BlockchainAddress :address="entry.user" />
          </div>
          <div class="score-col">
            <span class="score">{{ entry.score }}</span>
          </div>
          <div class="change-col">
            <span :class="['change', entry.change > 0 ? 'up' : entry.change < 0 ? 'down' : 'neutral']">
              {{ entry.change > 0 ? '↑' : entry.change < 0 ? '↓' : '→' }}
              {{ Math.abs(entry.change) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- User's Position -->
    <div v-if="userPosition" class="section user-position-section">
      <h3>Your Position</h3>
      <div class="position-card">
        <div class="position-stat">
          <div class="stat-label">Current Rank</div>
          <div class="stat-value">{{ userPosition.rank }}</div>
        </div>
        <div class="position-stat">
          <div class="stat-label">Your Score</div>
          <div class="stat-value">{{ userPosition.score }}</div>
        </div>
        <div class="position-stat">
          <div class="stat-label">Points to Next Rank</div>
          <div class="stat-value">{{ userPosition.pointsToNext }}</div>
        </div>
        <div class="position-stat">
          <div class="stat-label">Percentile</div>
          <div class="stat-value">{{ userPosition.percentile }}%</div>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="section stats-section">
      <h3>Leaderboard Statistics</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ totalParticipants }}</div>
          <div class="stat-label">Total Participants</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ topScore }}</div>
          <div class="stat-label">Top Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ averageScore }}</div>
          <div class="stat-label">Average Score</div>
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
  name: 'LeaderboardView',
  components: {
    BlockchainAddress,
    Notification
  },
  data() {
    return {
      selectedDimension: 'messages',
      leaderboardEntries: [],
      userPosition: null,
      isLoading: false,
      notification: null,
      lastUpdated: 'Just now',
      dimensions: [
        { id: 'messages', name: 'Messages Posted', icon: '📝', unit: 'Messages' },
        { id: 'likes', name: 'Likes Received', icon: '❤️', unit: 'Likes' },
        { id: 'tips', name: 'Tips Sent', icon: '💝', unit: 'Tips' },
        { id: 'badges', name: 'Badges Earned', icon: '🏆', unit: 'Badges' }
      ]
    };
  },
  computed: {
    ...mapState({
      userAddress: state => state.auth.userAddress,
      isConnected: state => state.auth.isConnected
    }),
    currentDimensionName() {
      const dimension = this.dimensions.find(d => d.id === this.selectedDimension);
      return dimension ? dimension.name : 'Leaderboard';
    },
    currentDimensionUnit() {
      const dimension = this.dimensions.find(d => d.id === this.selectedDimension);
      return dimension ? dimension.unit : 'Score';
    },
    totalParticipants() {
      return this.leaderboardEntries.length;
    },
    topScore() {
      return this.leaderboardEntries.length > 0 ? this.leaderboardEntries[0].score : 0;
    },
    averageScore() {
      if (this.leaderboardEntries.length === 0) return 0;
      const sum = this.leaderboardEntries.reduce((acc, entry) => acc + entry.score, 0);
      return Math.round(sum / this.leaderboardEntries.length);
    }
  },
  watch: {
    selectedDimension() {
      this.loadLeaderboard();
    }
  },
  mounted() {
    this.loadLeaderboard();
  },
  methods: {
    async loadLeaderboard() {
      this.isLoading = true;
      try {
        // Load leaderboard entries for selected dimension
        this.leaderboardEntries = await this.callReadOnly('get-leaderboard', [
          this.selectedDimension
        ]);

        // Load user's position
        if (this.isConnected) {
          this.userPosition = await this.callReadOnly('get-user-position', [
            this.userAddress,
            this.selectedDimension
          ]);
        }

        this.updateLastUpdated();
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        this.showNotification('error', 'Failed to load leaderboard');
      } finally {
        this.isLoading = false;
      }
    },

    async refreshLeaderboard() {
      await this.loadLeaderboard();
      this.showNotification('success', 'Leaderboard refreshed');
    },

    isCurrentUser(address) {
      return this.isConnected && address === this.userAddress;
    },

    getRankClass(index) {
      if (index === 0) return 'rank-1';
      if (index === 1) return 'rank-2';
      if (index === 2) return 'rank-3';
      return 'rank-other';
    },

    updateLastUpdated() {
      const now = new Date();
      this.lastUpdated = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },

    async callReadOnly(functionName, args) {
      // Placeholder for read-only contract calls
      console.log(`Calling read-only ${functionName} with args:`, args);
      
      // Mock data for demonstration
      if (functionName === 'get-leaderboard') {
        return [
          { user: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5', score: 150, change: 5 },
          { user: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', score: 142, change: -2 },
          { user: 'ST3PF13W0SGXCE70Q2XEMYGVXM9GK87SCTZ519FJC', score: 138, change: 8 },
          { user: 'ST1JXVHKQA0NRJMH3FCRNWQVSNXE3XVKXWJ69GUBN', score: 125, change: 0 },
          { user: 'ST2QXKJUHX5H7PNVQ7X8Y9Z0A1B2C3D4E5F6G7H8I', score: 118, change: 3 }
        ];
      }
      
      if (functionName === 'get-user-position') {
        return {
          rank: 3,
          score: 138,
          pointsToNext: 4,
          percentile: 85
        };
      }
      
      return [];
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
.leaderboard-view {
  max-width: 1000px;
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

.dimension-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.dimension-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid #ddd;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.dimension-btn:hover {
  border-color: #5546FF;
  background-color: #f0ebff;
}

.dimension-btn.active {
  background-color: #5546FF;
  color: white;
  border-color: #5546FF;
}

.dimension-icon {
  font-size: 1.2rem;
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

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.last-updated {
  font-size: 0.9rem;
  color: #666;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background-color: #5546FF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #4035cc;
}

.refresh-btn:disabled {
  background-color: #b4b4b4;
  cursor: not-allowed;
}

.leaderboard-table {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px;
  gap: 1rem;
  padding: 1rem;
  background-color: #f0ebff;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  align-items: center;
  transition: background-color 0.3s;
}

.table-row:hover {
  background-color: #f9f9f9;
}

.table-row.is-current-user {
  background-color: #f0ebff;
  font-weight: 500;
}

.rank-col {
  text-align: center;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-weight: bold;
  color: white;
}

.rank-badge.rank-1 {
  background-color: #ffd700;
  color: #333;
}

.rank-badge.rank-2 {
  background-color: #c0c0c0;
  color: #333;
}

.rank-badge.rank-3 {
  background-color: #cd7f32;
}

.rank-badge.rank-other {
  background-color: #5546FF;
}

.score-col {
  text-align: right;
}

.score {
  font-weight: 600;
  color: #5546FF;
  font-size: 1.1rem;
}

.change-col {
  text-align: right;
}

.change {
  font-weight: 500;
}

.change.up {
  color: #28a745;
}

.change.down {
  color: #dc3545;
}

.change.neutral {
  color: #999;
}

.user-position-section {
  border-left-color: #ffc107;
}

.position-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
}

.position-stat {
  text-align: center;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #5546FF;
}

.stats-section {
  border-left-color: #17a2b8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #ddd;
}

.stat-card .stat-value {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-card .stat-label {
  color: #666;
  font-size: 0.9rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}
</style>

