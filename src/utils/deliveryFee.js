// Calcula a taxa de entrega com base na CIDADE detectada pelo CEP do cliente.
// - Se o frete gratis geral estiver ligado, sempre retorna 0.
// - Se a cidade bater (sem diferenciar maiusculas/minusculas) com uma da lista, usa a taxa dela.
// - Caso contrario, usa a taxa padrao configurada (ou 0 se nao houver).
export function getDeliveryFee(settings, city) {
  if (!settings) return 0
  if (settings.freeDeliveryEnabled) return 0

  const cities = settings.deliveryCities || []
  const term = (city || '').trim().toLowerCase()
  if (!term) return 0
  const match = cities.find((c) => (c.name || '').trim().toLowerCase() === term)
  if (match) return Number(match.fee) || 0

  return Number(settings.defaultDeliveryFee) || 0
}

// Busca endereco pelo CEP usando a API publica ViaCEP.
// Retorna { street, neighborhood, city, state } ou null se nao encontrar / der erro.
export async function lookupCep(cep) {
  const digits = (cep || '').replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    }
  } catch {
    return null
  }
}
