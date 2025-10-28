// src/models/Message.js
import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  tenant: { type: String, required: true },
  message: { type: String, required: true },
  reply: { type: String },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Message', messageSchema)
