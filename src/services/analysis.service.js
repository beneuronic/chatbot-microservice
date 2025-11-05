import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const analyzeMessagesWithOpenAI = async (text) => {
  if (!text || text.length < 10) return {};
  const prompt = `
Analiza el siguiente texto de conversaciones con usuarios y devuelve un JSON con los temas más frecuentes y su frecuencia.
Ejemplo:
{ "precios": 10, "horarios": 5, "ubicacion": 3 }

Texto:
${text.slice(0, 5000)}
`;
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    return {};
  }
};

export const generateUxTipsWithOpenAI = async (topics, sampleText) => {
  if (!topics || topics.length === 0) return "No tips available.";
  const prompt = `
Basado en estos temas frecuentes de conversación: ${topics.join(", ")},
y este ejemplo de mensajes:
${sampleText.slice(0, 1000)}

Genera 3 sugerencias breves para mejorar la experiencia del usuario.
Responde en HTML <ul><li>...</li></ul>.
`;
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0].message.content.trim();
};

export const analyzeSentimentWithOpenAI = async (text) => {
  if (!text || text.length < 5) return "Neutral";
  const prompt = `
Analiza el sentimiento general (positivo, negativo o neutral) del siguiente texto:
"${text.slice(0, 1000)}"
Responde solo con una palabra: "Positive", "Negative" o "Neutral".
`;
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0].message.content.trim();
};
