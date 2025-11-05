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
  domains: [{ type: String }], // ✅ permite asociar varios dominios al mismo tenant
  knowledge: {
    origin: { type: String },
    pages: [{ type: Number }],
    updatedAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Tenant", tenantSchema);
