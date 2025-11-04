import Message from "../models/Message.js";
import { generateChatbotReply } from "../services/chatbot.service.js";
import Usage from "../models/Usage.js";
import { GlobalUsage } from "../models/GlobalUsage.js";
import Tenant from "../models/Tenant.js";
import Instruction from "../models/Instruction.js";

const TENANT_LIMIT = 1000;
const GLOBAL_LIMIT = 2500;

export const handleChatMessage = async (req, res) => {
  try {
    const { message, language = null, pageUrl, source = "web" } = req.body;

    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    // 🌐 Detección de tenant (por body o dominio Referer/Origin)
    const origin = req.get("origin") || req.get("referer") || "";
    let tenant = req.body.tenant || "auto";
    let tenantData = null;

    try {
      if (origin && typeof origin === "string") {
        const parsedUrl = new URL(origin);
        const baseDomain = parsedUrl.hostname.replace(/^www\./, "");
        const pathSegmentRaw = parsedUrl.pathname?.split("/").filter(Boolean)[0];
        const pathSegment = typeof pathSegmentRaw === "string" ? pathSegmentRaw : "";

        // 🧠 Solo construir las condiciones si existen valores válidos
        const domainFilters = [];
        if (origin) domainFilters.push({ domains: { $in: [origin] } });
        if (baseDomain) domainFilters.push({ domains: { $elemMatch: { $regex: baseDomain, $options: "i" } } });
        if (pathSegment) domainFilters.push({ domains: { $elemMatch: { $regex: pathSegment, $options: "i" } } });

        tenantData = await Tenant.findOne({
          $or: [{ name: tenant }, ...domainFilters],
          active: true,
        });
      }
    } catch (err) {
      console.warn("⚠️ Error interpretando origen:", origin, err.message);
    }


    if (!tenantData) {
      console.warn(`⚠️ Tenant no encontrado (${origin}), usando 'default'`);
      tenantData = await Tenant.findOne({ name: "default" });
      tenant = "default";
    } else {
      tenant = tenantData?.name || "default";
    }

    console.log(`✅ Tenant detectado o asignado: ${tenant}`);

    // --- Obtener o crear registros de uso ---
    let usage = await Usage.findOne({ tenant });
    if (!usage) usage = await Usage.create({ tenant });

    let globalUsage = await GlobalUsage.findOne();
    if (!globalUsage)
      globalUsage = await GlobalUsage.create({ totalMessages: 0, limit: GLOBAL_LIMIT });

    // --- Reset mensual ---
    const now = new Date();
    const daysSinceReset = (now - usage.lastReset) / (1000 * 60 * 60 * 24);
    if (daysSinceReset > 30) {
      usage.totalMessages = 0;
      usage.lastReset = now;
    }
    const daysSinceGlobalReset = (now - globalUsage.lastReset) / (1000 * 60 * 60 * 24);
    if (daysSinceGlobalReset > 30) {
      globalUsage.totalMessages = 0;
      globalUsage.lastReset = now;
    }

    // --- Comprobar límites ---
    if (globalUsage.totalMessages >= GLOBAL_LIMIT) {
      return res.status(429).json({
        reply:
          "⚠️ El chatbot ha alcanzado el límite global de interacciones. Inténtalo más tarde.",
      });
    }

    // --- Obtener instrucciones del tenant ---
    const tenantInstructions = tenantData
      ? await Instruction.find({ tenant: tenantData.name })
      : [];
    const instructionTexts = tenantInstructions.map((i) => i.text);
    console.log(`📘 Instrucciones cargadas para ${tenant}:`, instructionTexts);

    // --- Generar respuesta ---
    const reply = await generateChatbotReply(message, instructionTexts, tenantData, language);

    // --- Guardar mensaje ---
    await Message.create({
      tenant,
      message,
      reply,
      pageUrl,
      language,
      source,
      createdAt: new Date(),
    });

    // --- Incrementar contadores ---
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
