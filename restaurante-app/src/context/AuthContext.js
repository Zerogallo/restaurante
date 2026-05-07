import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    const token = await AsyncStorage.getItem('@Restaurante:token');
    const userData = await AsyncStorage.getItem('@Restaurante:user');
    if (token && userData) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  };

  const login = async (email, password, name) => {
    const response = await api.post('/login', { email, password, name });
    const { token, user } = response.data;
    await AsyncStorage.setItem('@Restaurante:token', token);
    await AsyncStorage.setItem('@Restaurante:user', JSON.stringify(user));
    api.defaults.headers.Authorization = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@Restaurante:token');
    await AsyncStorage.removeItem('@Restaurante:user');
    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);