import type { NextApiRequest, NextApiResponse } from "next";
import { searchRakutenProducts } from "@/lib/rakuten";
import { rankSearchResults, normalizeJapaneseQuery } from "@/lib/search-ranking";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Cache for 4 hours
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=7200');

  const { query, page } = req.query;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const pageNum = Number(page) || 1;

  try {
    // Нормализуем японский запрос
    const normalizedQuery = normalizeJapaneseQuery(query.trim());

    const products = await searchRakutenProducts(normalizedQuery, pageNum);

    // Применяем умное ранжирование только для первой страницы
    // (для остальных страниц используем стандартную сортировку API)
    const rankedProducts = pageNum === 1
      ? rankSearchResults(products, normalizedQuery)
      : products;

    console.log(`[Search API] Query: "${query}" -> "${normalizedQuery}", found ${rankedProducts.length} products`);

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
