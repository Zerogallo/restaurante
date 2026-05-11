import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import api from '../utils/api';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type OrdersScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface Order {
  id: string;
  status: string;
  total: number;
  date: string;
  itemsCount: number;
  location: string;
}

const statusColors: { [key: string]: string } = {
  pending: '#f39c12',
  preparing: '#3498db',
  delivering: '#e67e22',
  delivered: '#27ae60',
  cancelled: '#e74c3c'
};

const statusLabels: { [key: string]: string } = {
  pending: 'Na fila',
  preparing: 'Preparando',
  delivering: 'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

export default function OrdersScreen({ navigation }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const navigateToTrackOrder = (orderId: string) => {
    // ✅ Navega para a tela TrackOrder passando o orderId
    navigation.navigate('TrackOrder', { orderId });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e67e22" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="receipt" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Nenhum pedido ainda</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cardápio')} style={styles.button}>
          <Text style={styles.buttonText}>Fazer primeiro pedido</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigateToTrackOrder(item.id)}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Pedido #{item.id.slice(-8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#888' }]}>
                <Text style={styles.statusText}>{statusLabels[item.status] || item.status}</Text>
              </View>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderDate}>
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </Text>
              <Text style={styles.orderItems}>{item.itemsCount} item(ns)</Text>
              <Text style={styles.orderTotal}>R$ {item.total.toFixed(2)}</Text>
            </View>
            <View style={styles.trackButton}>
              <Text style={styles.trackButtonText}>Rastrear pedido</Text>
              <MaterialIcons name="chevron-right" size={20} color="#e67e22" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  emptyText: { fontSize: 16, color: '#888', marginTop: 16, marginBottom: 24 },
  button: { backgroundColor: '#e67e22', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: '600', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  orderDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderDate: { fontSize: 12, color: '#888' },
  orderItems: { fontSize: 12, color: '#888' },
  orderTotal: { fontSize: 14, fontWeight: 'bold', color: '#e67e22' },
  trackButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 4 },
  trackButtonText: { fontSize: 12, color: '#e67e22', marginRight: 4 },
});