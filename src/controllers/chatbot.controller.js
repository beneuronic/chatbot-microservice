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

    // 🧩 Detección híbrida del tenant (compatible con múltiples dominios y subdirectorios)
    const origin = req.get("origin") || req.get("referer") || "";
    let tenant = req.body.tenant || "auto";

    console.log("🌐 Origen detectado:", origin);

    // 1️⃣ Normalizar el valor del origin / referer
    let parsedOrigin = origin;
    try {
      const parsedUrl = new URL(origin);
      // Se usa el dominio + pathname base (por si hay subdirectorio)
      parsedOrigin = parsedUrl.origin + parsedUrl.pathname;
      // Se elimina barra final para evitar fallos de coincidencia
      if (parsedOrigin.endsWith("/")) parsedOrigin = parsedOrigin.slice(0, -1);
    } catch (e) {
      console.warn("⚠️ No se pudo parsear el origin correctamente:", origin);
    }

    // 2️⃣ Buscar tenant por nombre o dominio/subdirectorio parcial
    let tenantData = await Tenant.findOne({
      $or: [
        { name: tenant },
        { domains: { $elemMatch: { $regex: parsedOrigin, $options: "i" } } },
        // Si no se encuentra coincidencia exacta, busca por dominio base
        { domains: { $elemMatch: { $regex: new URL(origin).origin, $options: "i" } } }
      ],
      active: true,
    });

    // 3️⃣ Si no hay coincidencia, usar default
    if (!tenantData) {
      console.warn(`⚠️ Tenant no encontrado (${origin}), usando 'default'`);
      tenantData = await Tenant.findOne({ name: "default" });
      tenant = "default";
    } else {
      tenant = tenantData.name;
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
    const tenantReachedLimit = usage.totalMessages >= TENANT_LIMIT;
    const globalReachedLimit = globalUsage.totalMessages >= GLOBAL_LIMIT;

    if (globalReachedLimit) {
      return res.status(429).json({
        reply: "⚠️ El chatbot ha alcanzado el límite global de interacciones. Inténtalo más tarde.",
      });
    }

    if (tenantReachedLimit) {
      console.warn(`⚠️ Tenant ${tenant} ha superado su límite, usando margen global.`);
    }

    // 🧠 Obtener instrucciones del tenant (flexible entre alias)
    const tenantInstructions = await Instruction.find({
      tenant: { $in: [tenantData.name, tenant] },
    });
    const instructionTexts = tenantInstructions.map((i) => i.text);

    console.log(`📘 Instrucciones cargadas para ${tenant}:`, instructionTexts);

    // --- Generar respuesta con instrucciones incluidas ---
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
