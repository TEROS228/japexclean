// lib/translate.ts

export async function translateText(text: string, targetLang = "en"): Promise<string> {
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: "ja",
        target: targetLang,
        format: "text",
      }),
    });

    if (!res.ok) {
      throw new Error(`Translation API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.translatedText;
  } catch (error) {
    console.error("Translation failed:", error);
    return text; // fallback: return original text
  }
}
