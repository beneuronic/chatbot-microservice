import Message from "../models/Message.js";

/**
 * GET /api/conversations
 * Lista conversaciones almacenadas en MongoDB
 */
export const getConversations = async (req, res) => {
  try {
    const { tenant, search = "", range = "", page = 1, limit = 20 } = req.query;

    const filters = {};

    // Filtrado por tenant
    if (tenant) filters.tenant = tenant;

    // Búsqueda libre
    if (search) {
      filters.$or = [
        { message: { $regex: search, $options: "i" } },
        { reply: { $regex: search, $options: "i" } },
      ];
    }

    // Rango de fechas
    const now = new Date();
    if (range === "today") filters.createdAt = { $gte: new Date(now.setHours(0,0,0,0)) };
    if (range === "week") filters.createdAt = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    if (range === "month") filters.createdAt = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };

    const skip = (page - 1) * limit;
    const conversations = await Message.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments(filters);

    res.json({ total, page: Number(page), limit: Number(limit), conversations });
  } catch (err) {
    console.error("❌ Error cargando conversaciones:", err);
    res.status(500).json({ error: "Error al obtener las conversaciones" });
  }
};
