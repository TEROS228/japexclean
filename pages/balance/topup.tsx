import { useState } from "react";
import useUserContext from "@/context/UserContext";

export default function TopUpPage() {
  const [amount, setAmount] = useState(5000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const presetAmounts = [1000, 3000, 5000, 10000, 20000];

  const handleTopUp = async () => {
    if (amount < 1000) {
      setError("Minimum amount is ¥1,000");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/balance/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(amount) }), // JPY as whole number
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
            Top Up Balance
          </h1>
          <p className="text-gray-600 text-lg">
            Choose an amount or enter your own
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          {/* Preset amounts */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4 text-lg">
              Quick Amount Selection:
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                    amount === preset
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  ¥{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount input */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-4 text-lg">
              Or enter your own amount:
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-3xl font-bold text-gray-400">
                ¥
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setError("");
                }}
                min="1000"
                step="100"
                className="w-full pl-16 pr-6 py-5 text-3xl font-bold border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                placeholder="5000"
              />
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Minimum amount: ¥1,000
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-medium">Amount to add:</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ¥{amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Stripe fee (~3%):</span>
              <span>~¥{Math.round(amount * 0.03).toLocaleString()}</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleTopUp}
            disabled={isLoading || amount < 1000}
            className={`w-full px-8 py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-lg ${
              isLoading || amount < 1000
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:shadow-2xl hover:scale-105 active:scale-95"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              "Top Up via Stripe"
            )}
          </button>

          {/* Info */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3 text-sm text-gray-500">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p>
                Secure payment via Stripe. Your data is protected and not stored on our server.
                Your balance will be updated automatically after successful payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
