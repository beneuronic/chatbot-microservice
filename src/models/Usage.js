// src/models/Usage.js
import mongoose from 'mongoose';

const usageSchema = new mongoose.Schema({
  tenant: { type: String, required: true, unique: true }, // 👈 cada tenant tiene un contador único
  totalMessages: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now },
});

// 🔎 Índice para búsquedas rápidas por tenant
usageSchema.index({ tenant: 1 });

export const Usage = mongoose.model('Usage', usageSchema);
