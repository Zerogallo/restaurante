require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_restaurante';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Inicializa o banco de dados fake (em arquivo)
function initDB() {
  // Cria a pasta data se não existir
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  if (!fs.existsSync(DB_PATH)) {
    const data = {
      users: [],      // { id, name, email, password_hash, total_spent, phone? }
      menu: [
        { id: '1', name: 'Frango Grelhado', category: 'food', price: 25.90, description: 'Com legumes' },
        { id: '2', name: 'Parmegiana', category: 'food', price: 32.90, description: 'Arroz, fritas' },
        { id: '3', name: 'Pudim', category: 'dessert', price: 8.90, description: 'Leite condensado' },
        { id: '4', name: 'Mousse de Maracujá', category: 'dessert', price: 9.90, description: '' },
        { id: '5', name: 'Coca-Cola 350ml', category: 'drink', price: 6.50, description: '' },
        { id: '6', name: 'Suco Natural', category: 'drink', price: 7.90, description: 'Laranja, limão, couve' }
      ],
      orders: []      // { id, userId, items, total, date, location? }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    console.log('✅ Banco de dados inicializado com sucesso!');
  }
}
initDB();

function readDB() {
  const raw = fs.readFileSync(DB_PATH);
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ---------- ROTAS ----------

// 1. Login (ou criar usuário se não existir)
app.post('/api/login', async (req, res) => {
  const { email, password, name, phone } = req.body;
  let db = readDB();

  let user = db.users.find(u => u.email === email);
  
  if (!user) {
    // Cadastro automático (primeiro acesso)
    if (!name) {
      return res.status(400).json({ error: 'Nome necessário para cadastro' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    user = {
      id: uuidv4(),
      email,
      name,
      phone: phone || '',  // phone é opcional
      password_hash: hashed,
      total_spent: 0
    };
    db.users.push(user);
    writeDB(db);
    console.log(`📝 Novo usuário cadastrado: ${email}`);
  } else {
    // Login - verifica senha
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }
    console.log(`🔐 Usuário logado: ${email}`);
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone || '',
      total_spent: user.total_spent 
    } 
  });
});

// 2. Obter perfil + histórico + total gasto
app.get('/api/profile', authMiddleware, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const userOrders = db.orders
    .filter(o => o.userId === req.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    total_spent: user.total_spent,
    history: userOrders.map(order => ({
      id: order.id,
      date: order.date,
      total: order.total,
      items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
    }))
  });
});

// 3. Obter cardápio (filtrado por categoria)
app.get('/api/menu', authMiddleware, (req, res) => {
  const db = readDB();
  const { category } = req.query;
  let menu = db.menu;
  if (category && ['food', 'dessert', 'drink'].includes(category)) {
    menu = menu.filter(item => item.category === category);
  }
  res.json(menu);
});

// 4. Finalizar pedido (fechar conta)
app.post('/api/orders', authMiddleware, (req, res) => {
  const { items, observations, location } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Pedido vazio' });
  }

  let db = readDB();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não existe' });
  }

  // Calcula total
  let total = 0;
  for (const item of items) {
    const menuItem = db.menu.find(m => m.id === item.id);
    if (!menuItem) {
      return res.status(400).json({ error: `Item ${item.id} inválido` });
    }
    total += menuItem.price * (item.qty || 1);
  }

  const newOrder = {
    id: uuidv4(),
    userId: req.userId,
    items: items.map(it => {
      const menuItem = db.menu.find(m => m.id === it.id);
      return { 
        id: it.id, 
        name: menuItem.name, 
        price: menuItem.price, 
        qty: it.qty || 1 
      };
    }),
    total,
    observations: observations || '',
    location: location || 'Loja principal',
    date: new Date().toISOString(),
    status: 'pending'
  };
  
  db.orders.push(newOrder);
  user.total_spent += total;
  writeDB(db);

  console.log(`🛒 Novo pedido #${newOrder.id.slice(-6)} - Total: R$ ${total}`);

  res.status(201).json({ 
    orderId: newOrder.id, 
    total,
    message: 'Pedido realizado com sucesso!'
  });
});

// 5. Rota de saúde (sem autenticação)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 6. Rota para debug (opcional - remove em produção)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/users', (req, res) => {
    const db = readDB();
    const safeUsers = db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      total_spent: u.total_spent
    }));
    res.json({ users: safeUsers, count: safeUsers.length });
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 API disponível em: http://localhost:${PORT}/api`);
  console.log(`📱 Para acessar do celular, use o IP: ${getLocalIp()}`);
});

// Função para mostrar o IP local
function getLocalIp() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'não detectado';
}