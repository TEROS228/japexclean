import { NextApiRequest, NextApiResponse } from "next";
import { getProductById, getProductVariants } from "@/lib/rakuten";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { itemCode } = req.query;
  if (typeof itemCode !== "string") return res.status(400).json({ error: "Invalid itemCode" });

  // Cache for 4 hours
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=7200');

  try {
    const product = await getProductById(itemCode);
    const variants = await getProductVariants(itemCode);
    res.status(200).json({ product, variants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
