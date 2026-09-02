export function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
