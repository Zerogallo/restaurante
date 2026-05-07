import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();



function MainTabs() {
  return (
      <Tab.Navigator
      screenOptions={{
        // CORES
        tabBarActiveTintColor: '#e67e22',
        tabBarInactiveTintColor: '#888',
        
        // BOOLEANOS EXPLÍCITOS (NUNCA USAR STRINGS)
        tabBarShowLabel: true,
        tabBarShowIcon: true,
        headerShown: true,
        
        // ESTILO DO HEADER
        headerStyle: { backgroundColor: '#e67e22' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        
        // ESTILO DA TAB BAR
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        
        // ÍCONE DINÂMICO
        tabBarIcon: ({ route, color, size }) => {
          let iconName;
          if (route.name === 'Início') {
            iconName = 'home';
          } else if (route.name === 'Cardápio') {
            iconName = 'restaurant-menu';
          } else if (route.name === 'Pedido') {
            iconName = 'shopping-cart';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      }}
    >
      <Tab.Screen 
        name="Início" 
        component={HomeScreen} 
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
        }}
      />
      
      <Tab.Screen 
        name="Cardápio" 
        component={MenuScreen} 
        options={{
          title: 'Cardápio',
          tabBarLabel: 'Cardápio',
        }}
      />
      
      <Tab.Screen 
        name="Pedido" 
        component={CheckoutScreen} 
        options={{
          title: 'Meu Pedido',
          tabBarLabel: 'Pedido',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) {return (<LoginScreen />);} // ou tela de splash

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}