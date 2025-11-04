import Message from "../models/Message.js";
import { generateChatbotReply } from "../services/chatbot.service.js";
import Usage from "../models/Usage.js";
import { GlobalUsage } from "../models/GlobalUsage.js";
import Tenant from "../models/Tenant.js";
import Instruction from "../models/Instruction.js";

const GLOBAL_LIMIT = 2500;

export const handleChatMessage = async (req, res) => {
  try {
    const { message, language = null, pageUrl, source = "web" } = req.body;
    let { tenant } = req.body;

    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    // Detección de tenant
    const origin = req.get("origin") || req.get("referer") || "";
    let tenantData = null;

    // Buscar tenant por nombre o dominio
    const domainFilters = [];
    try {
      if (origin) {
        const parsedUrl = new URL(origin);
        const baseDomain = parsedUrl.hostname.replace(/^www\./, "");
        const pathSegment = parsedUrl.pathname?.split("/").filter(Boolean)[0] || "";

        domainFilters.push(
          { domains: { $in: [origin] } },
          { domains: { $regex: baseDomain, $options: "i" } },
          { domains: { $regex: pathSegment, $options: "i" } }
        );
      }
    } catch {
      /* ignorar errores de parsing */
    }

    tenantData = await Tenant.findOne({
      $or: [{ name: tenant }, ...domainFilters],
      active: true,
    });

    // Fallback
    if (!tenantData) {
      const existingInstructions = await Instruction.find({ tenant });
      tenantData = existingInstructions.length
        ? { name: tenant, active: true }
        : await Tenant.findOne({ name: "default" });
      tenant = tenantData?.name || "default";
    } else {
      tenant = tenantData.name;
    }

    // Control de uso
    let usage = await Usage.findOne({ tenant });
    if (!usage) usage = await Usage.create({ tenant });

    let globalUsage = await GlobalUsage.findOne();
    if (!globalUsage)
      globalUsage = await GlobalUsage.create({ totalMessages: 0, limit: GLOBAL_LIMIT });

    const now = new Date();
    if ((now - usage.lastReset) / (1000 * 60 * 60 * 24) > 30) {
      usage.totalMessages = 0;
      usage.lastReset = now;
    }
    if ((now - globalUsage.lastReset) / (1000 * 60 * 60 * 24) > 30) {
      globalUsage.totalMessages = 0;
      globalUsage.lastReset = now;
    }

    if (globalUsage.totalMessages >= GLOBAL_LIMIT) {
      return res.status(429).json({
        reply: "⚠️ Límite global de interacciones alcanzado. Inténtalo más tarde.",
      });
    }

    // Cargar instrucciones del tenant
    const tenantInstructions = await Instruction.find({ tenant: tenantData.name });
    const instructionTexts = tenantInstructions.map((i) => i.text);

    // Generar respuesta
    const reply = await generateChatbotReply(message, instructionTexts, tenantData, language);

    // Guardar mensaje
    await Message.create({ tenant, message, reply, pageUrl, language, source, createdAt: now });

    usage.totalMessages += 1;
    globalUsage.totalMessages += 1;
    await usage.save();
    await globalUsage.save();

    res.json({ reply });
  } catch (error) {
    console.error("❌ Error en handleChatMessage:", error);
    res.status(500).json({ error: "Error interno del chatbot" });
  }
};
