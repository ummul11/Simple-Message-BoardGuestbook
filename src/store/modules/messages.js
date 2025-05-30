import { 
  getMessages, 
  postMessage, 
  likeMessage, 
  hasUserLikedMessage 
} from '@/utils/stacks';
import { getTransactionStatus } from '@/services/api';

const state = {
  messages: [],
  loading: false,
  error: null,
  userLikes: {}, // Track which messages the user has liked
  pendingTransactions: [] // Track pending transactions
};

const getters = {
  allMessages: state => state.messages,
  isLoading: state => state.loading,
  error: state => state.error,
  hasUserLiked: state => messageId => state.userLikes[messageId] || false,
  pendingTransactions: state => state.pendingTransactions
};

const actions = {
  async fetchMessages({ commit, rootGetters, dispatch }) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const messages = await getMessages();
      commit('setMessages', messages);
      
      // Check which messages the user has liked if authenticated
      const userAddress = rootGetters['auth/userAddress'];
      if (userAddress) {
        for (const message of messages) {
          const hasLiked = await hasUserLikedMessage(userAddress, message.id);
          if (hasLiked) {
            commit('setUserLiked', { messageId: message.id, liked: true });
          }
        }
      }
      
      // Check status of pending transactions
      dispatch('checkPendingTransactions');
    } catch (error) {
      console.error('Error fetching messages:', error);
      commit('setError', 'Failed to load messages. Please try again.');
    } finally {
      commit('setLoading', false);
    }
  },
  
  async checkPendingTransactions({ state, commit }) {
    if (state.pendingTransactions.length === 0) return;
    
    for (const tx of state.pendingTransactions) {
      try {
        const status = await getTransactionStatus(tx.id);
        
        // If transaction is confirmed, remove it from pending
        if (status.tx_status === 'success') {
          commit('removePendingTransaction', tx.id);
        } 
        // If transaction failed, remove it and show error
        else if (status.tx_status === 'abort_by_response' || status.tx_status === 'abort_by_post_condition') {
          commit('removePendingTransaction', tx.id);
          commit('setError', `Transaction failed: ${status.tx_status}`);
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
        // Don't remove from pending if we couldn't check the status
      }
    }
  },
  
  async createMessage({ commit, dispatch }, content) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const response = await postMessage(content);
      
      // Add transaction to pending list
      commit('addPendingTransaction', {
        id: response.txid,
        type: 'post',
        content,
        timestamp: Date.now()
      });
      
      // Refresh messages after a delay to allow transaction to be processed
      setTimeout(() => {
        dispatch('fetchMessages');
      }, 5000);
      
      return response;
    } catch (error) {
      console.error('Error creating message:', error);
      commit('setError', 'Failed to post message. Please try again.');
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },
  
  async likeMessageAction({ commit, dispatch, rootGetters }, messageId) {
    commit('setLoading', true);
    commit('setError', null);
    
    try {
      const response = await likeMessage(messageId);
      
      // Optimistically update the UI
      const message = state.messages.find(m => m.id === messageId);
      if (message) {
        commit('updateMessageLikes', { 
          messageId, 
          likes: message.likes + 1 
        });
        commit('setUserLiked', { messageId, liked: true });
      }
      
      // Add transaction to pending list
      commit('addPendingTransaction', {
        id: response.txid,
        type: 'like',
        messageId,
        timestamp: Date.now()
      });
      
      // Refresh messages after a delay to ensure transaction is processed
      setTimeout(() => {
        dispatch('fetchMessages');
      }, 5000);
      
      return response;
    } catch (error) {
      console.error('Error liking message:', error);
      commit('setError', 'Failed to like message. Please try again.');
      throw error;
    } finally {
      commit('setLoading', false);
    }
  }
};

const mutations = {
  setMessages(state, messages) {
    state.messages = messages;
  },
  setLoading(state, status) {
    state.loading = status;
  },
  setError(state, error) {
    state.error = error;
  },
  addMessage(state, message) {
    state.messages.unshift(message);
  },
  updateMessageLikes(state, { messageId, likes }) {
    const message = state.messages.find(m => m.id === messageId);
    if (message) {
      message.likes = likes;
    }
  },
  setUserLiked(state, { messageId, liked }) {
    state.userLikes = { ...state.userLikes, [messageId]: liked };
  },
  addPendingTransaction(state, transaction) {
    state.pendingTransactions.push(transaction);
  },
  removePendingTransaction(state, transactionId) {
    state.pendingTransactions = state.pendingTransactions.filter(
      tx => tx.id !== transactionId
    );
  },
  clearPendingTransactions(state) {
    state.pendingTransactions = [];
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};