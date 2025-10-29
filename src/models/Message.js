// src/models/Message.js
import mongoose from "mongoose";
import Counter from "./Counter.js";

const messageSchema = new mongoose.Schema({
  tenant: { type: String, required: true, default: "default" },

  // 🔢 Número secuencial por tenant
  messageNumber: { type: Number },

  // Contenido del mensaje
  message: { type: String, required: true },
  reply: { type: String },
  pageUrl: { type: String },
  language: { type: String, default: "es" },
  source: { type: String, default: "web" },
  sessionId: { type: String },
  confidence: { type: Number, default: null },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

// 🧮 Hook: asigna número incremental antes de guardar
messageSchema.pre("save", async function (next) {
  if (!this.isNew) return next(); // solo para nuevos mensajes

  try {
    const counter = await Counter.findOneAndUpdate(
      { tenant: this.tenant },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.messageNumber = counter.seq;
    next();
  } catch (err) {
    console.error("Error generando messageNumber:", err);
    next(err);
  }
});

// ✅ Índices optimizados y sin duplicados
messageSchema.index({ createdAt: -1 });                // analítica temporal global
messageSchema.index({ language: 1 });                  // filtrar por idioma
messageSchema.index({ source: 1 });                    // filtrar por canal
messageSchema.index({ tenant: 1, createdAt: -1 });     // búsquedas por tenant + fecha
messageSchema.index({ tenant: 1, messageNumber: 1 });  // orden secuencial por tenant

export default mongoose.model("Message", messageSchema);
