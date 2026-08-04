import axios from 'axios';
import toast from 'react-hot-toast';

const LARAVEL_API_URL = import.meta.env.VITE_LARAVEL_API_URL || 'http://localhost:8000/api';
const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3000/api';

function createClient(baseURL) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Something went wrong.';

      if (status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        if (window.location.pathname !== '/login') {
          toast.error('Your session expired. Please log in again.');
          window.location.href = '/login';
        }
      } else {
        toast.error(message);
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const laravel = createClient(LARAVEL_API_URL);
export const node = createClient(NODE_API_URL);
