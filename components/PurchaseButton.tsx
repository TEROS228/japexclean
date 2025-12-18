"use client";
import { useState } from "react";

export default function PurchaseButton({ userId, itemId, price }: { userId: string, itemId: string, price: number }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    const res = await fetch("/api/balance/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, itemId, price })
    });
    const data = await res.json();
    alert(data.message + (data.balance ? `. Баланс: ${data.balance}` : ""));
    setLoading(false);
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="bg-blue-500 text-white p-2 rounded"
    >
      {loading ? "Оплата..." : `Купить за ${price}¥`}
    </button>
  );
}
