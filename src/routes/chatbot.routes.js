import { Router } from 'express'
import { getStatus, sendMessage } from '../controllers/chatbot.controller.js'

const router = Router()

// Ruta de test
router.get('/status', getStatus)

// Ejemplo de endpoint para recibir mensajes
router.post('/message', sendMessage)

export default router
