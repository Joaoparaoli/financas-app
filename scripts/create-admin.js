// Script para criar usuário admin
const { createUser } = require('../src/lib/core-db');

async function createAdmin() {
  try {
    const admin = await createUser({
      name: 'Administrador',
      email: 'admin@financas.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin criado com sucesso!');
    console.log('Email: admin@financas.com');
    console.log('Senha: admin123');
    console.log('ID:', admin.id);
  } catch (error) {
    if (error.message.includes('já existe')) {
      console.log('ℹ️ Usuário admin já existe');
      console.log('Email: admin@financas.com');
      console.log('Senha: admin123');
    } else {
      console.error('❌ Erro ao criar admin:', error.message);
    }
  }
}

createAdmin();
