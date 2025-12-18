import type { NextApiRequest, NextApiResponse } from "next";
import { readUsers } from "@/lib/jsonDB";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = (req.query.userId as string) || "";
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const users = readUsers();
  const user = users.find((u: any) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({ balance: user.balance });
}
