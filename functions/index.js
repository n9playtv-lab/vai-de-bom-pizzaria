// Cloud Functions - Vai de Bom Pizzaria
//
// Dispara mensagens de WhatsApp automaticamente quando o status de um pedido muda,
// usando a WhatsApp Cloud API (Meta). Configure as credenciais com:
//
//   firebase functions:config:set whatsapp.token="SEU_TOKEN" whatsapp.phone_id="SEU_PHONE_NUMBER_ID"
//
// Como conseguir essas credenciais: crie um app em https://developers.facebook.com/apps
// -> adicione o produto "WhatsApp" -> Cloud API. E' gratis ate 1000 conversas/mes.

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { defineString } from 'firebase-functions/params'
import fetch from 'node-fetch'

initializeApp()
const db = getFirestore()

const WHATSAPP_TOKEN = defineString('WHATSAPP_TOKEN')
const WHATSAPP_PHONE_ID = defineString('WHATSAPP_PHONE_ID')

const MESSAGES = {
  aceito: (order) => `Boa, ${order.customer.name}! Seu pedido #${order.id.slice(0, 6).toUpperCase()} foi aceito e já está sendo preparado. 🍕`,
  recusado: (order) => `Poxa, ${order.customer.name}, não conseguimos aceitar seu pedido #${order.id.slice(0, 6).toUpperCase()} agora. Fale com a gente pra entender o motivo.`,
  saiu_entrega: (order) => `Seu pedido #${order.id.slice(0, 6).toUpperCase()} saiu para entrega! Chega logo aí. 🛵`,
  entregue: (order) => `Pedido #${order.id.slice(0, 6).toUpperCase()} entregue. Bom apetite! Obrigado por pedir com a gente 🍕`,
}

export const onOrderStatusChange = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data.before.data()
  const after = event.data.after.data()

  if (before.status === after.status) return
  const buildMessage = MESSAGES[after.status]
  if (!buildMessage) return

  const order = { id: event.params.orderId, ...after }
  const text = buildMessage(order)
  const phone = normalizePhone(order.customer?.phone)

  const token = WHATSAPP_TOKEN.value()
  const phoneId = WHATSAPP_PHONE_ID.value()

  if (!token || !phoneId) {
    console.warn('WHATSAPP_TOKEN / WHATSAPP_PHONE_ID nao configurados ainda - mensagem nao enviada:', text)
    return
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    })
    if (!res.ok) {
      console.error('Erro ao enviar WhatsApp:', await res.text())
    }
  } catch (err) {
    console.error('Falha na chamada da WhatsApp Cloud API:', err)
  }
})

// Converte "81 91234-5678" ou "(81) 91234-5678" para o formato E.164 esperado (5581912345678)
function normalizePhone(raw) {
  const digits = (raw || '').replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  return `55${digits}`
}
