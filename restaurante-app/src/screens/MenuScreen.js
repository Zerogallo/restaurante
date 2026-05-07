import React from 'react';
import { View, FlatList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useCart } from '../context/CartContext';
import MenuItem from '../components/MenuItem';
import api from '../utils/api';

const Tab = createMaterialTopTabNavigator();

function MenuList({ category }) {
  // ... (mesmo código de antes)
  // Mantenha igual - não altera
}

export default function MenuScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: '#e67e22' },
        tabBarActiveTintColor: '#e67e22',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 14 },
        tabBarStyle: { elevation: 2, shadowOpacity: 0.1 },
        // 🔥 Adicione as linhas abaixo (booleanos explícitos)
        swipeEnabled: true,        // booleano direto
        lazy: false,               // booleano direto
        tabBarShowLabel: true,     // booleano direto
        tabBarShowIcon: false,     // booleano direto
      }}
    >
      <Tab.Screen name="Comida" children={() => <MenuList category="food" />} />
      <Tab.Screen name="Sobremesa" children={() => <MenuList category="dessert" />} />
      <Tab.Screen name="Bebida" children={() => <MenuList category="drink" />} />
    </Tab.Navigator>
  );
}