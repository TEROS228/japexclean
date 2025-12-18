import { NextApiRequest, NextApiResponse } from "next";
import { getUserData } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const user = getUserData();
    if (!user) throw new Error('You must be logged in');
    // TODO: Implement getCart function
    res.status(200).json([]);
  } catch (err: any) {
    res.status(401).json({ message: err.message || 'You must be logged in' });
  }
}
