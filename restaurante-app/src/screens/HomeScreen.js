import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Olá, {profile?.name}!</Text>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>💰 Total gasto até hoje</Text>
        <Text style={styles.totalValue}>R$ {profile?.total_spent.toFixed(2)}</Text>
      </View>
      <Text style={styles.historyTitle}>📋 Histórico de pedidos</Text>
      {profile?.history?.length === 0 ? (
        <Text style={styles.empty}>Nenhum pedido ainda.</Text>
      ) : (
        <FlatList
          data={profile?.history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderDate}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text>Total: R$ {item.total.toFixed(2)}</Text>
              <Text>Itens: {item.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</Text>
            </View>
          )}
        />
      )}

      {/* Exemplo de localização fixa (pode vir do backend) */}
      <View style={styles.locationCard}>
        <Text style={styles.locationText}>📍 Loja: Rua das Flores, 123 - Centro</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  totalCard: { backgroundColor: '#e67e22', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  totalLabel: { color: '#fff', fontSize: 16 },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  orderCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 1 },
  orderDate: { fontWeight: 'bold', marginBottom: 4 },
  empty: { textAlign: 'center', marginTop: 20, color: '#888' },
  locationCard: { marginTop: 20, padding: 12, backgroundColor: '#e9ecef', borderRadius: 8 },
  locationText: { textAlign: 'center' }
});