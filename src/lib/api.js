async function request(url, options = {}) {
  const { headers, body, ...rest } = options;

  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...rest,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    throw new Error('Você precisa fazer login para continuar.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(error.message || 'Erro na requisição');
  }

  if (res.status === 204) {
    return {};
  }

  return res.json();
}

// Transactions
export const TransactionAPI = {
  list: (params) => request(`/api/transactions?${new URLSearchParams(params)}`),
  create: (data) => request('/api/transactions', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/transactions/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),
};

// Credit Cards
export const CreditCardAPI = {
  list: () => request('/api/credit-cards'),
  create: (data) => request('/api/credit-cards', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/credit-cards/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/api/credit-cards/${id}`, { method: 'DELETE' }),
};

// Assets
export const AssetAPI = {
  list: () => request('/api/assets'),
  create: (data) => request('/api/assets', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/assets/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/api/assets/${id}`, { method: 'DELETE' }),
};

// Liabilities
export const LiabilityAPI = {
  list: () => request('/api/liabilities'),
  create: (data) => request('/api/liabilities', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/liabilities/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/api/liabilities/${id}`, { method: 'DELETE' }),
};

// Financial Goals
export const FinancialGoalAPI = {
  list: () => request('/api/financial-goals'),
  create: (data) => request('/api/financial-goals', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/financial-goals/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/api/financial-goals/${id}`, { method: 'DELETE' }),
};

// Subscriptions
export const SubscriptionAPI = {
  list: () => request('/api/subscriptions'),
  create: (data) => request('/api/subscriptions', { method: 'POST', body: data }),
  update: (id, data) => request(`/api/subscriptions/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/api/subscriptions/${id}`, { method: 'DELETE' }),
};

export const BulkAPI = {
  export: () => request('/api/bulk'),
  import: (data) => request('/api/bulk', { method: 'POST', body: { data } }),
};
