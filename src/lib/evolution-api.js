// Cliente Evolution API para WhatsApp
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
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Evolution API Error: ${response.status} - ${error}`);
  }

  return response.json().catch(() => ({}));
}

// ===== INSTANCE MANAGEMENT =====

// Listar todas as instâncias
export async function listInstances() {
  return evolutionRequest('/instance/list');
}

// Obter detalhes da instância
export async function getInstance(name = INSTANCE_NAME) {
  return evolutionRequest(`/instance/find/${name}`);
}

// Criar nova instância
export async function createInstance(name, options = {}) {
  const body = {
    instanceName: name,
    token: options.token || crypto.randomUUID(),
    qrcode: options.qrcode !== false,
    ...options,
  };
  return evolutionRequest('/instance/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Deletar instância
export async function deleteInstance(name) {
  return evolutionRequest(`/instance/delete/${name}`, {
    method: 'DELETE',
  });
}

// Conectar instância (gerar QR code)
export async function connectInstance(name = INSTANCE_NAME) {
  return evolutionRequest(`/instance/connect/${name}`, {
    method: 'POST',
  });
}

// Desconectar instância
export async function disconnectInstance(name = INSTANCE_NAME) {
  return evolutionRequest(`/instance/logout/${name}`, {
    method: 'POST',
  });
}

// Verificar status da conexão
export async function getConnectionState(name = INSTANCE_NAME) {
  return evolutionRequest(`/instance/connectionState/${name}`);
}

// ===== MESSAGING =====

// Enviar mensagem de texto
export async function sendText(number, message, options = {}) {
  const body = {
    number: formatNumber(number),
    text: message,
    options: {
      delay: options.delay || 1200,
      presence: options.presence || 'composing',
      ...options,
    },
  };
  return evolutionRequest(`/message/sendText/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Enviar imagem
export async function sendImage(number, imageUrl, caption = '', options = {}) {
  const body = {
    number: formatNumber(number),
    mediatype: 'image',
    file: imageUrl,
    caption,
    options: {
      delay: options.delay || 1200,
      presence: options.presence || 'composing',
      ...options,
    },
  };
  return evolutionRequest(`/message/sendMedia/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Enviar documento/PDF
export async function sendDocument(number, fileUrl, fileName, caption = '') {
  const body = {
    number: formatNumber(number),
    mediatype: 'document',
    file: fileUrl,
    fileName,
    caption,
  };
  return evolutionRequest(`/message/sendMedia/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Enviar áudio/voz
export async function sendAudio(number, audioUrl, options = {}) {
  const body = {
    number: formatNumber(number),
    audio: audioUrl,
    options: {
      encoding: options.encoding || true,
      ...options,
    },
  };
  return evolutionRequest(`/message/sendWhatsAppAudio/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Enviar botões/interativo
export async function sendButtons(number, title, description, buttons) {
  const body = {
    number: formatNumber(number),
    title,
    description,
    buttons: buttons.map((btn, index) => ({
      buttonId: `btn_${index}`,
      buttonText: { displayText: btn.text },
      type: btn.type || 1,
    })),
  };
  return evolutionRequest(`/message/sendButtons/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Enviar lista de opções
export async function sendList(number, title, description, sections) {
  const body = {
    number: formatNumber(number),
    title,
    description,
    sections: sections.map(section => ({
      title: section.title,
      rows: section.rows.map((row, index) => ({
        title: row.title,
        description: row.description || '',
        rowId: row.id || `row_${index}`,
      })),
    })),
  };
  return evolutionRequest(`/message/sendList/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Reagir a mensagem
export async function sendReaction(number, messageId, reaction) {
  const body = {
    number: formatNumber(number),
    key: { id: messageId },
    reaction,
  };
  return evolutionRequest(`/message/sendReaction/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Marcar como visto
export async function readMessages(number) {
  const body = {
    number: formatNumber(number),
    readMessages: true,
  };
  return evolutionRequest(`/message/readMessages/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ===== CHAT OPERATIONS =====

// Obter todas as conversas
export async function getChats() {
  return evolutionRequest(`/chat/findChats/${INSTANCE_NAME}`);
}

// Obter mensagens de um chat
export async function getChatMessages(number, limit = 50) {
  return evolutionRequest(`/chat/findMessages/${INSTANCE_NAME}?key=${formatNumber(number)}&limit=${limit}`);
}

// Arquivar chat
export async function archiveChat(number, archive = true) {
  const body = {
    number: formatNumber(number),
    archive,
  };
  return evolutionRequest(`/chat/archiveChat/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Deletar chat
export async function deleteChat(number) {
  return evolutionRequest(`/chat/deleteChat/${INSTANCE_NAME}?key=${formatNumber(number)}`, {
    method: 'DELETE',
  });
}

// Obter perfil
export async function getProfile(number) {
  return evolutionRequest(`/chat/fetchProfile/${INSTANCE_NAME}?number=${formatNumber(number)}`);
}

// Obter foto de perfil
export async function getProfilePicture(number) {
  return evolutionRequest(`/chat/getProfilePicture/${INSTANCE_NAME}?number=${formatNumber(number)}`);
}

// ===== GROUP OPERATIONS =====

// Criar grupo
export async function createGroup(subject, description, participants) {
  const body = {
    subject,
    description,
    participants: participants.map(formatNumber),
  };
  return evolutionRequest(`/group/create/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Obter todos os grupos
export async function getAllGroups() {
  return evolutionRequest(`/group/findAllGroups/${INSTANCE_NAME}`);
}

// Obter grupo por ID
export async function getGroup(groupId) {
  return evolutionRequest(`/group/findGroupInfos/${INSTANCE_NAME}?groupJid=${groupId}`);
}

// Adicionar participantes
export async function addParticipants(groupId, participants) {
  const body = {
    groupJid: groupId,
    participants: participants.map(formatNumber),
  };
  return evolutionRequest(`/group/updateGroupParticipant/${INSTANCE_NAME}?action=add`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Remover participantes
export async function removeParticipants(groupId, participants) {
  const body = {
    groupJid: groupId,
    participants: participants.map(formatNumber),
  };
  return evolutionRequest(`/group/updateGroupParticipant/${INSTANCE_NAME}?action=remove`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Promover a admin
export async function promoteToAdmin(groupId, participants) {
  const body = {
    groupJid: groupId,
    participants: participants.map(formatNumber),
  };
  return evolutionRequest(`/group/updateGroupParticipant/${INSTANCE_NAME}?action=promote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Rebaixar admin
export async function demoteAdmin(groupId, participants) {
  const body = {
    groupJid: groupId,
    participants: participants.map(formatNumber),
  };
  return evolutionRequest(`/group/updateGroupParticipant/${INSTANCE_NAME}?action=demote`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Sair do grupo
export async function leaveGroup(groupId) {
  return evolutionRequest(`/group/leaveGroup/${INSTANCE_NAME}?groupJid=${groupId}`, {
    method: 'DELETE',
  });
}

// ===== WEBHOOK & SETTINGS =====

// Configurar webhook
export async function setWebhook(url, events = ['messages.upsert']) {
  const body = {
    url,
    enabled: true,
    events,
  };
  return evolutionRequest(`/webhook/set/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Obter configuração do webhook
export async function getWebhook() {
  return evolutionRequest(`/webhook/find/${INSTANCE_NAME}`);
}

// Definir presença (online/typing/recording)
export async function setPresence(number, status = 'composing') {
  const body = {
    number: formatNumber(number),
    options: {
      presence: status,
      delay: 5000,
    },
  };
  return evolutionRequest(`/chat/setPresence/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Bloquear contato
export async function blockContact(number) {
  const body = {
    number: formatNumber(number),
  };
  return evolutionRequest(`/chat/blockUser/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Desbloquear contato
export async function unblockContact(number) {
  const body = {
    number: formatNumber(number),
  };
  return evolutionRequest(`/chat/unblockUser/${INSTANCE_NAME}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ===== HELPERS =====

// Formatar número (adicionar @s.whatsapp.net se necessário)
function formatNumber(number) {
  // Remover tudo exceto dígitos
  const cleaned = number.replace(/\D/g, '');
  
  // Se já tem @, retornar como está
  if (number.includes('@')) return number;
  
  // Adicionar código do país se não tiver
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `55${cleaned}@s.whatsapp.net`;
  }
  
  return `${cleaned}@s.whatsapp.net`;
}

// Enviar mensagem simples (função mais fácil)
export async function sendMessage(number, message) {
  return sendText(number, message);
}

// Verificar se instância está conectada
export async function isConnected(name = INSTANCE_NAME) {
  try {
    const state = await getConnectionState(name);
    return state.state === 'open' || state.state === 'CONNECTED';
  } catch {
    return false;
  }
}

// Broadcast para múltiplos números
export async function broadcast(numbers, message, delay = 1000) {
  const results = [];
  for (const number of numbers) {
    try {
      const result = await sendText(number, message);
      results.push({ number, success: true, result });
    } catch (error) {
      results.push({ number, success: false, error: error.message });
    }
    await new Promise(r => setTimeout(r, delay));
  }
  return results;
}

// Obter QR Code (para conexão inicial)
export async function getQRCode(name = INSTANCE_NAME) {
  const response = await evolutionRequest(`/instance/connect/${name}`, {
    method: 'GET',
  });
  return response.qrcode || response.code;
}

export default {
  // Instance
  listInstances,
  getInstance,
  createInstance,
  deleteInstance,
  connectInstance,
  disconnectInstance,
  getConnectionState,
  isConnected,
  getQRCode,
  
  // Messaging
  sendText,
  sendImage,
  sendDocument,
  sendAudio,
  sendButtons,
  sendList,
  sendReaction,
  sendMessage,
  readMessages,
  broadcast,
  
  // Chat
  getChats,
  getChatMessages,
  archiveChat,
  deleteChat,
  getProfile,
  getProfilePicture,
  setPresence,
  blockContact,
  unblockContact,
  
  // Group
  createGroup,
  getAllGroups,
  getGroup,
  addParticipants,
  removeParticipants,
  promoteToAdmin,
  demoteAdmin,
  leaveGroup,
  
  // Webhook
  setWebhook,
  getWebhook,
};
