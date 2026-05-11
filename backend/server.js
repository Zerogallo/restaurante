// screens/CheckoutScreen.tsx
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
  ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

type CheckoutScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { cart, getTotal, clearCart, updateQuantity, getItemCount } = useCart();
  const { user } = useAuth();
  const [observations, setObservations] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [loading, setLoading] = useState(false);

  const deliveryTax = 5.90;
  const subtotal = getTotal();
  const total = deliveryMethod === 'delivery' ? subtotal + deliveryTax : subtotal;

  const confirmOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens antes de finalizar.');
      return;
    }

    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Endereço obrigatório', 'Por favor, informe o endereço de entrega.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: cart.map(item => ({ id: item.id, qty: item.quantity })),
        observations: observations,
        location: deliveryMethod === 'delivery' ? deliveryAddress : 'Retirada no local',
        deliveryMethod: deliveryMethod,
      };

      const response = await api.post('/orders', payload);
      
      Alert.alert(
        '✅ Pedido confirmado!',
        `Cliente: ${user?.name}\n` +
        `Total: R$ ${response.data.total.toFixed(2)}\n` +
        `Pedido #${response.data.orderId.slice(-6)}\n` +
        `Tipo: ${deliveryMethod === 'delivery' ? 'Delivery' : 'Retirada'}`,
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              navigation.navigate('Início');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao finalizar:', error);
      
      if (error.response?.data?.error) {
        Alert.alert('Erro', error.response.data.error);
      } else if (error.message === 'Network Error') {
        Alert.alert('Erro de rede', 'Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else {
        Alert.alert('Erro', 'Não foi possível finalizar o pedido. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = (id: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    updateQuantity(id, newQty);
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="shopping-cart" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Seu carrinho está vazio</Text>
        <Text style={styles.emptySubtext}>Adicione itens do cardápio para começar</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Cardápio')}>
          <Text style={styles.buttonText}>Ver Cardápio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🧾 Seu Pedido</Text>
        <Text style={styles.subtitle}>{getItemCount()} item(ns) no carrinho</Text>
      </View>

      {/* Lista de itens */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Itens</Text>
        {cart.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => updateItemQuantity(item.id, item.quantity, -1)}
                style={styles.qtyButton}
                disabled={loading}
              >
                <MaterialIcons name="remove" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateItemQuantity(item.id, item.quantity, 1)}
                style={styles.qtyButton}
                disabled={loading}
              >
                <MaterialIcons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>
              R$ {(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Tipo de entrega */}
      <View style={styles.deliverySection}>
        <Text style={styles.sectionTitle}>Tipo de entrega</Text>
        <View style={styles.deliveryOptions}>
          <TouchableOpacity
            style={[
              styles.deliveryOption,
              deliveryMethod === 'pickup' && styles.deliveryOptionActive,
            ]}
            onPress={() => setDeliveryMethod('pickup')}
          >
            <MaterialIcons
              name="store"
              size={24}
              color={deliveryMethod === 'pickup' ? '#e67e22' : '#888'}
            />
            <Text
              style={[
                styles.deliveryOptionText,
                deliveryMethod === 'pickup' && styles.deliveryOptionTextActive,
              ]}
            >
              Retirada no local
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deliveryOption,
              deliveryMethod === 'delivery' && styles.deliveryOptionActive,
            ]}
            onPress={() => setDeliveryMethod('delivery')}
          >
            <MaterialIcons
              name="local-shipping"
              size={24}
              color={deliveryMethod === 'delivery' ? '#e67e22' : '#888'}
            />
            <Text
              style={[
                styles.deliveryOptionText,
                deliveryMethod === 'delivery' && styles.deliveryOptionTextActive,
              ]}
            >
              Delivery
            </Text>
          </TouchableOpacity>
        </View>

        {deliveryMethod === 'delivery' && (
          <TextInput
            style={styles.addressInput}
            placeholder="Digite seu endereço completo"
            placeholderTextColor="#999"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
            editable={!loading}
          />
        )}
      </View>

      {/* Observações */}
      <View style={styles.observationsSection}>
        <Text style={styles.sectionTitle}>Observações</Text>
        <TextInput
          style={styles.observationsInput}
          placeholder="Ex: sem cebola, talher extra, ponto da carne..."
          placeholderTextColor="#999"
          value={observations}
          onChangeText={setObservations}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
      </View>

      {/* Resumo dos valores */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>R$ {subtotal.toFixed(2)}</Text>
        </View>
        {deliveryMethod === 'delivery' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de entrega</Text>
            <Text style={styles.summaryValue}>R$ {deliveryTax.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Botão finalizar */}
      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
        onPress={confirmOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
        )}
      </TouchableOpacity>

      {/* Botão limpar carrinho */}
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => {
          Alert.alert(
            'Limpar carrinho',
            'Tem certeza que deseja remover todos os itens?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Limpar', style: 'destructive', onPress: clearCart },
            ]
          );
        }}
        disabled={loading}
      >
        <Text style={styles.clearButtonText}>Limpar Carrinho</Text>
      </TouchableOpacity>

      {/* Espaço no final */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  itemsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemPrice: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e67e22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
    color: '#333',
  },
  itemTotal: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
    color: '#333',
  },
  deliverySection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  deliveryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  deliveryOptionActive: {
    borderColor: '#e67e22',
    backgroundColor: '#fff3e6',
  },
  deliveryOptionText: {
    fontSize: 14,
    color: '#888',
  },
  deliveryOptionTextActive: {
    color: '#e67e22',
    fontWeight: '500',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  observationsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  summarySection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e67e22',
  },
  confirmButton: {
    backgroundColor: '#e67e22',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  clearButton: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  clearButtonText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});