// Criar usuário admin diretamente
const path = require('path');

// Simular a função createUser
const fs = require('fs');
const crypto = require('crypto');

const CORE_DB_PATH = path.join(__dirname, '..', 'data', 'core.db');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function loadCoreDB() {
  if (!fs.existsSync(CORE_DB_PATH)) {
    return { users: [] };
  }
  return JSON.parse(fs.readFileSync(CORE_DB_PATH, 'utf8'));
}

function saveCoreDB(data) {
  ensureDir(path.dirname(CORE_DB_PATH));
  fs.writeFileSync(CORE_DB_PATH, JSON.stringify(data, null, 2));
}

function createUser(userData) {
  const db = loadCoreDB();
  
  // Verificar se email já existe
  const exists = db.users.find(u => u.email === userData.email);
  if (exists) {
    throw new Error('Usuário com este email já existe');
  }
  
  const user = {
    id: crypto.randomUUID(),
    name: userData.name,
    email: userData.email,
    passwordHash: hashPassword(userData.password),
    tenantDbPath: `data/tenants/${Date.now()}.db`,
    createdAt: new Date().toISOString(),
  };
  
  db.users.push(user);
  saveCoreDB(db);
  
  return user;
}

try {
  const user = createUser({
    name: 'Administrador',
    email: 'admin@financas.com',
    password: 'admin123'
  });
  
  console.log('✅ Admin criado com sucesso!');
  console.log('Email: admin@financas.com');
  console.log('Senha: admin123');
  console.log('ID:', user.id);
} catch (error) {
  if (error.message.includes('já existe')) {
    console.log('ℹ️ Usuário admin já existe');
    console.log('Email: admin@financas.com');
    console.log('Senha: admin123');
  } else {
    console.error('❌ Erro:', error.message);
  }
}
