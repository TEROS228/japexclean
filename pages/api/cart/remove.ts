import { NextApiRequest, NextApiResponse } from "next";
import { getUserData } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const user = getUserData();
    if (!user) throw new Error('You must be logged in');
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID required" });

    // TODO: Implement removeFromCart function
    res.status(200).json({ message: "Product removed from cart" });
  } catch (err: any) {
    res.status(401).json({ message: err.message || 'You must be logged in' });
  }
}
