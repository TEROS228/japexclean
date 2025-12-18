import type { NextApiRequest, NextApiResponse } from "next";
import { getProductsByGenreId } from "@/lib/rakuten";
import { rateLimit } from "@/lib/rate-limit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting: 60 requests per minute
  if (!rateLimit(req, res, { interval: 60000, limit: 60 })) return;

  // Cache for 4 hours
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=7200');

  const { genreId, page, sort } = req.query;

  console.log("API /api/products called with", { genreId, page, sort });

  try {
    if (!genreId) return res.status(400).json({ error: "Missing genreId parameter" });

    const genreIdNum = Number(genreId);
    if (isNaN(genreIdNum)) return res.status(400).json({ error: "Invalid genreId parameter" });

    const pageNum = Number(page) || 1;
    if (page && isNaN(pageNum)) return res.status(400).json({ error: "Invalid page parameter" });

    const sortParam = typeof sort === "string" ? sort : "";

    console.log(`Fetching products for genreId ${genreIdNum}, page ${pageNum}, sort=${sortParam}`);

    const products = await getProductsByGenreId(genreIdNum, pageNum, sortParam);

    if (!Array.isArray(products)) {
      console.error("Error: products is not an array:", products);
      return res.status(500).json({ error: "Invalid products format" });
    }

    console.log(`Products fetched: ${products.length} items`);
    res.status(200).json(products);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
