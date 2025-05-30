import { callReadOnlyFunction, cvToValue, standardPrincipalCV, stringUtf8CV, uintCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const state = {
  messages: [],
  loading: false,
  error: null
};

const getters = {
  allMessages: state => state.messages,
  isLoading: state => state.loading,
  error: state => state.error
};

const actions = {
  // This is a placeholder for the actual contract interaction
  // Will be implemented in Part 2
  async fetchMessages({ commit }) {
    commit('setLoading', true);
    try {
      // Placeholder for contract call
      // Will be replaced with actual contract interaction in Part 2
      const mockMessages = [
        { id: 1, author: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', content: 'Welcome to the Stacks Guestbook!', timestamp: Date.now() - 100000, likes: 5 },
        { id: 2, author: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', content: 'This is a placeholder message.', timestamp: Date.now() - 50000, likes: 2 }
      ];
      
      commit('setMessages', mockMessages);
      commit('setLoading', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      commit('setError', error.toString());
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
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};