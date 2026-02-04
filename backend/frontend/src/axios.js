import axios from 'axios'
import store from './store'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 500){
      localStorage.removeItem('userInfo');
      store.dispatch({ type: 'USER_LOGOUT' });
      window.location.href = '/#/login';  // or use navigate() if you have react-router set up
    }
    return Promise.reject(error);
  }
);

export default axios;  // we re-export axios with the interceptor attached