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
  if (!fs.existsSync(DB_PATH)) {
    const data = {
      users: [],      // { id, name, email, password_hash, total_spent }
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
  const { email, password, name } = req.body;
  let db = readDB();

  let user = db.users.find(u => u.email === email);
  if (!user) {
    // Criação automática (primeiro acesso)
    if (!name) return res.status(400).json({ error: 'Nome necessário para cadastro' });
    const hashed = await bcrypt.hash(password, 10);
    user = {
      id: uuidv4(),
      email,
      name,
      password_hash: hashed,
      total_spent: 0
    };
    db.users.push(user);
    writeDB(db);
  } else {
    // Verifica senha
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, total_spent: user.total_spent } });
});

// 2. Obter perfil + histórico + total gasto
app.get('/api/profile', authMiddleware, async (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const userOrders = db.orders.filter(o => o.userId === req.userId).sort((a,b) => new Date(b.date) - new Date(a.date));
  res.json({
    name: user.name,
    email: user.email,
    total_spent: user.total_spent,
    history: userOrders.map(order => ({
      id: order.id,
      date: order.date,
      total: order.total,
      items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
    }))
  });
});

// 3. Obter cardápio (filtrado por categoria? opcional)
app.get('/api/menu', authMiddleware, (req, res) => {
  const db = readDB();
  const { category } = req.query;
  let menu = db.menu;
  if (category && ['food','dessert','drink'].includes(category)) {
    menu = menu.filter(item => item.category === category);
  }
  res.json(menu);
});

// 4. Finalizar pedido (fechar conta)
app.post('/api/orders', authMiddleware, async (req, res) => {
  const { items, observations, location } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Pedido vazio' });

  let db = readDB();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não existe' });

  // Calcula total
  let total = 0;
  for (const item of items) {
    const menuItem = db.menu.find(m => m.id === item.id);
    if (!menuItem) return res.status(400).json({ error: `Item ${item.id} inválido` });
    total += menuItem.price * (item.qty || 1);
  }

  const newOrder = {
    id: uuidv4(),
    userId: req.userId,
    items: items.map(it => {
      const menuItem = db.menu.find(m => m.id === it.id);
      return { id: it.id, name: menuItem.name, price: menuItem.price, qty: it.qty || 1 };
    }),
    total,
    observations: observations || '',
    location: location || 'Loja principal',
    date: new Date().toISOString()
  };
  db.orders.push(newOrder);

  // Atualiza total gasto do usuário
  user.total_spent += total;
  writeDB(db);

  res.status(201).json({ orderId: newOrder.id, total });
});

// Rota de saúde
app.get('/api/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));