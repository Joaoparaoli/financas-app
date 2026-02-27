// Cliente N8N API para integração
const N8N_BASE_URL = process.env.N8N_API_URL || 'http://76.13.160.114:32770';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNWEzMWJhMy0wZjJjLTQ0MTItYTkxOS1iNzE2NDQwN2RiMmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDFiODBlMjQtMTc0OC00MGIwLWIwZTctZTYzYWY4MTk1MjU2IiwiaWF0IjoxNzcyMjAzNTkxfQ.bZ5psDNPIAbS19slsPeR07crjMf73pnJIcT1apWVie0';

async function n8nRequest(endpoint, options = {}) {
  const url = `${N8N_BASE_URL}/api/v1${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`N8N API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Listar todos os workflows
export async function listWorkflows() {
  return n8nRequest('/workflows');
}

// Obter detalhes de um workflow
export async function getWorkflow(id) {
  return n8nRequest(`/workflows/${id}`);
}

// Criar novo workflow
export async function createWorkflow(name, nodes = [], connections = {}) {
  const workflow = {
    name,
    nodes: nodes.map(node => ({
      id: node.id || crypto.randomUUID(),
      name: node.name,
      type: node.type,
      position: node.position || [250, 250],
      parameters: node.parameters || {},
      typeVersion: node.typeVersion || 1,
    })),
    connections,
    settings: {
      executionOrder: 'v1',
      saveExecutionProgress: true,
      saveManualExecutions: true,
    },
    staticData: null,
    tags: [],
  };

  return n8nRequest('/workflows', {
    method: 'POST',
    body: JSON.stringify(workflow),
  });
}

// Atualizar workflow
export async function updateWorkflow(id, updates) {
  return n8nRequest(`/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Deletar workflow
export async function deleteWorkflow(id) {
  return n8nRequest(`/workflows/${id}`, {
    method: 'DELETE',
  });
}

// Executar workflow
export async function executeWorkflow(id, data = {}) {
  return n8nRequest(`/workflows/${id}/execute`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Ativar/Desativar workflow
export async function activateWorkflow(id, active = true) {
  return n8nRequest(`/workflows/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'POST',
  });
}

// Obter execuções
export async function getExecutions(workflowId = null, limit = 20) {
  const params = new URLSearchParams();
  if (workflowId) params.append('workflowId', workflowId);
  params.append('limit', limit);
  return n8nRequest(`/executions?${params}`);
}

// Helper para criar workflow simples de webhook
export async function createWebhookWorkflow(name, webhookPath, nodes = []) {
  const webhookNode = {
    id: crypto.randomUUID(),
    name: 'Webhook',
    type: 'n8n-nodes-base.webhook',
    position: [250, 300],
    parameters: {
      httpMethod: 'POST',
      path: webhookPath,
      responseMode: 'responseNode',
    },
    typeVersion: 1,
    webhookId: webhookPath,
  };

  const allNodes = [webhookNode, ...nodes];
  
  const connections = {};
  if (nodes.length > 0) {
    connections[webhookNode.name] = {
      main: [[{ node: nodes[0].name, type: 'main', index: 0 }]],
    };
  }

  return createWorkflow(name, allNodes, connections);
}

// Helper para criar workflow de notificação
export async function createNotificationWorkflow(name, config = {}) {
  const { 
    telegramBotToken, 
    telegramChatId,
    whatsappNumber,
    emailAddress 
  } = config;

  const nodes = [];
  const connections = {};

  // Webhook trigger
  const webhookNode = {
    id: crypto.randomUUID(),
    name: 'Receive Notification',
    type: 'n8n-nodes-base.webhook',
    position: [250, 300],
    parameters: {
      httpMethod: 'POST',
      path: `notify-${Date.now()}`,
      responseMode: 'lastNode',
    },
    typeVersion: 1,
  };
  nodes.push(webhookNode);

  let lastNode = webhookNode.name;

  // Telegram
  if (telegramBotToken && telegramChatId) {
    const telegramNode = {
      id: crypto.randomUUID(),
      name: 'Send Telegram',
      type: 'n8n-nodes-base.telegram',
      position: [450, 200],
      parameters: {
        chatId: telegramChatId,
        text: '={{ $json.message }}',
        credentials: {
          telegramApi: telegramBotToken,
        },
      },
      typeVersion: 1,
    };
    nodes.push(telegramNode);
    
    if (!connections[lastNode]) connections[lastNode] = { main: [] };
    connections[lastNode].main[0].push({
      node: telegramNode.name,
      type: 'main',
      index: 0,
    });
  }

  // WhatsApp (Evolution API)
  if (whatsappNumber) {
    const whatsappNode = {
      id: crypto.randomUUID(),
      name: 'Send WhatsApp',
      type: 'n8n-nodes-base.httpRequest',
      position: [450, 400],
      parameters: {
        method: 'POST',
        url: 'http://localhost:8080/message/sendText/SEU_INSTANCE',
        body: {
          number: whatsappNumber,
          text: '={{ $json.message }}',
        },
      },
      typeVersion: 1,
    };
    nodes.push(whatsappNode);
    
    if (!connections[lastNode]) connections[lastNode] = { main: [] };
    connections[lastNode].main[0].push({
      node: whatsappNode.name,
      type: 'main',
      index: 0,
    });
  }

  // Email
  if (emailAddress) {
    const emailNode = {
      id: crypto.randomUUID(),
      name: 'Send Email',
      type: 'n8n-nodes-base.emailSend',
      position: [650, 300],
      parameters: {
        toEmail: emailAddress,
        subject: '={{ $json.subject || "Notificação" }}',
        text: '={{ $json.message }}',
      },
      typeVersion: 1,
    };
    nodes.push(emailNode);
    
    // Connect previous nodes to email
    const prevNodes = nodes.filter(n => n.name.startsWith('Send '));
    prevNodes.forEach(node => {
      if (!connections[node.name]) connections[node.name] = { main: [] };
      connections[node.name].main[0] = connections[node.name].main[0] || [];
      connections[node.name].main[0].push({
        node: emailNode.name,
        type: 'main',
        index: 0,
      });
    });
  }

  return createWorkflow(name, nodes, connections);
}

export default {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  activateWorkflow,
  getExecutions,
  createWebhookWorkflow,
  createNotificationWorkflow,
};
