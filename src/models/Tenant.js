// src/models/Tenant.js
import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  prompt: {
    type: String,
    default:
      "Eres un asistente virtual de la web de un parque de atracciones amable y servicial. Responde con precisión y cordialidad.",
  },
  language: { type: String, default: "es" },
  active: { type: Boolean, default: true },
  messageLimit: { type: Number, default: 1000 },
  apiKey: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Tenant", tenantSchema);
