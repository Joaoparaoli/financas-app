#!/usr/bin/env node
// CLI Evolution API para WhatsApp

const EVOLUTION_BASE_URL = process.env.EVOLUTION_API_URL || 'http://76.13.160.114:46021';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '9wR1t1lEWzWsNv5stWitlt1UjWOARPs4';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || 'joaoparaoli';
const INSTANCE_API_KEY = process.env.EVOLUTION_INSTANCE_KEY || '43BBC2E651B6-4CE5-A918-330EC59EEABC';

async function evolutionRequest(endpoint, options = {}) {
  const url = `${EVOLUTION_BASE_URL}${endpoint}`;
  const isInstanceEndpoint = endpoint.includes('/message/') || endpoint.includes('/chat/');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
      ...(isInstanceEndpoint && { 'Authorization': `Bearer ${INSTANCE_API_KEY}` }),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Evolution API Error: ${response.status} - ${error}`);
  }

  return response.json().catch(() => ({}));
}

function formatNumber(number) {
  if (number.includes('@')) return number;
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `55${cleaned}@s.whatsapp.net`;
  }
  return `${cleaned}@s.whatsapp.net`;
}

const commands = {
  async status() {
    const state = await evolutionRequest(`/instance/connectionState/${INSTANCE_NAME}`);
    console.log('\n📱 Status da Instância:\n');
    console.log(`  Instância: ${INSTANCE_NAME}`);
    console.log(`  Estado: ${state.state}`);
    console.log(`  Conectado: ${state.state === 'open' ? '✅ Sim' : '❌ Não'}`);
  },

  async connect() {
    const result = await evolutionRequest(`/instance/connect/${INSTANCE_NAME}`, {
      method: 'POST',
    });
    console.log('\n🔗 QR Code Gerado:\n');
    console.log(`  Instância: ${INSTANCE_NAME}`);
    if (result.qrcode) {
      console.log(`  QR Code: ${result.qrcode.substring(0, 50)}...`);
      console.log('\n  Escaneie o QR Code no WhatsApp para conectar!');
    } else {
      console.log('  Já conectado ou aguardando conexão...');
    }
  },

  async disconnect() {
    await evolutionRequest(`/instance/logout/${INSTANCE_NAME}`, { method: 'POST' });
    console.log(`\n🔌 Instância ${INSTANCE_NAME} desconectada\n`);
  },

  async send(number, message) {
    const body = {
      number: formatNumber(number),
      text: message,
      options: { delay: 1200, presence: 'composing' },
    };
    await evolutionRequest(`/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log(`\n✅ Mensagem enviada para ${number}\n`);
  },

  async image(number, url, caption = '') {
    const body = {
      number: formatNumber(number),
      mediatype: 'image',
      file: url,
      caption,
      options: { delay: 1200 },
    };
    await evolutionRequest(`/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log(`\n✅ Imagem enviada para ${number}\n`);
  },

  async doc(number, url, filename, caption = '') {
    const body = {
      number: formatNumber(number),
      mediatype: 'document',
      file: url,
      fileName: filename,
      caption,
    };
    await evolutionRequest(`/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log(`\n✅ Documento enviado para ${number}\n`);
  },

  async chats() {
    const chats = await evolutionRequest(`/chat/findChats/${INSTANCE_NAME}`);
    console.log('\n💬 Conversas:\n');
    chats.forEach(c => {
      console.log(`  ${c.id} | ${c.name || 'Desconhecido'} | ${c.unreadCount} não lidas`);
    });
  },

  async messages(number) {
    const msgs = await evolutionRequest(`/chat/findMessages/${INSTANCE_NAME}?key=${formatNumber(number)}&limit=20`);
    console.log(`\n📨 Últimas mensagens (${number}):\n`);
    msgs.messages?.forEach(m => {
      const from = m.key.fromMe ? 'Eu' : 'Contato';
      console.log(`  [${from}] ${m.message?.conversation || m.message?.extendedTextMessage?.text || '[Mídia]'}`);
    });
  },

  async groups() {
    const groups = await evolutionRequest(`/group/findAllGroups/${INSTANCE_NAME}`);
    console.log('\n👥 Grupos:\n');
    groups.forEach(g => {
      console.log(`  ${g.id} | ${g.subject} | ${g.participants?.length} participantes`);
    });
  },

  async profile(number) {
    const profile = await evolutionRequest(`/chat/fetchProfile/${INSTANCE_NAME}?number=${formatNumber(number)}`);
    console.log('\n👤 Perfil:\n');
    console.log(`  Nome: ${profile.name || 'N/A'}`);
    console.log(`  Número: ${number}`);
    console.log(`  Status: ${profile.status || 'N/A'}`);
  },

  async webhook(url) {
    if (!url) {
      const config = await evolutionRequest(`/webhook/find/${INSTANCE_NAME}`);
      console.log('\n🔗 Webhook Config:\n');
      console.log(`  URL: ${config.url || 'N/A'}`);
      console.log(`  Ativo: ${config.enabled ? 'Sim' : 'Não'}`);
      return;
    }
    
    const body = {
      url,
      enabled: true,
      events: ['messages.upsert', 'messages.update', 'connection.update'],
    };
    await evolutionRequest(`/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log(`\n✅ Webhook configurado: ${url}\n`);
  },

  async instances() {
    const instances = await evolutionRequest('/instance/list');
    console.log('\n📱 Instâncias:\n');
    instances.forEach(i => {
      console.log(`  ${i.instanceName} | ${i.state} | ${i.profileName || 'Sem nome'}`);
    });
  },

  async help() {
    console.log(`
📱 Evolution API CLI - WhatsApp

Configuração:
  Instância: ${INSTANCE_NAME}
  URL: ${EVOLUTION_BASE_URL}

Comandos:
  status                          - Ver status da conexão
  connect                         - Gerar QR Code para conectar
  disconnect                      - Desconectar instância
  send <numero> <mensagem>        - Enviar mensagem de texto
  image <numero> <url> [legenda]  - Enviar imagem
  doc <numero> <url> <nome>       - Enviar documento
  chats                           - Listar conversas
  messages <numero>               - Ver mensagens do contato
  groups                          - Listar grupos
  profile <numero>                - Ver perfil do contato
  webhook [url]                   - Ver/configurar webhook
  instances                       - Listar todas as instâncias
  help                            - Mostrar esta ajuda

Exemplos:
  node scripts/evolution-cli.js send 551199999999 "Olá!"
  node scripts/evolution-cli.js image 551199999999 https://exemplo.com/foto.jpg "Legenda"
  node scripts/evolution-cli.js webhook https://seusite.com/webhook
`);
  },
};

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  if (!cmd || cmd === 'help') {
    await commands.help();
    return;
  }

  if (commands[cmd]) {
    try {
      await commands[cmd](...args);
    } catch (error) {
      console.error(`\n❌ Erro: ${error.message}\n`);
      process.exit(1);
    }
  } else {
    console.error(`\n❌ Comando desconhecido: ${cmd}`);
    console.log('Use: node scripts/evolution-cli.js help\n');
    process.exit(1);
  }
}

main();
