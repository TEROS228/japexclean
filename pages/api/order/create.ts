import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, cart, total } = req.body;

  if (!userId || !cart || !total) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Получаем пользователей из localStorage (через JSON-файл или mock)
    const registeredUsersRaw = localStorage.getItem("registeredUsers");
    const registeredUsers = registeredUsersRaw ? JSON.parse(registeredUsersRaw) : [];

    const userIndex = registeredUsers.findIndex((u: any) => u.email === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = registeredUsers[userIndex];

    if (user.balance < total) {
      return res.status(400).json({ success: false, error: "Недостаточно средств" });
    }

    // Снимаем деньги
    registeredUsers[userIndex].balance -= total;
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));

    // Тут можно добавить уведомление в Telegram о заказе

    return res.status(200).json({ success: true, newBalance: registeredUsers[userIndex].balance });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
