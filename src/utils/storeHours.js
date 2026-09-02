export const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function defaultHours() {
  // index: 0=Domingo, 1=Segunda, 2=Terça ... 6=Sábado
  return [
    { closed: false, open: '17:00', close: '23:00' }, // Domingo
    { closed: true, open: '17:00', close: '23:00' },  // Segunda - fechado
    { closed: false, open: '17:00', close: '23:00' }, // Terça
    { closed: false, open: '17:00', close: '23:00' }, // Quarta
    { closed: false, open: '17:00', close: '23:00' }, // Quinta
    { closed: false, open: '17:00', close: '23:00' }, // Sexta
    { closed: false, open: '17:00', close: '23:00' }, // Sábado
  ]
}

function toMinutes(hhmm) {
  const [h, m] = (hhmm || '0:0').split(':').map(Number)
  return h * 60 + m
}

// Retorna { open, closeLabel, opensAt, opensLabel, forced }
export function getStoreStatus(settings) {
  if (!settings) return { open: true, closeLabel: null, opensAt: null, opensLabel: null }
  if (settings.statusOverride === 'open') return { open: true, closeLabel: null, opensAt: null, opensLabel: null, forced: true }
  if (settings.statusOverride === 'closed') return { open: false, closeLabel: null, opensAt: null, opensLabel: null, forced: true }

  const hours = settings.hours || defaultHours()
  const now = new Date()
  const day = now.getDay()
  const today = hours[day]
  const nowMin = now.getHours() * 60 + now.getMinutes()

  if (today && !today.closed) {
    const openMin = toMinutes(today.open)
    const closeMin = toMinutes(today.close)
    let isOpen
    if (closeMin > openMin) {
      isOpen = nowMin >= openMin && nowMin < closeMin
    } else {
      isOpen = nowMin >= openMin || nowMin < closeMin
    }

    if (isOpen) return { open: true, closeLabel: today.close, opensAt: null, opensLabel: null }
    if (nowMin < openMin) return { open: false, closeLabel: null, opensAt: today.open, opensLabel: 'hoje' }
  }

  // fechado o dia todo ou ja passou do horario de hoje: procura o proximo dia que abre
  for (let offset = 1; offset <= 7; offset++) {
    const d = (day + offset) % 7
    const dHours = hours[d]
    if (dHours && !dHours.closed) {
      const label = offset === 1 ? 'amanhã' : WEEKDAYS[d]
      return { open: false, closeLabel: null, opensAt: dHours.open, opensLabel: label }
    }
  }

  return { open: false, closeLabel: null, opensAt: null, opensLabel: null }
}
