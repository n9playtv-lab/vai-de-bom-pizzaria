export const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function defaultHours() {
  return Array.from({ length: 7 }, () => ({ closed: false, open: '18:00', close: '23:00' }))
}

function toMinutes(hhmm) {
  const [h, m] = (hhmm || '0:0').split(':').map(Number)
  return h * 60 + m
}

// Retorna { open: boolean, closeLabel: string|null }
export function getStoreStatus(settings) {
  if (!settings) return { open: true, closeLabel: null }
  if (settings.statusOverride === 'open') return { open: true, closeLabel: null, forced: true }
  if (settings.statusOverride === 'closed') return { open: false, closeLabel: null, forced: true }

  const hours = settings.hours || defaultHours()
  const now = new Date()
  const day = now.getDay()
  const today = hours[day]
  if (!today || today.closed) return { open: false, closeLabel: null }

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const openMin = toMinutes(today.open)
  const closeMin = toMinutes(today.close)

  let isOpen
  if (closeMin > openMin) {
    isOpen = nowMin >= openMin && nowMin < closeMin
  } else {
    // horario que passa da meia-noite (ex: 18:00 - 02:00)
    isOpen = nowMin >= openMin || nowMin < closeMin
  }

  return { open: isOpen, closeLabel: isOpen ? today.close : today.open }
}
