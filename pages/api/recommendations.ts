import type { NextApiRequest, NextApiResponse } from "next";
import { searchRakutenProducts } from "@/lib/rakuten";
import { intelligentRanking } from "@/lib/search-intelligence";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Cache for 2 hours
  res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=3600');

  const { itemName, genreId, limit = "8" } = req.query;

  if (!itemName || typeof itemName !== "string") {
    return res.status(400).json({ error: "itemName parameter is required" });
  }

  try {
    // Извлекаем ключевые слова из названия товара
    const keywords = extractKeywords(itemName);
    const searchQuery = keywords.slice(0, 3).join(" "); // Берем топ-3 ключевых слова

    // console.log(`[Recommendations API] Item: "${itemName}"`);
    // console.log(`[Recommendations API] Search query: "${searchQuery}"`);

    // Ищем похожие товары
    const products = await searchRakutenProducts(searchQuery, 1, 30);

    // Применяем умное ранжирование
    const rankedProducts = intelligentRanking(products, searchQuery);

    // Ограничиваем количество
    const limitNum = parseInt(limit as string, 10);
    const recommendations = rankedProducts.slice(0, limitNum);

    // console.log(`[Recommendations API] Found ${recommendations.length} recommendations`);

    return res.status(200).json({
      success: true,
      products: recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    console.error("Recommendations API error:", error);
    return res.status(500).json({
      error: "Failed to get recommendations",
      message: error.message,
    });
  }
}

/**
 * Извлекает ключевые слова из названия товара
 */
function extractKeywords(itemName: string): string[] {
  // Удаляем специальные символы и разбиваем на слова
  const cleanName = itemName
    .replace(/[\[\]()【】（）]/g, " ")
    .replace(/[!！?？*＊]/g, " ")
    .trim();

  const words = cleanName.split(/\s+/);

  // Фильтруем стоп-слова (числа, короткие слова)
  const stopWords = ["送料", "無料", "ポイント", "倍", "円", "税込", "セール", "新品", "中古"];

  const keywords = words.filter(word => {
    // Пропускаем короткие слова
    if (word.length < 2) return false;
    // Пропускаем числа
    if (/^\d+$/.test(word)) return false;
    // Пропускаем стоп-слова
    if (stopWords.some(stop => word.includes(stop))) return false;
    return true;
  });

  return keywords;
}
