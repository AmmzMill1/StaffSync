import axios from 'axios';

const api = axios.create({
  baseURL: 'https://staffsync-api-bsr3.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staffsync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or invalid token sends the person back to the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('staffsync_token');
      window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) => err.response?.data?.message || 'Could not reach the server. Check that the API is running.';
export default api;
