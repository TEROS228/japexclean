"use client";
import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";

interface CartBalanceProps {
  balance: number;
  loading: boolean;
  onTopUp: () => void;
}

export default function CartBalance({ balance, loading, onTopUp }: CartBalanceProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-5 flex items-center justify-between max-w-md mx-auto mb-6">
      <div className="flex items-center gap-4">
        <Wallet className="w-8 h-8 text-green-500" />
        <div>
          <span className="block text-gray-500 text-sm">Your Balance</span>
          <span className="text-2xl font-bold text-green-600">
            {loading ? "..." : `¥${balance.toLocaleString("en-US")}`}
          </span>
        </div>
      </div>
      <button
        onClick={onTopUp}
        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-xl transition-transform transform hover:scale-105"
      >
        Пополнить
      </button>
    </div>
  );
}
