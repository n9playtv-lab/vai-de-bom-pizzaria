// Calcula a taxa de entrega com base no bairro informado pelo cliente.
// - Se o frete gratis geral estiver ligado, sempre retorna 0.
// - Se o bairro bater (sem diferenciar maiusculas/minusculas) com um da lista, usa a taxa daquele bairro.
// - Caso contrario, usa a taxa padrao configurada (ou 0 se nao houver).
export function getDeliveryFee(settings, neighborhood) {
  if (!settings) return 0
  if (settings.freeDeliveryEnabled) return 0

  const areas = settings.deliveryAreas || []
  const term = (neighborhood || '').trim().toLowerCase()
  const match = areas.find((a) => (a.name || '').trim().toLowerCase() === term)
  if (match) return Number(match.fee) || 0

  return Number(settings.defaultDeliveryFee) || 0
}
