import Tenant from "../models/Tenant.js";

/**
 * Sincroniza las páginas seleccionadas desde WordPress
 * y las guarda en la base de datos en el tenant correspondiente
 */
export const syncKnowledge = async (req, res) => {
  try {
    const { tenant, pages, origin } = req.body;

    if (!tenant || !pages || !Array.isArray(pages)) {
      return res.status(400).json({ error: "Missing or invalid data" });
    }

    // Buscar el tenant existente
    const tenantData = await Tenant.findOne({ name: tenant });
    if (!tenantData) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Guardar las páginas de conocimiento
    tenantData.knowledge = {
      pages,
      origin: origin || null,
      updatedAt: new Date(),
    };

    await tenantData.save();

    console.log(`✅ Knowledge synced for tenant: ${tenant}`);
    res.json({ success: true, tenant, pages });
  } catch (err) {
    console.error("❌ Error syncing knowledge:", err);
    res.status(500).json({ error: "Server error during knowledge sync" });
  }
};
