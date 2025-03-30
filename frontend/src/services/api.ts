import axios from 'axios';

/**
 * API 基礎 URL
 */
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * 創建 Axios 實例
 */
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 請求攔截器
 */
api.interceptors.request.use(
  (config) => {
    // 從本地存儲獲取令牌
    const token = localStorage.getItem('token');
    
    // 如果存在令牌，則添加到請求頭
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 響應攔截器
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 處理 401 錯誤
    if (error.response && error.response.status === 401) {
      // 清除令牌
      localStorage.removeItem('token');
      
      // 重定向到登入頁面
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;