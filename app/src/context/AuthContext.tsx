// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { User, LoginResponse } from '../types';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, name?: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('@Restaurante:token');
      const userData = await AsyncStorage.getItem('@Restaurante:user');
      
      if (token && userData) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, name?: string): Promise<User> => {
    const response = await api.post<LoginResponse>('/login', { email, password, name });
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