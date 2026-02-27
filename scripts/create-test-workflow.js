// Script para criar workflow com webhook
const N8N_BASE_URL = 'http://76.13.160.114:32770';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNWEzMWJhMy0wZjJjLTQ0MTItYTkxOS1iNzE2NDQwN2RiMmMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZDFiODBlMjQtMTc0OC00MGIwLWIwZTctZTYzYWY4MTk1MjU2IiwiaWF0IjoxNzcyMjAzNTkxfQ.bZ5psDNPIAbS19slsPeR07crjMf73pnJIcT1apWVie0';

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
    throw new Error(`Error ${response.status}: ${error}`);
  }
  return response.json();
}

async function main() {
  const webhookPath = 'teste-api-' + Date.now();
  
  const workflow = {
    name: 'Teste Webhook com API',
    nodes: [
      {
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
      },
      {
        id: crypto.randomUUID(),
        name: 'Resposta',
        type: 'n8n-nodes-base.respondToWebhook',
        position: [450, 300],
        parameters: {
          options: {},
          respondWith: 'allIncomingItems',
        },
        typeVersion: 1,
      }
    ],
    connections: {
      'Webhook': {
        main: [[{ node: 'Resposta', type: 'main', index: 0 }]]
      }
    },
    settings: { executionOrder: 'v1' },
  };

  try {
    const result = await n8nRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
    
    console.log('✅ Workflow criado com sucesso!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Nome: ${result.name}`);
    console.log(`   Webhook: ${N8N_BASE_URL}/webhook/${webhookPath}`);
    
    // Ativar
    await n8nRequest(`/workflows/${result.id}/activate`, { method: 'POST' });
    console.log('✅ Workflow ativado!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
