import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes/index.js'
import { connectDB } from './config/db.js'

dotenv.config()

// 👇 ESTA LÍNEA ES CRUCIAL
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

// ✅ Rutas principales
app.use('/api', routes)

// ✅ Ruta raíz de prueba
app.get('/', (req, res) => {
  res.send('Chatbot Microservice is running 🚀')
})

app.get('/status', (req, res) => {
  res.json({ message: 'API running successfully' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
