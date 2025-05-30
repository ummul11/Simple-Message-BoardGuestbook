import { createStore } from 'vuex';
import auth from './modules/auth';
import messages from './modules/messages';

export default createStore({
  modules: {
    auth,
    messages
  }
});