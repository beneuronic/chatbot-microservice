// src/models/Usage.js
import mongoose from "mongoose";

const usageSchema = new mongoose.Schema({
  tenant: { type: String, required: true }, // ❌ sin index:true
  totalMessages: { type: Number, default: 0 },
  limit: { type: Number, default: 1000 },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ índice manual único
usageSchema.index({ tenant: 1 });

export default mongoose.model("Usage", usageSchema);
