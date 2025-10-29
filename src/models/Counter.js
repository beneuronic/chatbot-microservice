// src/models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  tenant: { type: String, required: true }, // ❌ sin index:true
  seq: { type: Number, default: 0 },
});

// ✅ un solo índice manual
counterSchema.index({ tenant: 1 });

export default mongoose.model("Counter", counterSchema);
