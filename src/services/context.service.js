import axios from "axios";

/**
 * Devuelve el contenido textual de las páginas definidas en el tenant
 * para usarlas como contexto del chatbot.
 */
export const buildContextFromKnowledge = async (tenantData) => {
  try {
    if (!tenantData.knowledge || !tenantData.knowledge.pages?.length) {
      return "No authorized pages found for this chatbot.";
    }

    const { pages, origin } = tenantData.knowledge;
    if (!origin) return "Missing origin domain for tenant knowledge.";

    const contexts = [];

    for (const pageId of pages) {
      try {
        const url = `${origin}/?p=${pageId}&cbm_plain=1`;
        const { data } = await axios.get(url, { timeout: 8000 });

        // 🔹 Sanitiza el contenido (elimina HTML y saltos innecesarios)
        const text = data
          .replace(/<[^>]*>?/gm, "")
          .replace(/\s+/g, " ")
          .trim();

        contexts.push(`=== Page ID ${pageId} ===\n${text}`);
      } catch (err) {
        console.error(`⚠️ Error fetching page ${pageId}:`, err.message);
      }
    }

    return contexts.join("\n\n");
  } catch (err) {
    console.error("❌ Error building context:", err);
    return "Error retrieving authorized content.";
  }
};
