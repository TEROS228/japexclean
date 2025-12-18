import { NextApiRequest, NextApiResponse } from "next";
import { readUsers, writeUsers } from "@/lib/jsonDB";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, itemId, price } = req.body;

  const users = readUsers();
  const user = users.find((u: any) => u.id === userId);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });

  if (user.balance < price) return res.status(400).json({ error: "Недостаточно средств" });

  user.balance -= price;
  user.transactions.push({ type: "purchase", itemId, amount: price, date: new Date().toISOString() });

  writeUsers(users);
  res.status(200).json({ message: "Товар оплачен", balance: user.balance });
}
