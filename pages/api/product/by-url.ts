import type { NextApiRequest, NextApiResponse } from "next";
import { getProductByUrl } from "@/lib/rakuten";

// Простой кэш для ускорения повторных запросов
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 10; // 10 минут

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  // Проверяем кэш
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const rakutenProduct = await getProductByUrl(url);

    if (rakutenProduct && rakutenProduct.itemCode) {
      const response = {
        success: true,
        product: rakutenProduct,
      };

      cache.set(url, { data: response, timestamp: Date.now() });
      return res.status(200).json(response);
    }

    // Если не нашли - возвращаем инструкцию

    return res.status(404).json({
      error: "Product not found",
      message: "This product URL could not be found in Rakuten API. Please copy the full product name from the page and use the search function instead.",
      instruction: {
        en: "Copy the full product name from the Rakuten page and paste it into the search bar to find this product.",
        ru: "Скопируйте полное название товара со страницы Rakuten и вставьте в поиск, чтобы найти этот товар.",
        ja: "楽天ページから商品名をコピーして、検索バーに貼り付けてください。"
      },
      searchSuggestion: true
    });
  } catch (error: any) {
    console.error("Error fetching product by URL:", error);
    return res.status(500).json({
      error: "Failed to fetch product",
      message: error.message,
    });
  }
}
