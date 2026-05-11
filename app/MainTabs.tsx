import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = { Início: 'home', Cardápio: 'restaurant-menu', Pedido: 'shopping-cart' };
          return <MaterialIcons name={icons[route.name as keyof typeof icons]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e67e22',
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: '#e67e22' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Cardápio" component={MenuScreen} />
      <Tab.Screen name="Pedido" component={CheckoutScreen} />
    </Tab.Navigator>
  );
}