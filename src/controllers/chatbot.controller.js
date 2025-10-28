// src/controllers/chatbot.controller.js
import { processMessage } from '../services/chatbot.service.js'

export const getStatus = (req, res) => {
  res.json({ message: 'Chatbot API is live ✅' })
}

export const sendMessage = async (req, res) => {
  try {
    const { message, tenant } = req.body
    const response = await processMessage(message, tenant)
    res.json({ reply: response })
  } catch (error) {
    console.error('❌ Error in sendMessage:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
