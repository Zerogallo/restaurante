import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TrackOrderScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: any;
};

interface StatusHistory {
  status: string;
  timestamp: string;
  message: string;
}

interface OrderTracking {
  id: string;
  status: string;
  statusHistory: StatusHistory[];
  estimatedTime: string;
  items: any[];
  total: number;
  date: string;
  location: string;
  clientName: string;
}

const statusOrder = ['pending', 'preparing', 'delivering', 'delivered'];

// Ícones CORRETOS para MaterialIcons
const statusIcons: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
  pending: 'schedule',
  preparing: 'restaurant',
  delivering: 'delivery-dining',
  delivered: 'check-circle',
  cancelled: 'cancel'
};

const statusColors = {
  pending: '#f39c12',
  preparing: '#3498db',
  delivering: '#e67e22',
  delivered: '#27ae60',
  cancelled: '#e74c3c'
};

const statusLabels = {
  pending: 'Na fila',
  preparing: 'Preparando',
  delivering: 'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
};

export default function TrackOrderScreen({ navigation, route }: TrackOrderScreenProps) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrderStatus = async () => {
    try {
      const response = await api.get(`/orders/${orderId}/track`);
      setOrder(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
  }, [orderId]);

  // Atualiza automaticamente a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (order?.status !== 'delivered' && order?.status !== 'cancelled') {
        fetchOrderStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderStatus();
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = statusOrder.indexOf(order.status);
    return index === -1 ? 0 : index;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e67e22" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Pedido não encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rastrear Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Pedido # */}
      <View style={styles.orderIdContainer}>
        <Text style={styles.orderIdLabel}>Pedido #{order.id.slice(-8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] || '#888' }]}>
          <MaterialIcons 
            name={statusIcons[order.status] || 'help-outline'} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.statusBadgeText}>{statusLabels[order.status] || order.status}</Text>
        </View>
      </View>

      {/* Nome do cliente */}
      <View style={styles.clientContainer}>
        <MaterialIcons name="person" size={20} color="#888" />
        <Text style={styles.clientName}>{order.clientName}</Text>
      </View>

      {/* Linha do tempo */}
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Status do pedido</Text>
        
        {statusOrder.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = step === order.status;
          
          return (
            <View key={step} style={styles.timelineStep}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && styles.timelineDotCompleted,
                  isCurrent && styles.timelineDotCurrent
                ]}>
                  {isCompleted && index < currentStep && (
                    <MaterialIcons name="check" size={14} color="#fff" />
                  )}
                  {isCurrent && (
                    <MaterialIcons name={statusIcons[step]} size={14} color="#fff" />
                  )}
                </View>
                {index < statusOrder.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    isCompleted && index < currentStep && styles.timelineLineCompleted
                  ]} />
                )}
              </View>
              <View style={styles.timelineRight}>
                <Text style={[
                  styles.timelineTitle,
                  isCompleted && styles.timelineTitleCompleted
                ]}>
                  {statusLabels[step]}
                </Text>
                {isCurrent && (
                  <Text style={styles.timelineMessage}>
                    {order.statusHistory?.find(h => h.status === step)?.message || getStatusMessage(step)}
                  </Text>
                )}
                {order.statusHistory?.find(h => h.status === step) && (
                  <Text style={styles.timelineDate}>
                    {new Date(order.statusHistory.find(h => h.status === step)!.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Tempo estimado */}
      <View style={styles.estimatedContainer}>
        <MaterialIcons name="access-time" size={24} color="#e67e22" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.estimatedLabel}>Tempo estimado</Text>
          <Text style={styles.estimatedValue}>{order.estimatedTime}</Text>
        </View>
      </View>

      {/* Detalhes do pedido */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Detalhes do pedido</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Data</Text>
          <Text style={styles.detailValue}>
            {new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR')}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Local</Text>
          <Text style={styles.detailValue}>{order.location}</Text>
        </View>
        
        <Text style={styles.itemsTitle}>Itens</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.qty}x</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>R$ {(item.price * item.qty).toFixed(2)}</Text>
          </View>
        ))}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Histórico completo */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {order.statusHistory.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <MaterialIcons 
                name={statusIcons[item.status] || 'help-outline'} 
                size={20} 
                color={statusColors[item.status] || '#888'} 
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.historyMessage}>{item.message}</Text>
                <Text style={styles.historyDate}>
                  {new Date(item.timestamp).toLocaleString('pt-BR')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Função auxiliar para mensagem de status
function getStatusMessage(status: string): string {
  const messages: { [key: string]: string } = {
    pending: 'Pedido confirmado e aguardando na fila',
    preparing: 'Pedido sendo preparado pela cozinha',
    delivering: 'Pedido saiu para entrega 🛵',
    delivered: 'Pedido entregue com sucesso! ✅',
    cancelled: 'Pedido cancelado ❌'
  };
  return messages[status] || 'Processando pedido';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  orderIdContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', marginTop: 8 },
  orderIdLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  clientContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', gap: 8 },
  clientName: { fontSize: 14, color: '#666' },
  timelineContainer: { backgroundColor: '#fff', padding: 20, marginTop: 8, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  timelineStep: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { width: 40, alignItems: 'center' },
  timelineDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  timelineDotCompleted: { backgroundColor: '#27ae60' },
  timelineDotCurrent: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e67e22', borderWidth: 3, borderColor: '#ffe0cc' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e0e0e0', marginVertical: 4, minHeight: 30 },
  timelineLineCompleted: { backgroundColor: '#27ae60' },
  timelineRight: { flex: 1, paddingBottom: 24, paddingLeft: 8 },
  timelineTitle: { fontSize: 16, fontWeight: '500', color: '#888' },
  timelineTitleCompleted: { color: '#333', fontWeight: '600' },
  timelineMessage: { fontSize: 12, color: '#666', marginTop: 4 },
  timelineDate: { fontSize: 11, color: '#999', marginTop: 2 },
  estimatedContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, marginTop: 8, borderRadius: 12 },
  estimatedLabel: { fontSize: 12, color: '#888' },
  estimatedValue: { fontSize: 16, fontWeight: 'bold', color: '#e67e22' },
  detailsContainer: { backgroundColor: '#fff', padding: 20, marginTop: 8, borderRadius: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#888' },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemsTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemQty: { fontSize: 14, color: '#888', width: 40 },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemPrice: { fontSize: 14, fontWeight: '500', color: '#333' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#e67e22' },
  historyContainer: { backgroundColor: '#fff', padding: 20, marginTop: 8, marginBottom: 20, borderRadius: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  historyMessage: { fontSize: 14, color: '#333' },
  historyDate: { fontSize: 11, color: '#999', marginTop: 2 },
  errorText: { fontSize: 16, color: '#e74c3c', marginBottom: 20 },
  button: { backgroundColor: '#e67e22', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});