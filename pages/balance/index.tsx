import React from "react";
import useUserContext from "@/context/UserContext";

export default function BalancePage() {
  const { user } = useUserContext();

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Ваш баланс</h1>
      <p className="text-lg">
        Баланс: {user?.balance?.toLocaleString()} ¥
      </p>
    </div>
  );
}
