#!/usr/bin/env node
// CLI Vercel para gerenciar projetos e deploys

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

async function vercelRequest(endpoint, options = {}) {
  const url = `https://api.vercel.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

const commands = {
  async projects() {
    const projects = await vercelRequest('/v9/projects?limit=20');
    console.log('\n📁 Projetos Vercel:\n');
    projects.projects.forEach(p => {
      console.log(`  ${p.name} | ${p.framework || 'N/A'} | ${p.latestDeployments?.[0]?.state || 'N/A'}`);
    });
    console.log(`\nTotal: ${projects.projects.length} projetos\n`);
  },

  async project(name) {
    const project = await vercelRequest(`/v9/projects/${name}`);
    console.log('\n📄 Detalhes do Projeto:\n');
    console.log(`  Nome: ${project.name}`);
    console.log(`  Framework: ${project.framework || 'N/A'}`);
    console.log(`  Domínio: ${project.targets?.production?.alias?.[0] || 'N/A'}`);
    console.log(`  Criado em: ${new Date(project.createdAt).toLocaleString()}`);
  },

  async create(name) {
    const project = await vercelRequest('/v10/projects', {
      method: 'POST',
      body: JSON.stringify({ name, framework: 'nextjs' }),
    });
    console.log('\n✅ Projeto criado:\n');
    console.log(`  ID: ${project.id}`);
    console.log(`  Nome: ${project.name}`);
    console.log(`  URL: https://${project.name}.vercel.app`);
  },

  async delete(name) {
    await vercelRequest(`/v9/projects/${name}`, { method: 'DELETE' });
    console.log(`\n🗑️ Projeto ${name} deletado\n`);
  },

  async deploys(projectName = null) {
    const params = projectName ? `?projectId=${projectName}&limit=10` : '?limit=10';
    const deploys = await vercelRequest(`/v6/deployments${params}`);
    console.log('\n🚀 Deployments:\n');
    deploys.deployments.forEach(d => {
      const status = d.state === 'READY' ? '✅' : d.state === 'BUILDING' ? '🏗️' : '❌';
      console.log(`  ${status} ${d.url} | ${d.state} | ${new Date(d.createdAt).toLocaleString()}`);
    });
  },

  async env(projectName) {
    const envs = await vercelRequest(`/v9/projects/${projectName}/env`);
    console.log(`\n🔧 Variáveis de ambiente (${projectName}):\n`);
    envs.envs.forEach(e => {
      const targets = e.target.join(', ');
      console.log(`  ${e.key} = ${e.value?.slice(0, 20)}... [${targets}]`);
    });
  },

  async setenv(projectName, key, value) {
    await vercelRequest(`/v10/projects/${projectName}/env`, {
      method: 'POST',
      body: JSON.stringify({
        key,
        value,
        target: ['production', 'preview', 'development'],
      }),
    });
    console.log(`\n✅ ${key} adicionado ao projeto ${projectName}\n`);
  },

  async domains(projectName) {
    const domains = await vercelRequest(`/v9/projects/${projectName}/domains`);
    console.log(`\n🌐 Domínios (${projectName}):\n`);
    domains.domains.forEach(d => {
      console.log(`  ${d.name} | ${d.verified ? '✅ Verificado' : '⏳ Pendente'}`);
    });
  },

  async help() {
    console.log(`
🚀 Vercel CLI

Comandos:
  projects                      - Listar projetos
  project <nome>                - Ver detalhes do projeto
  create <nome>                 - Criar novo projeto
  delete <nome>                 - Deletar projeto
  deploys [nome]                - Listar deployments
  env <nome>                    - Listar variáveis de ambiente
  setenv <nome> <chave> <valor> - Adicionar variável
  domains <nome>                - Listar domínios
  help                          - Mostrar ajuda

Variáveis de ambiente:
  VERCEL_TOKEN - Token de API do Vercel
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
    console.log('Use: node scripts/vercel-cli.js help\n');
    process.exit(1);
  }
}

main();
