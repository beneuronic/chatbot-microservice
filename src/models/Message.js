// src/models/Message.js
import mongoose from "mongoose";
import Counter from "./Counter.js";

const messageSchema = new mongoose.Schema({
  tenant: { type: String, required: true, default: "default" },
  messageNumber: { type: Number },
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

// 🧮 Hook para asignar número incremental por tenant
messageSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
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

// ✅ índices optimizados, sin duplicar tenant
messageSchema.index({ tenant: 1, createdAt: -1 });
messageSchema.index({ tenant: 1, messageNumber: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ language: 1 });
messageSchema.index({ source: 1 });

export default mongoose.model("Message", messageSchema);
