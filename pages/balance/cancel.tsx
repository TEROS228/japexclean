// pages/balance/cancel.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BalanceCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center animate-scale-in border border-white/20">
          {/* Cancel Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-br from-gray-400 via-slate-500 to-gray-500 rounded-full flex items-center justify-center shadow-2xl">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-600 via-slate-700 to-gray-700 bg-clip-text text-transparent mb-4">
            Payment Cancelled
          </h1>

          <p className="text-2xl text-gray-600 font-medium mb-8">
            You cancelled the balance top-up process
          </p>

          {/* Info message */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <p className="text-gray-600 text-lg mb-4">
              Don't worry, no charges were made to your card.
            </p>
            <p className="text-gray-500 text-sm">
              You can try again anytime
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-gray-600 via-slate-600 to-gray-700 text-white font-bold rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg text-lg"
            >
              Try Again
            </button>

            <Link href="/" className="flex-1">
              <button className="w-full px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm text-lg hover:shadow-lg">
                Return to Home
              </button>
            </Link>
          </div>

          {/* Help section */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-gray-500 text-sm">
              Need help? <a href="#" className="text-gray-600 hover:text-gray-800 font-medium underline">Contact us</a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -20px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 20px) scale(1.05);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-blob {
          animation: blob 10s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
