async function request(url, profileId, options = {}) {
  const { headers, body, ...rest } = options;

  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Profile-Id': profileId || 'profile-1',
      ...(headers || {}),
    },
    ...rest,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(error.message || error.error || 'Erro na requisição');
  }

  if (res.status === 204) return {};
  return res.json();
}

// Transactions
export const TransactionAPI = {
  list: (profileId, params) => request(`/api/transactions?${new URLSearchParams(params)}`, profileId),
  create: (profileId, data) => request('/api/transactions', profileId, { method: 'POST', body: data }),
  update: (profileId, id, data) => request(`/api/transactions/${id}`, profileId, { method: 'PUT', body: data }),
  delete: (profileId, id) => request(`/api/transactions/${id}`, profileId, { method: 'DELETE' }),
};

// Credit Cards
export const CreditCardAPI = {
  list: (profileId) => request('/api/credit-cards', profileId),
  create: (profileId, data) => request('/api/credit-cards', profileId, { method: 'POST', body: data }),
  update: (profileId, id, data) => request(`/api/credit-cards/${id}`, profileId, { method: 'PUT', body: data }),
  delete: (profileId, id) => request(`/api/credit-cards/${id}`, profileId, { method: 'DELETE' }),
};

// Assets
export const AssetAPI = {
  list: (profileId) => request('/api/assets', profileId),
  create: (profileId, data) => request('/api/assets', profileId, { method: 'POST', body: data }),
  update: (profileId, id, data) => request(`/api/assets/${id}`, profileId, { method: 'PUT', body: data }),
  delete: (profileId, id) => request(`/api/assets/${id}`, profileId, { method: 'DELETE' }),
};

// Liabilities
export const LiabilityAPI = {
  list: (profileId) => request('/api/liabilities', profileId),
  create: (profileId, data) => request('/api/liabilities', profileId, { method: 'POST', body: data }),
  update: (profileId, id, data) => request(`/api/liabilities/${id}`, profileId, { method: 'PUT', body: data }),
  delete: (profileId, id) => request(`/api/liabilities/${id}`, profileId, { method: 'DELETE' }),
};

// Financial Goals
export const FinancialGoalAPI = {
  list: (profileId) => request('/api/financial-goals', profileId),
  create: (profileId, data) => request('/api/financial-goals', profileId, { method: 'POST', body: data }),
  update: (profileId, id, data) => request(`/api/financial-goals/${id}`, profileId, { method: 'PUT', body: data }),
  delete: (profileId, id) => request(`/api/financial-goals/${id}`, profileId, { method: 'DELETE' }),
};

// Subscriptions
export const SubscriptionAPI = {
  list: (profileId) => request('/api/subscriptions', profileId),
  create: (profileId, data) => request('/api/subscriptions', profileId, { method: 'POST', body: data }),
  update: (profileId, id, data) => request(`/api/subscriptions/${id}`, profileId, { method: 'PUT', body: data }),
  delete: (profileId, id) => request(`/api/subscriptions/${id}`, profileId, { method: 'DELETE' }),
};

export const BulkAPI = {
  export: (profileId) => request('/api/bulk', profileId),
  import: (profileId, data) => request('/api/bulk', profileId, { method: 'POST', body: { data } }),
};
