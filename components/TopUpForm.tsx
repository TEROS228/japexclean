"use client";
import { useState } from "react";

export default function TopUpForm({ userId }: { userId: string }) {
  const [amount, setAmount] = useState(0);

  const handleTopUp = async () => {
    if (amount <= 0) {
      alert("Введите сумму больше 0");
      return;
    }

    // Здесь в будущем будет интеграция с платёжкой
    const res = await fetch("/api/balance/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount })
    });

    const data = await res.json();
    alert(`${data.message}. Новый баланс: ${data.balance}`);
  };

  return (
    <div className="p-4 border rounded w-64">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Сумма пополнения"
        className="border p-2 mb-2 w-full"
      />
      <button
        onClick={handleTopUp}
        className="bg-green-500 text-white p-2 rounded w-full"
      >
        Пополнить
      </button>
    </div>
  );
}
