import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extrae los temas más frecuentes
export async function analyzeMessagesWithOpenAI(text) {
  const prompt = `
Analiza los siguientes mensajes de usuarios y devuelve un JSON con los temas más frecuentes y su frecuencia aproximada.
Mensajes:
${text.slice(0, 4000)}
`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
  });
  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return { Error: "No se pudo interpretar la respuesta" };
  }
}

// Genera sugerencias UX
export async function generateTips(topics, textSample) {
  const prompt = `
Basándote en estos temas: ${topics.join(", ")}, genera 3 consejos breves de UX para mejorar la experiencia del chatbot.
Ejemplo: "Agrega respuestas rápidas sobre precios"`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
  });
  return response.choices[0].message.content;
}

// Analiza sentimiento
export async function analyzeSentiment(text) {
  const prompt = `
Clasifica el sentimiento general de los siguientes mensajes como "Positive", "Negative" o "Neutral":
${text.slice(0, 4000)}
`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
  });
  return response.choices[0].message.content.trim();
}
