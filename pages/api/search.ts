import type { NextApiRequest, NextApiResponse } from "next";
import { searchRakutenProducts } from "@/lib/rakuten";
import { rankSearchResults, normalizeJapaneseQuery } from "@/lib/search-ranking";
import { filterIrrelevantProducts, intelligentRanking } from "@/lib/search-intelligence";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Cache for 4 hours
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=7200');

  const { query, page, minPrice, maxPrice } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const pageNum = Number(page) || 1;
  const min = minPrice ? Number(minPrice) : undefined;
  const max = maxPrice ? Number(maxPrice) : undefined;

  try {
    // Нормализуем японский запрос
    const normalizedQuery = normalizeJapaneseQuery(query.trim());

    const products = await searchRakutenProducts(normalizedQuery, pageNum, 30, min, max);

    // Debug logs отключены для производительности
    // console.log(`[Search API] Query: "${query}" -> "${normalizedQuery}", found ${products.length} products from Rakuten API`);

    // Применяем только умное ранжирование для первой страницы, БЕЗ фильтрации
    const rankedProducts = pageNum === 1
      ? intelligentRanking(products, normalizedQuery)
      : products;

    // console.log(`[Search API] Returning ${rankedProducts.length} products`);

    return res.status(200).json({
      success: true,
      products: rankedProducts,
      count: rankedProducts.length,
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return res.status(500).json({
      error: "Failed to search products",
      message: error.message,
    });
  }
}
