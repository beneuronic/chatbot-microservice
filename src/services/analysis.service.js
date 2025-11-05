import { openai } from "../config/openai.js";
import Message from "../models/Message.js";
import Unanswered from "../models/Unanswered.js";

/**
 * Limpia texto de entradas repetitivas o irrelevantes.
 */
const cleanMessages = (messages) =>
  messages
    .map((m) => m.message?.trim().toLowerCase())
    .filter(
      (m) =>
        m &&
        !["hola", "hi", "hello", "ok", "thanks", "gracias"].includes(m) &&
        m.length > 3
    );

/**
 * Cuenta palabras más repetidas para fallback local.
 */
const getTopKeywords = (messages, limit = 5) => {
  const counts = {};
  for (const msg of messages) {
    const words = msg
      .replace(/[^\p{L}\p{N} ]+/gu, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    for (const word of words) counts[word] = (counts[word] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .reduce((acc, [word, count]) => {
      acc[word] = count;
      return acc;
    }, {});
};

/**
 * Analiza sentimiento con OpenAI o fallback neutro.
 */
const analyzeSentiment = async (sampleText) => {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Analiza el sentimiento general (Positivo, Negativo o Neutral) del siguiente texto:\n\n${sampleText}`,
    });
    const text = response.output_text?.trim();
    if (/positivo/i.test(text)) return "Positive";
    if (/negativo/i.test(text)) return "Negative";
    return "Neutral";
  } catch (err) {
    console.warn("⚠️ Error en análisis de sentimiento:", err.message);
    return "Neutral";
  }
};

/**
 * Genera tips de mejora usando OpenAI o fallback.
 */
const generateTips = async (topics, sampleText) => {
  try {
    if (!topics || topics.length === 0) {
      return "<p>No tips available.</p>";
    }

    const prompt = `Eres un consultor UX de chatbots. Basándote en los temas más frecuentes (${topics.join(
      ", "
    )}), ofrece 3 sugerencias cortas, prácticas y motivadoras en formato HTML <ul><li>...</li></ul> para mejorar la experiencia de los usuarios.`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    return (
      response.output_text ||
      "<p>No tips available.</p>"
    );
  } catch (err) {
    console.warn("⚠️ Error generando tips:", err.message);
    return "<p>No tips available.</p>";
  }
};

/**
 * Función principal de análisis del chatbot.
 */
export const getChatbotAnalysis = async (tenant) => {
  const messages = await Message.find({ tenant }).sort({ createdAt: -1 }).lean();
  const unanswered = await Unanswered.find({ tenant }).lean();

  const userMessages = cleanMessages(messages);
  const totalMessages = userMessages.length;
  const totalUnanswered = unanswered.length;
  const percentUnanswered =
    totalMessages > 0
      ? ((totalUnanswered / totalMessages) * 100).toFixed(1)
      : 0;

  // Generar texto muestra
  const sampleText = userMessages.slice(-50).join("\n");

  // === Temas más frecuentes (OpenAI o fallback) ===
  let topTopics = {};
  try {
    if (sampleText.length > 50) {
      const aiResponse = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: `Analiza los mensajes de usuarios y devuelve los 5 temas más comunes con su frecuencia aproximada en formato JSON. Ejemplo: {"tema1": 5, "tema2": 3}\n\n${sampleText}`,
      });

      const text = aiResponse.output_text?.trim() || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      // ✅ Forzar fallback si el JSON está vacío o mal formado
      if (!parsed || Object.keys(parsed).length === 0) {
        console.warn("⚠️ OpenAI devolvió un JSON vacío. Usando fallback local.");
        topTopics = getTopKeywords(userMessages);
      } else {
        topTopics = parsed;
      }
    } else {
      topTopics = getTopKeywords(userMessages);
    }
  } catch (err) {
    console.warn("⚠️ Error analizando temas:", err.message);
    topTopics = getTopKeywords(userMessages);
  }

  // === Sentimiento general ===
  const sentiment = await analyzeSentiment(sampleText);

  // === Tips y sugerencias ===
  const topicsList = Object.keys(topTopics);
  const tips = await generateTips(
    topicsList.length ? topicsList : ["precios", "horarios", "atracciones"],
    sampleText || "Mensajes sobre el parque y sus servicios."
  );

  // === Actividad por hora ===
  const activityByHour = {};
  messages.forEach((msg) => {
    const hour = new Date(msg.createdAt).getHours();
    activityByHour[hour] = (activityByHour[hour] || 0) + 1;
  });
  const activityLabels = Object.keys(activityByHour).map(
    (h) => `${h.padStart(2, "0")}:00`
  );

  // === Devolver resultado completo ===
  return {
    totalMessages,
    totalUnanswered,
    percentUnanswered,
    topics: topTopics,
    tips,
    sentiment,
    activityByHour,
    activityLabels,
  };
};
