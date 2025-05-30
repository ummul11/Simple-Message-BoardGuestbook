import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

const state = {
  isAuthenticated: false,
  userAddress: null,
  userData: null
};

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  userAddress: state => state.userAddress,
  userData: state => state.userData
};

const actions = {
  checkAuth({ commit }) {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      commit('setUserData', userData);
      commit('setUserAddress', userData.profile.stxAddress.testnet);
      commit('setIsAuthenticated', true);
    }
  },
  
  connectWallet({ commit }) {
    showConnect({
      appDetails: {
        name: 'Stacks Guestbook',
        icon: window.location.origin + '/favicon.ico',
      },
      redirectTo: '/',
      onFinish: () => {
        const userData = userSession.loadUserData();
        commit('setUserData', userData);
        commit('setUserAddress', userData.profile.stxAddress.testnet);
        commit('setIsAuthenticated', true);
      },
      userSession,
    });
  },
  
  disconnectWallet({ commit }) {
    userSession.signUserOut();
    commit('setUserData', null);
    commit('setUserAddress', null);
    commit('setIsAuthenticated', false);
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
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};