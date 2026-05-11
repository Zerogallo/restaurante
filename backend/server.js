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

// Inicializa o banco de dados
function initDB() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  if (!fs.existsSync(DB_PATH)) {
    const data = {
      users: [],
      menu: [
        { id: '1', name: 'Frango Grelhado', category: 'food', price: 25.90, description: 'Com legumes' },
        { id: '2', name: 'Parmegiana', category: 'food', price: 32.90, description: 'Arroz, fritas' },
        { id: '3', name: 'Pudim', category: 'dessert', price: 8.90, description: 'Leite condensado' },
        { id: '4', name: 'Mousse de Maracujá', category: 'dessert', price: 9.90, description: '' },
        { id: '5', name: 'Coca-Cola 350ml', category: 'drink', price: 6.50, description: '' },
        { id: '6', name: 'Suco Natural', category: 'drink', price: 7.90, description: 'Laranja, limão, couve' }
      ],
      orders: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
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

// Função para tempo estimado baseado no status
function getEstimatedTime(status) {
  const times = {
    pending: '10-15 minutos',
    preparing: '20-30 minutos',
    delivering: '5-10 minutos',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };
  return times[status] || 'Aguardando';
}

// Função para mensagem de status
function getStatusMessage(status) {
  const messages = {
    pending: 'Pedido confirmado e aguardando na fila',
    preparing: 'Pedido sendo preparado pela cozinha',
    delivering: 'Pedido saiu para entrega 🛵',
    delivered: 'Pedido entregue com sucesso! ✅',
    cancelled: 'Pedido cancelado ❌'
  };
  return messages[status] || 'Processando pedido';
}

// ---------- ROTAS ----------

// 1. Login (ou criar usuário se não existir)
app.post('/api/login', async (req, res) => {
  const { email, password, name } = req.body;
  let db = readDB();

  let user = db.users.find(u => u.email === email);
  
  if (!user) {
    if (!name) return res.status(400).json({ error: 'Nome necessário para cadastro' });
    const hashed = await bcrypt.hash(password, 10);
    user = {
      id: uuidv4(),
      email,
      name,
      password_hash: hashed,
      total_spent: 0,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDB(db);
  } else {
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      total_spent: user.total_spent 
    } 
  });
});

// 2. Obter perfil com histórico
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
    total_spent: user.total_spent,
    history: userOrders.map(order => ({
      id: order.id,
      date: order.date,
      total: order.total,
      status: order.status,
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      items: order.items
    }))
  });
});

// 3. Cardápio
app.get('/api/menu', authMiddleware, (req, res) => {
  const db = readDB();
  const { category } = req.query;
  let menu = db.menu;
  if (category && ['food', 'dessert', 'drink'].includes(category)) {
    menu = menu.filter(item => item.category === category);
  }
  res.json(menu);
});

// 4. Finalizar pedido (COM DADOS DO CLIENTE E STATUS INICIAL)
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

  // Cria o pedido com TODOS os dados do cliente e histórico de status
  const newOrder = {
    id: uuidv4(),
    userId: user.id,
    clientName: user.name,
    clientEmail: user.email,
    clientId: user.id,
    items: items.map(it => {
      const menuItem = db.menu.find(m => m.id === it.id);
      return { 
        id: it.id, 
        name: menuItem.name, 
        price: menuItem.price, 
        qty: it.qty || 1 
      };
    }),
    total: total,
    subtotal: total,
    observations: observations || '',
    location: location || 'Loja principal',
    date: new Date().toISOString(),
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        message: 'Pedido confirmado e aguardando na fila'
      }
    ]
  };
  
  db.orders.push(newOrder);
  user.total_spent = (user.total_spent || 0) + total;
  writeDB(db);

  console.log('='.repeat(50));
  console.log('🛒 NOVO PEDIDO RECEBIDO:');
  console.log(`📋 Pedido ID: ${newOrder.id}`);
  console.log(`👤 Cliente: ${newOrder.clientName} (${newOrder.clientEmail})`);
  console.log(`💰 Total: R$ ${newOrder.total.toFixed(2)}`);
  console.log(`📦 Itens: ${newOrder.items.map(i => `${i.qty}x ${i.name}`).join(', ')}`);
  console.log(`📍 Local: ${newOrder.location}`);
  console.log(`📝 Obs: ${newOrder.observations || 'Nenhuma'}`);
  console.log(`📊 Status: ${newOrder.status}`);
  console.log('='.repeat(50));

  res.status(201).json({ 
    orderId: newOrder.id, 
    total: newOrder.total,
    clientName: newOrder.clientName,
    status: newOrder.status,
    message: 'Pedido realizado com sucesso!'
  });
});

// 5. Rastrear pedido específico (para o cliente)
app.get('/api/orders/:orderId/track', authMiddleware, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado' });
  }
  
  if (order.userId !== req.userId) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  res.json({
    id: order.id,
    status: order.status,
    statusHistory: order.statusHistory || [],
    estimatedTime: getEstimatedTime(order.status),
    items: order.items,
    total: order.total,
    date: order.date,
    location: order.location,
    clientName: order.clientName
  });
});

// 6. Listar todos os pedidos do usuário
app.get('/api/orders', authMiddleware, (req, res) => {
  const db = readDB();
  const orders = db.orders
    .filter(o => o.userId === req.userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json(orders.map(o => ({
    id: o.id,
    status: o.status,
    total: o.total,
    date: o.date,
    itemsCount: o.items.reduce((sum, i) => sum + i.qty, 0),
    location: o.location
  })));
});

// 7. ADMIN: Atualizar status do pedido
app.put('/api/admin/orders/:orderId/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }
  
  let db = readDB();
  const order = db.orders.find(o => o.id === req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado' });
  }
  
  // Verifica se o usuário é admin (para simplificar, qualquer usuário pode ser admin?
  // Por enquanto, qualquer um pode atualizar, mas idealmente verificar role)
  
  const oldStatus = order.status;
  order.status = status;
  
  if (!order.statusHistory) {
    order.statusHistory = [];
  }
  
  order.statusHistory.push({
    status: status,
    timestamp: new Date().toISOString(),
    message: getStatusMessage(status)
  });
  
  writeDB(db);
  
  console.log(`📦 Pedido #${order.id.slice(-6)}: ${oldStatus} → ${status}`);
  
  res.json({ 
    success: true, 
    status, 
    message: getStatusMessage(status),
    orderId: order.id
  });
});

// 8. ADMIN: Listar todos os pedidos (para gestão)
app.get('/api/admin/orders', authMiddleware, (req, res) => {
  const db = readDB();
  const { page = 1, limit = 20, status } = req.query;
  
  let orders = [...db.orders];
  
  if (status && ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'].includes(status)) {
    orders = orders.filter(o => o.status === status);
  }
  
  orders.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedOrders = orders.slice(start, end);
  
  res.json({
    total: orders.length,
    page: Number(page),
    limit: Number(limit),
    orders: paginatedOrders.map(order => ({
      id: order.id,
      clientName: order.clientName,
      clientEmail: order.clientEmail,
      total: order.total,
      date: order.date,
      status: order.status,
      location: order.location,
      itemsCount: order.items.reduce((sum, i) => sum + i.qty, 0)
    }))
  });
});

// 9. Rota de saúde
app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    ordersCount: db.orders.length,
    usersCount: db.users.length,
    pendingOrders: db.orders.filter(o => o.status === 'pending').length
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`📊 Endpoints disponíveis:`);
  console.log(`   POST   /api/login`);
  console.log(`   GET    /api/profile`);
  console.log(`   GET    /api/menu`);
  console.log(`   POST   /api/orders`);
  console.log(`   GET    /api/orders`);
  console.log(`   GET    /api/orders/:orderId/track`);
  console.log(`   PUT    /api/admin/orders/:orderId/status`);
  console.log(`   GET    /api/admin/orders`);
  console.log(`   GET    /api/health`);
});