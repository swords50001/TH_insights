import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080"
});

api.interceptors.request.use(config => {
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Add cache busting headers
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);
