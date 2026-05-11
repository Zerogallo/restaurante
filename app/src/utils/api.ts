import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// USE SEU IP LOCAL (o mesmo que já está)
const IP_LOCAL = '192.168.1.70';
const API_URL = `http://${IP_LOCAL}:3000/api`;

console.log(`🌐 Conectando ao backend: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@Restaurante:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout: servidor não respondeu');
    } else if (error.message === 'Network Error') {
      console.error('🌐 ERRO DE REDE:');
      console.error(`   Verifique se o backend está rodando em: ${API_URL}`);
      console.error(`   Teste no navegador do celular: ${API_URL}/health`);
    }
    return Promise.reject(error);
  }
);

export default api;