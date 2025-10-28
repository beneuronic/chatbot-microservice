// src/services/chatbot.service.js
import Message from '../models/Message.js'

export const processMessage = async (message, tenant) => {
  // Generamos una respuesta simple de prueba
  const reply = `Echo: ${message} (tenant: ${tenant || 'default'})`

  // Guardamos el mensaje en MongoDB
  await Message.create({
    tenant: tenant || 'default',
    message,
    reply
  })

  // Devolvemos la respuesta al usuario
  return reply
}
