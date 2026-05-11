import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CheckoutScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { cart, getTotal, clearCart, updateQuantity, getItemCount } = useCart();
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens antes de finalizar.');
      return;
    }

    setLoading(true);
    try {
      const payload = { items: cart.map(item => ({ id: item.id, qty: item.quantity })), observations };
      const response = await api.post('/orders', payload);
      
      Alert.alert('Pedido confirmado!', `Total: R$ ${response.data.total.toFixed(2)}`, [
        { text: 'OK', onPress: () => { clearCart(); navigation.navigate('Início'); } }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Não foi possível finalizar');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Carrinho vazio 😢</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Cardápio')}>
          <Text style={styles.buttonText}>Ver Cardápio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧾 Seu pedido</Text>
      <Text style={styles.subtitle}>{getItemCount()} item(ns)</Text>
      
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.quantityControl}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyButton}>
                <Text style={styles.qtyText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyButton}>
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtotal}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        )}
      />
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>R$ {getTotal().toFixed(2)}</Text>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Observações (ex: sem cebola)"
        value={observations}
        onChangeText={setObservations}
        multiline
      />
      
      <TouchableOpacity style={styles.confirmButton} onPress={confirmOrder} disabled={loading}>
        <Text style={styles.confirmText}>{loading ? 'Enviando...' : 'Confirmar Pedido'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#888', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  cartItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  itemDetails: { flex: 2 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemPrice: { color: '#666' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 18, fontWeight: 'bold' },
  qtyValue: { fontSize: 16, minWidth: 24, textAlign: 'center' },
  subtotal: { flex: 1, textAlign: 'right', fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 12, borderTopWidth: 2, borderColor: '#e67e22' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#e67e22' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginVertical: 16, fontSize: 16, minHeight: 60 },
  confirmButton: { backgroundColor: '#e67e22', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8, marginBottom: 30 },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  button: { backgroundColor: '#e67e22', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});