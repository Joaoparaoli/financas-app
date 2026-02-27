// Cliente Vercel API para deploy e gerenciamento
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

async function vercelRequest(endpoint, options = {}) {
  const url = `https://api.vercel.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Listar projetos
export async function listProjects(limit = 20) {
  return vercelRequest(`/v9/projects?limit=${limit}`);
}

// Obter detalhes do projeto
export async function getProject(idOrName) {
  return vercelRequest(`/v9/projects/${idOrName}`);
}

// Criar novo projeto
export async function createProject(name, options = {}) {
  const body = {
    name,
    framework: options.framework || 'nextjs',
    ...options,
  };
  return vercelRequest('/v10/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Deletar projeto
export async function deleteProject(idOrName) {
  return vercelRequest(`/v9/projects/${idOrName}`, {
    method: 'DELETE',
  });
}

// Listar deploys
export async function listDeployments(projectId = null, limit = 20) {
  const params = new URLSearchParams();
  if (projectId) params.append('projectId', projectId);
  params.append('limit', limit);
  return vercelRequest(`/v6/deployments?${params}`);
}

// Obter detalhes do deploy
export async function getDeployment(id) {
  return vercelRequest(`/v13/deployments/${id}`);
}

// Criar deploy (upload de arquivos)
export async function createDeployment(projectId, files, options = {}) {
  // Primeiro, criar presigned URLs para upload
  const fileList = Object.keys(files).map(file => ({
    file,
    sha: files[file].sha,
    size: files[file].size,
  }));

  const uploadResponse = await vercelRequest('/v9/files', {
    method: 'POST',
    body: JSON.stringify({ files: fileList }),
  });

  // Upload dos arquivos
  for (const [path, fileData] of Object.entries(files)) {
    const uploadUrl = uploadResponse.files.find(f => f.file === path)?.uploadUrl;
    if (uploadUrl) {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: fileData.content,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
  }

  // Criar deployment
  const deploymentBody = {
    name: projectId,
    files: fileList,
    framework: options.framework || 'nextjs',
    ...options,
  };

  return vercelRequest('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify(deploymentBody),
  });
}

// Promover deploy para produção
export async function promoteToProduction(deploymentId) {
  return vercelRequest(`/v13/deployments/${deploymentId}/promote`, {
    method: 'POST',
  });
}

// Listar domínios
export async function listDomains(projectId) {
  return vercelRequest(`/v9/projects/${projectId}/domains`);
}

// Adicionar domínio
export async function addDomain(projectId, domain) {
  return vercelRequest(`/v10/projects/${projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  });
}

// Listar variáveis de ambiente
export async function listEnvVars(projectId) {
  return vercelRequest(`/v9/projects/${projectId}/env`);
}

// Adicionar variável de ambiente
export async function addEnvVar(projectId, key, value, target = ['production', 'preview', 'development']) {
  return vercelRequest(`/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: JSON.stringify({
      key,
      value,
      target: Array.isArray(target) ? target : [target],
    }),
  });
}

// Remover variável de ambiente
export async function removeEnvVar(projectId, envId) {
  return vercelRequest(`/v9/projects/${projectId}/env/${envId}`, {
    method: 'DELETE',
  });
}

// Obter logs do deploy
export async function getDeploymentLogs(deploymentId) {
  return vercelRequest(`/v3/deployments/${deploymentId}/events`);
}

// Verificar status do deploy
export async function checkDeploymentStatus(deploymentId) {
  const deployment = await getDeployment(deploymentId);
  return {
    id: deployment.id,
    url: deployment.url,
    state: deployment.state,
    readyState: deployment.readyState,
    createdAt: deployment.createdAt,
    buildingAt: deployment.buildingAt,
    ready: deployment.ready,
  };
}

// Helper para deploy simplificado (build local + deploy)
export async function deployProject(projectName, sourceDir, options = {}) {
  console.log(`🚀 Iniciando deploy de ${projectName}...`);

  try {
    // Verificar se projeto existe
    let project;
    try {
      project = await getProject(projectName);
      console.log(`📁 Projeto encontrado: ${project.name}`);
    } catch {
      console.log(`📁 Criando novo projeto: ${projectName}`);
      project = await createProject(projectName, options);
    }

    // Aqui você precisaria implementar o upload dos arquivos
    // Isso requer leitura do diretório e cálculo de SHA
    console.log('⚠️ Upload de arquivos requer implementação adicional');
    console.log('💡 Use Vercel CLI para deploy completo: npx vercel --prod');

    return project;
  } catch (error) {
    throw new Error(`Deploy falhou: ${error.message}`);
  }
}

export default {
  listProjects,
  getProject,
  createProject,
  deleteProject,
  listDeployments,
  getDeployment,
  createDeployment,
  promoteToProduction,
  listDomains,
  addDomain,
  listEnvVars,
  addEnvVar,
  removeEnvVar,
  getDeploymentLogs,
  checkDeploymentStatus,
  deployProject,
};
