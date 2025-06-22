import { 
  userSession, 
  connectWallet, 
  signUserOut, 
  getUserData 
} from '@/utils/stacks';

const state = {
  isAuthenticated: false,
  userAddress: null,
  userData: null,
  loading: false
};

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  userAddress: state => state.userAddress,
  userData: state => state.userData,
  loading: state => state.loading
};

const actions = {
  checkAuth({ commit }) {
    commit('setLoading', true);
    try {
      const userData = getUserData();
      if (userData) {
        commit('setUserData', userData);
        commit('setUserAddress', userData.profile.stxAddress.testnet);
        commit('setIsAuthenticated', true);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    } finally {
      commit('setLoading', false);
    }
  },
  
  connectWallet({ commit }) {
    commit('setLoading', true);
    
    connectWallet(() => {
      try {
        const userData = getUserData();
        if (userData) {
          commit('setUserData', userData);
          commit('setUserAddress', userData.profile.stxAddress.testnet);
          commit('setIsAuthenticated', true);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      } finally {
        commit('setLoading', false);
      }
    });
  },
  
  disconnectWallet({ commit }) {
    commit('setLoading', true);
    try {
      signUserOut();
      commit('setUserData', null);
      commit('setUserAddress', null);
      commit('setIsAuthenticated', false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      commit('setLoading', false);
    }
  }
};

const mutations = {
  setIsAuthenticated(state, value) {
    state.isAuthenticated = value;
  },
  setUserAddress(state, address) {
    state.userAddress = address;
  },
  setUserData(state, data) {
    state.userData = data;
  },
  setLoading(state, status) {
    state.loading = status;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};