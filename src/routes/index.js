import { Router } from 'express'
import chatbotRoutes from './chatbot.routes.js'

const router = Router()

// ✅ Rutas agrupadas por módulo
router.use('/chatbot', chatbotRoutes)

export default router
