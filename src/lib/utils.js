import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export const INCOME_CATEGORIES = [
  'Salário/Pró-labore',
  'Dividendos',
  'Rendimentos de Investimentos',
  'Bonificações/Comissões',
  'Receita Extraordinária',
  'Reembolsos',
  'Outras Receitas',
];

export const EXPENSE_CATEGORIES = [
  'Moradia',
  'Utilidades',
  'Impostos',
  'Cartão de Crédito',
  'Educação',
  'Saúde',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Vestuário',
  'Cuidados Pessoais',
  'Investimentos',
  'Presentes/Doação',
  'Emergência',
  'Outros',
];

export const ASSET_TYPES = [
  { value: 'real_estate_rental', label: 'Imóvel para Aluguel' },
  { value: 'business', label: 'Negócio' },
  { value: 'stocks_dividends', label: 'Ações/Dividendos' },
  { value: 'investment_income', label: 'Renda de Investimentos' },
  { value: 'intellectual_property', label: 'Propriedade Intelectual' },
  { value: 'other_income', label: 'Outra Renda' },
];

export const LIABILITY_TYPES = [
  { value: 'vehicle', label: 'Veículo' },
  { value: 'real_estate_own', label: 'Imóvel Próprio' },
  { value: 'electronics', label: 'Eletrônicos' },
  { value: 'luxury_items', label: 'Itens de Luxo' },
  { value: 'subscriptions', label: 'Assinaturas' },
  { value: 'personal_items', label: 'Itens Pessoais' },
  { value: 'other_expense', label: 'Outra Despesa' },
];

export const GOAL_CATEGORIES = [
  { value: 'emergency_fund', label: 'Reserva de Emergência', emoji: '🛡️' },
  { value: 'down_payment', label: 'Entrada/Pagamento', emoji: '🏠' },
  { value: 'debt_payoff', label: 'Quitar Dívida', emoji: '💳' },
  { value: 'vacation', label: 'Viagem/Férias', emoji: '✈️' },
  { value: 'education', label: 'Educação', emoji: '📚' },
  { value: 'retirement', label: 'Aposentadoria', emoji: '🏖️' },
  { value: 'investment', label: 'Investimento', emoji: '📈' },
  { value: 'other', label: 'Outro', emoji: '🎯' },
];

export const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export function getFrequencyMultiplier(frequency) {
  const map = {
    monthly: 1,
    bimonthly: 0.5,
    quarterly: 1 / 3,
    semiannual: 1 / 6,
    annual: 1 / 12,
  };
  return map[frequency] || 1;
}

export function getFrequencyLabel(frequency) {
  return FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label || frequency;
}
