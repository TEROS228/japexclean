"use client";
import { useState, useEffect } from "react";
import { getAuthToken, getUserData } from "@/lib/auth";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopUpSuccess: (amount: number) => void;
}

export default function TopUpModal({ isOpen, onClose, onTopUpSuccess }: TopUpModalProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [displayAmount, setDisplayAmount] = useState<string>("1 000");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<"stripe" | "paypal" | "bank" | null>("stripe");

  // Hide header when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const header = document.querySelector('header');
    if (header) {
      header.style.display = 'none';
    }

    return () => {
      if (header) {
        header.style.display = '';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleAmountChange = (value: string) => {
    // Удаляем все нецифровые символы
    const numericValue = value.replace(/\D/g, '');
    const num = parseInt(numericValue) || 0;
    setAmount(num);
    setDisplayAmount(formatNumber(num));
  };

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setDisplayAmount(formatNumber(preset));
  };

  const handleStripePayment = async () => {
    if (!amount) {
      alert("Введите сумму для пополнения");
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      const userData = getUserData();

      if (!token || !userData) {
        alert("Пожалуйста, войдите в систему");
        return;
      }

      // Создаем сессию Stripe Checkout (без авторизации для разработки)
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Временно убираем авторизацию для разработки
          // "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          userEmail: userData.email,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cart`
        }),
      });

      const data = await res.json();

      if (data.sessionId && data.url) {
        // Перенаправляем на Stripe Checkout
        window.location.href = data.url;
      } else {
        alert("Ошибка при создании платежа: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Stripe payment error:", err);
      alert("Ошибка при обработке платежа");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!amount || !method) {
      alert("Введите сумму и выберите способ оплаты");
      return;
    }

    if (method === "stripe") {
      await handleStripePayment();
      return;
    }

    // Для других методов оплаты (если нужно)
    setLoading(true);
    try {
      const token = getAuthToken();
      
      const res = await fetch("/api/balance/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount, 
          description: `Top-up via ${method}` 
        }),
      });

      const data = await res.json();

      if (data.success) {
        onTopUpSuccess(amount);
        onClose();
      } else {
        alert("Ошибка: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при оплате");
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = [1000, 3000, 5000, 10000, 20000];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Пополнить баланс</h2>

        {/* Быстрый выбор суммы */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                amount === preset
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ¥{preset.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount(0)}
            className="py-2 px-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 col-span-3"
          >
            Другая сумма
          </button>
        </div>

        {/* Ввод суммы */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Сумма в ¥</label>
          <input
            type="text"
            value={displayAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            placeholder="Введите сумму"
          />
        </div>

        {/* Выбор способа оплаты */}
        <div className="flex gap-4 mb-6">
          <div
            className={`flex-1 border rounded-xl p-4 text-center cursor-pointer transition transform hover:scale-105
              ${method === "stripe" ? "border-green-500 shadow-md bg-green-50" : "border-gray-300"}`}
            onClick={() => setMethod("stripe")}
          >
            <div className="w-10 h-10 mx-auto mb-2 bg-[#635bff] rounded flex items-center justify-center text-white font-bold">
              S
            </div>
            Stripe
          </div>
          <div
            className={`flex-1 border rounded-xl p-4 text-center cursor-pointer transition transform hover:scale-105 opacity-50
              ${method === "paypal" ? "border-blue-500 shadow-md" : "border-gray-300"}`}
            onClick={() => alert("PayPal скоро будет доступен")}
          >
            <div className="w-10 h-10 mx-auto mb-2 bg-[#003087] rounded flex items-center justify-center text-white font-bold">
              P
            </div>
            PayPal
          </div>
          <div
            className={`flex-1 border rounded-xl p-4 text-center cursor-pointer transition transform hover:scale-105 opacity-50
              ${method === "bank" ? "border-yellow-500 shadow-md" : "border-gray-300"}`}
            onClick={() => alert("Bank transfer скоро будет доступен")}
          >
            <div className="w-10 h-10 mx-auto mb-2 bg-yellow-500 rounded flex items-center justify-center text-white">
              🏦
            </div>
            Bank
          </div>
        </div>

        {/* Информация о комиссии */}
        {method === "stripe" && amount > 0 && (
          <div className="mb-6 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            <p>К оплате: <strong>¥{(amount * 1.036).toLocaleString()}</strong></p>
            <p className="text-xs">Включая комиссию 3.6%</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading || !amount || !method}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-md transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Обработка..." : `Пополнить ¥${amount.toLocaleString()}`}
        </button>

        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-500 hover:text-gray-700 transition py-2"
          disabled={loading}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}