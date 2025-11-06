import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import Tenant from "../models/Tenant.js";
import Instruction from "../models/Instruction.js";
import { buildContextFromKnowledge } from "./context.service.js";

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ No se encontró OPENAI_API_KEY. Verifica tu archivo .env");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera la respuesta del chatbot usando OpenAI.
 * Incluye: prompt base del tenant, instrucciones adicionales,
 * y contexto proveniente de las páginas sincronizadas desde WordPress.
 */
export async function generateChatbotReply(
  userMessage,
  instructions = [],
  tenant = null,
  languageFromBody = null
) {
  try {
    const safeInstructions = Array.isArray(instructions) ? instructions : [];
    const language = languageFromBody || tenant?.language || "es";

    // 📋 Prompt base
    const promptBase =
      tenant?.prompt ||
      `Eres el asistente oficial de ${tenant?.name || "un parque temático"}.
       Ofreces información sobre horarios, precios, atracciones y servicios.
       Sé breve (máx. 3 frases).`;

    // 🧠 Obtener contexto desde las páginas autorizadas
    const knowledgeContext = await buildContextFromKnowledge(tenant);
    console.log("📘 Contexto extraído desde páginas autorizadas:\n", knowledgeContext?.slice(0, 500));

    // 💬 Construcción jerárquica de mensajes
    const messages = [
      {
        role: "system",
        content: `
Eres el asistente virtual oficial de ${tenant?.name || "este sitio"}.
Tu apodo es ${tenant?.name || "NeuronicBot"}.
Responde SIEMPRE en ${language}.
No inventes información: responde únicamente basándote en la siguiente documentación oficial.`,
      },
      {
        role: "system",
        content: `📚 Información oficial del sitio:\n${knowledgeContext}`,
      },
      ...safeInstructions.map(text => ({
        role: "system",
        content: text.trim(),
      })),
      {
        role: "system",
        content: `${promptBase.trim()}\nSé educado, útil y breve.`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    console.log("🔍 safeInstructions:", safeInstructions);
    console.log("🔍 tenant:", tenant?.name);
    console.log("🔍 language:", language);
    console.log("🧩 Mensajes enviados a OpenAI:", messages.length, "bloques");

    // 🚀 Petición a OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: tenant?.temperature || 0.7,
      max_tokens: 250,
    });

    // ✅ Devolver respuesta limpia
    return completion.choices[0].message.content.trim();

  } catch (err) {
    console.error("❌ Error generando respuesta:", err);
    return "Hubo un error al generar la respuesta del asistente.";
  }
}
