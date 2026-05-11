import React, { useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useCart } from '../context/CartContext';
import MenuItem from '../components/MenuItem';
import api from '../utils/api';
import { MenuItem as MenuItemType } from '../types';

const Tab = createMaterialTopTabNavigator();

function MenuList({ category }: { category: 'food' | 'dessert' | 'drink' }) {
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchMenu();
  }, [category]);

  const fetchMenu = async () => {
    try {
      const response = await api.get<MenuItemType[]>(`/menu?category=${category}`);
      setItems(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o cardápio.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item: MenuItemType) => {
    addToCart(item, 1);
    Alert.alert('Adicionado', `${item.name} foi adicionado ao pedido.`);
  };

  if (loading) return <ActivityIndicator size="large" color="#e67e22" style={styles.center} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => <MenuItem item={item} onAdd={handleAdd} />}
    />
  );
}

export default function MenuScreen() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarIndicatorStyle: { backgroundColor: '#e67e22' },
      tabBarActiveTintColor: '#e67e22',
      tabBarInactiveTintColor: '#888',
      tabBarLabelStyle: { fontWeight: 'bold', fontSize: 14 },
    }}>
      <Tab.Screen name="Comida" children={() => <MenuList category="food" />} />
      <Tab.Screen name="Sobremesa" children={() => <MenuList category="dessert" />} />
      <Tab.Screen name="Bebida" children={() => <MenuList category="drink" />} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});