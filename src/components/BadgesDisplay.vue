<template>
  <div class="badges-display">
    <div class="panel-header">
      <h2>Achievements & Badges</h2>
      <p class="subtitle">Earn badges by participating in the community</p>
    </div>

    <!-- User Badges Section -->
    <div class="section">
      <h3>Your Badges</h3>
      <div v-if="userBadges.length === 0" class="empty-state">
        <p>No badges earned yet. Start participating to earn achievements!</p>
      </div>
      <div v-else class="badges-grid">
        <div v-for="badge in userBadges" :key="badge.id" class="badge-card">
          <div class="badge-icon">{{ badge.icon }}</div>
          <div class="badge-info">
            <h4>{{ badge.name }}</h4>
            <p class="badge-description">{{ badge.description }}</p>
            <p class="earned-date">Earned: {{ formatDate(badge.earnedAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Badges Section -->
    <div class="section">
      <h3>Available Badges</h3>
      <div class="badges-grid">
        <div 
          v-for="badge in availableBadges" 
          :key="badge.id" 
          class="badge-card"
          :class="{ earned: isBadgeEarned(badge.id) }"
        >
          <div class="badge-icon" :class="{ locked: !isBadgeEarned(badge.id) }">
            {{ badge.icon }}
          </div>
          <div class="badge-info">
            <h4>{{ badge.name }}</h4>
            <p class="badge-description">{{ badge.description }}</p>
            <p class="badge-criteria">
              <strong>Criteria:</strong> {{ badge.criteria }}
            </p>
            <div v-if="!isBadgeEarned(badge.id)" class="badge-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: badge.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ badge.progress }}%</span>
            </div>
            <span v-else class="earned-badge">✓ Earned</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Badge Statistics -->
    <div class="section stats-section">
      <h3>Badge Statistics</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ userBadges.length }}</div>
          <div class="stat-label">Badges Earned</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalBadgesAvailable }}</div>
          <div class="stat-label">Total Available</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ completionPercentage }}%</div>
          <div class="stat-label">Completion</div>
        </div>
      </div>
    </div>

    <!-- Badge Categories -->
    <div class="section">
      <h3>Badge Categories</h3>
      <div class="categories">
        <div 
          v-for="category in badgeCategories" 
          :key="category.name"
          class="category-item"
        >
          <h4>{{ category.name }}</h4>
          <p>{{ category.description }}</p>
          <div class="category-badges">
            <span 
              v-for="badgeId in category.badgeIds" 
              :key="badgeId"
              class="category-badge"
              :class="{ earned: isBadgeEarned(badgeId) }"
            >
              {{ badgeId }}
            </span>
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
import Notification from './Notification.vue';

export default {
  name: 'BadgesDisplay',
  components: {
    Notification
  },
  data() {
    return {
      userBadges: [],
      availableBadges: [],
      totalBadgesAvailable: 0,
      notification: null,
      badgeCategories: [
        {
          name: 'Community Participation',
          description: 'Badges for active participation',
          badgeIds: [1, 2, 3]
        },
        {
          name: 'Engagement',
          description: 'Badges for community engagement',
          badgeIds: [4, 5, 6]
        },
        {
          name: 'Moderation',
          description: 'Badges for moderation activities',
          badgeIds: [7, 8]
        }
      ]
    };
  },
  computed: {
    ...mapState({
      userAddress: state => state.auth.userAddress,
      isConnected: state => state.auth.isConnected
    }),
    completionPercentage() {
      if (this.totalBadgesAvailable === 0) return 0;
      return Math.round((this.userBadges.length / this.totalBadgesAvailable) * 100);
    }
  },
  mounted() {
    this.loadBadges();
  },
  methods: {
    async loadBadges() {
      try {
        // Load user's earned badges
        this.userBadges = await this.callReadOnly('get-user-badges', [this.userAddress]);
        
        // Load all available badges
        this.availableBadges = await this.callReadOnly('get-all-badges', []);
        this.totalBadgesAvailable = this.availableBadges.length;

        // Add progress information to badges
        this.availableBadges = this.availableBadges.map(badge => ({
          ...badge,
          progress: this.calculateBadgeProgress(badge.id)
        }));
      } catch (error) {
        console.error('Error loading badges:', error);
        this.showNotification('error', 'Failed to load badges');
      }
    },

    isBadgeEarned(badgeId) {
      return this.userBadges.some(badge => badge.id === badgeId);
    },

    calculateBadgeProgress(badgeId) {
      // Placeholder for progress calculation logic
      // Would be based on user's activity metrics
      const progressMap = {
        1: 100, // First Message
        2: 75,  // Active Participant
        3: 50,  // Community Helper
        4: 100, // Popular Post
        5: 60,  // Generous Tipper
        6: 40,  // Engagement Master
        7: 100, // Moderator
        8: 30   // Community Guardian
      };
      return progressMap[badgeId] || 0;
    },

    formatDate(timestamp) {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    async callReadOnly(functionName, args) {
      // Placeholder for read-only contract calls
      // Would be implemented with actual Stacks.js integration
      console.log(`Calling read-only ${functionName} with args:`, args);
      
      // Mock data for demonstration
      if (functionName === 'get-user-badges') {
        return [
          {
            id: 1,
            name: 'First Message',
            description: 'Posted your first message',
            icon: '📝',
            earnedAt: Math.floor(Date.now() / 1000) - 86400 * 30
          },
          {
            id: 4,
            name: 'Popular Post',
            description: 'Received 10+ likes on a message',
            icon: '⭐',
            earnedAt: Math.floor(Date.now() / 1000) - 86400 * 15
          }
        ];
      }
      
      if (functionName === 'get-all-badges') {
        return [
          {
            id: 1,
            name: 'First Message',
            description: 'Posted your first message',
            icon: '📝',
            criteria: 'Post one message'
          },
          {
            id: 2,
            name: 'Active Participant',
            description: 'Posted 10 messages',
            icon: '💬',
            criteria: 'Post 10 messages'
          },
          {
            id: 3,
            name: 'Community Helper',
            description: 'Helped moderate the community',
            icon: '🤝',
            criteria: 'Perform 5 moderation actions'
          },
          {
            id: 4,
            name: 'Popular Post',
            description: 'Received 10+ likes on a message',
            icon: '⭐',
            criteria: 'Get 10 likes on one message'
          },
          {
            id: 5,
            name: 'Generous Tipper',
            description: 'Sent 5 tips to other users',
            icon: '💝',
            criteria: 'Send 5 tips'
          },
          {
            id: 6,
            name: 'Engagement Master',
            description: 'Highly engaged community member',
            icon: '🏆',
            criteria: 'Earn 5 different badges'
          },
          {
            id: 7,
            name: 'Moderator',
            description: 'Appointed as a community moderator',
            icon: '👮',
            criteria: 'Be appointed as moderator'
          },
          {
            id: 8,
            name: 'Community Guardian',
            description: 'Reported 10 inappropriate messages',
            icon: '🛡️',
            criteria: 'Report 10 messages'
          }
        ];
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
.badges-display {
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

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.badge-card {
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.badge-card:hover {
  border-color: #5546FF;
  box-shadow: 0 4px 12px rgba(85, 70, 255, 0.15);
}

.badge-card.earned {
  border-color: #5546FF;
  background-color: #f0ebff;
}

.badge-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  transition: transform 0.3s;
}

.badge-icon.locked {
  opacity: 0.5;
  filter: grayscale(100%);
}

.badge-card:hover .badge-icon:not(.locked) {
  transform: scale(1.1);
}

.badge-info h4 {
  margin: 0.5rem 0;
  color: #333;
}

.badge-description {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.badge-criteria {
  margin: 0.5rem 0;
  color: #777;
  font-size: 0.85rem;
}

.badge-progress {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #ddd;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #5546FF;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.8rem;
  color: #777;
}

.earned-badge {
  display: inline-block;
  background-color: #5546FF;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.stats-section {
  border-left-color: #ffc107;
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

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #5546FF;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.category-item {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.category-item h4 {
  margin-top: 0;
  color: #333;
}

.category-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.category-badge {
  background-color: #f0f0f0;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #666;
}

.category-badge.earned {
  background-color: #5546FF;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}
</style>

