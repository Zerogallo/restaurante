// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ProfileData } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import logo from '../assets/logo.jpg';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get<ProfileData>('/profile');
      setProfile(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e67e22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.welcome}>Olá, {profile?.name || user?.name}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color="#e67e22" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>💰 Total gasto</Text>
        <Text style={styles.totalValue}>R$ {profile?.total_spent.toFixed(2)}</Text>
      </View>
      
      <Text style={styles.historyTitle}>📋 Histórico de pedidos</Text>
      
      <FlatList
        data={profile?.history || []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.orderDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
            <Text>Total: R$ {item.total.toFixed(2)}</Text>
            <Text>Itens: {item.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcome: { fontSize: 24, fontWeight: 'bold' },
  logoutButton: { padding: 8, backgroundColor: '#fff', borderRadius: 30, elevation: 2 },
  totalCard: { backgroundColor: '#e67e22', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  totalLabel: { color: '#fff', fontSize: 16 },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  orderCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  orderDate: { fontWeight: 'bold', marginBottom: 4 },
  empty: { textAlign: 'center', marginTop: 20, color: '#888' },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 30,
    borderRadius: 60,
  },
});