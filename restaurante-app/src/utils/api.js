import axios from 'axios';

// Substitua pelo IP do seu backend (no emulador use 10.0.2.2 para Android)
const API_URL = 'http://192.168.1.70:3000/api';

const api = axios.create({ baseURL: API_URL });

export default api;