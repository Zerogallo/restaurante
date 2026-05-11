export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  total_spent: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'food' | 'dessert' | 'drink';
  price: number;
  description: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  date: string;
  observations?: string;
  location?: string;
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_spent: number;
  history: Order[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}