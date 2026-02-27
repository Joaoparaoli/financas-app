#!/usr/bin/env node
// CLI para gerenciar N8N via API
// Uso: node scripts/n8n-cli.js [comando] [args]

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

const commands = {
  async list() {
    const workflows = await n8nRequest('/workflows');
    console.log('\n📋 Workflows:\n');
    workflows.data.forEach(w => {
      console.log(`  ${w.id} | ${w.name} | ${w.active ? '✅ Ativo' : '⏸️ Inativo'}`);
    });
    console.log(`\nTotal: ${workflows.data.length} workflows\n`);
  },

  async get(id) {
    const workflow = await n8nRequest(`/workflows/${id}`);
    console.log('\n📄 Detalhes do Workflow:\n');
    console.log(JSON.stringify(workflow, null, 2));
  },

  async create(name) {
    const workflow = {
      name,
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
    };
    const result = await n8nRequest('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
    console.log('\n✅ Workflow criado:\n');
    console.log(`  ID: ${result.id}`);
    console.log(`  Nome: ${result.name}`);
  },

  async activate(id) {
    await n8nRequest(`/workflows/${id}/activate`, { method: 'POST' });
    console.log(`\n✅ Workflow ${id} ativado\n`);
  },

  async deactivate(id) {
    await n8nRequest(`/workflows/${id}/deactivate`, { method: 'POST' });
    console.log(`\n⏸️ Workflow ${id} desativado\n`);
  },

  async delete(id) {
    await n8nRequest(`/workflows/${id}`, { method: 'DELETE' });
    console.log(`\n🗑️ Workflow ${id} deletado\n`);
  },

  async execute(id) {
    const result = await n8nRequest(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    console.log('\n▶️ Execução iniciada:\n');
    console.log(JSON.stringify(result, null, 2));
  },

  async executions(workflowId = null) {
    const params = workflowId ? `?workflowId=${workflowId}` : '';
    const result = await n8nRequest(`/executions${params}`);
    console.log('\n📊 Execuções:\n');
    result.data.forEach(e => {
      console.log(`  ${e.id} | ${e.workflowName} | ${e.status} | ${new Date(e.startedAt).toLocaleString()}`);
    });
  },

  async help() {
    console.log(`
🚀 N8N CLI

Comandos:
  list                    - Listar todos os workflows
  get <id>                - Ver detalhes de um workflow
  create <nome>           - Criar workflow vazio
  activate <id>           - Ativar workflow
  deactivate <id>         - Desativar workflow
  delete <id>             - Deletar workflow
  execute <id>            - Executar workflow
  executions [workflowId] - Listar execuções
  help                    - Mostrar esta ajuda

Variáveis de ambiente:
  N8N_API_URL   - URL do N8N (default: http://76.13.160.114:32770)
  N8N_API_KEY   - API Key do N8N
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
    console.log('Use: node scripts/n8n-cli.js help\n');
    process.exit(1);
  }
}

main();
