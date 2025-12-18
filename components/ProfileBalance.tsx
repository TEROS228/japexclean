"use client";
import { useState, useEffect } from "react";
import useUserContext from "@/context/UserContext";

export default function ProfileBalance() {
  const { user } = useUserContext();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (user?.balance !== undefined) setBalance(user.balance);
  }, [user]);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 max-w-md mx-auto mb-6 flex items-center gap-3">
      <span className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</span>
      <span className="text-gray-500">Balance</span>
    </div>
  );
}
