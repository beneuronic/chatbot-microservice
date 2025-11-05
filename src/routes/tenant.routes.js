import express from "express";
import Tenant from "../models/Tenant.js";

const router = express.Router();

// Obtener todos los tenants (solo para debug local)
router.get("/", async (req, res) => {
  try {
    const tenants = await Tenant.find({});
    res.json(tenants);
  } catch (err) {
    console.error("❌ Error fetching tenants:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
