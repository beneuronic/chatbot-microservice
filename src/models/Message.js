import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  tenant: { type: String, required: true, default: "default" },
  message: { type: String, required: true },
  reply: { type: String },
  pageUrl: { type: String },
  language: { type: String, default: "es" },
  source: { type: String, default: "web" },
  sessionId: { type: String },
  confidence: { type: Number, default: null },
  error: { type: String, default: null },
  // metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // 🔹 opcional
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ createdAt: -1 });
messageSchema.index({ tenant: 1 });
messageSchema.index({ language: 1 });
messageSchema.index({ source: 1 });
messageSchema.index({ tenant: 1, createdAt: -1 }); // ⚡ optimización combinada

export default mongoose.model("Message", messageSchema);
