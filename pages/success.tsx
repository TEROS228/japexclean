// success.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAuthToken, updateUserBalance } from '@/lib/auth'; // ← Исправленный импорт

// Confetti component
const Confetti = () => {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function SuccessPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Предотвращаем повторную обработку
    if (hasProcessed) {
      console.log('⚠️ Payment already processed, skipping...');
      return;
    }

    const processPayment = async () => {
      const query = new URLSearchParams(window.location.search);
      const sessionId = query.get('session_id');

      if (!sessionId) {
        window.location.href = '/cart?topup=error';
        return;
      }

      const token = getAuthToken(); // ← Теперь будет работать!
      if (!token) {
        window.location.href = '/auth';
        return;
      }

      // Проверяем, не был ли этот session_id уже обработан
      const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '[]');
      if (processedSessions.includes(sessionId)) {
        console.log('✅ This session was already processed, showing success screen');
        setSuccess(true);
        setProcessing(false);
        setHasProcessed(true);
        return;
      }

      try {
        console.log('Processing payment with session:', sessionId);
        setHasProcessed(true);
        
        // 1. Проверяем платеж
        const verifyResponse = await fetch(`/api/balance/verify?session_id=${sessionId}`);
        if (!verifyResponse.ok) throw new Error(`Verify failed: ${verifyResponse.status}`);
        
        const verifyData = await verifyResponse.json();
        console.log('Verification result:', verifyData);

        if (!verifyData.paid || !verifyData.amountAfterFee) {
          throw new Error(verifyData.error || 'Payment not completed');
        }

        // 2. Обновляем баланс
        const updateResponse = await fetch('/api/balance/update', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            amount: verifyData.amountAfterFee,
            description: 'Stripe top up',
            sessionId: sessionId
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'Balance update failed');
        }

        const updateData = await updateResponse.json();
        console.log('Balance updated successfully:', updateData.newBalance);

        // 3. Обновляем localStorage
        updateUserBalance(updateData.newBalance); // ← Исправленная функция!

        // 4. Отправляем событие
        window.dispatchEvent(new Event('balanceUpdated'));

        // 5. Сохраняем session_id как обработанный
        const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '[]');
        processedSessions.push(sessionId);
        localStorage.setItem('processedSessions', JSON.stringify(processedSessions));

        // 6. Показываем успех вместо редиректа
        console.log('✅ Payment completed successfully - showing success screen (no redirect)');
        setAmount(verifyData.amountAfterFee);
        setNewBalance(updateData.newBalance);
        setSuccess(true);
        setProcessing(false);

        // Запускаем конфетти с небольшой задержкой
        setTimeout(() => setShowConfetti(true), 300);

        // Отправляем событие конверсии только один раз
        const conversionSent = localStorage.getItem(`conversion_sent_${sessionId}`);
        if (!conversionSent) {
          // Отправка события конверсии в Google Analytics / Meta Pixel / etc
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'purchase', {
              transaction_id: sessionId,
              value: verifyData.amountAfterFee,
              currency: 'JPY',
              send_to: 'conversion'
            });
          }

          // Отмечаем что конверсия отправлена
          localStorage.setItem(`conversion_sent_${sessionId}`, 'true');
        }

      } catch (error: any) {
        console.error('Payment processing error:', error);
        setHasProcessed(false); // Сбрасываем флаг при ошибке
        window.location.href = '/cart?topup=error';
      }
    };

    processPayment();
  }, [hasProcessed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {showConfetti && <Confetti />}

      <div className="max-w-2xl w-full relative z-10">
        {processing ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center animate-fade-in border border-white/20">
            {/* Animated Loading Spinner */}
            <div className="mb-8 flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-green-500 border-r-green-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-t-emerald-400 border-r-emerald-400 rounded-full animate-spin-slow"></div>
              </div>
            </div>

            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Processing Payment
            </h2>
            <p className="text-gray-600 text-lg">
              Please wait while we confirm your transaction...
            </p>

            {/* Animated dots */}
            <div className="flex justify-center gap-3 mt-8">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        ) : success ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center animate-scale-in border border-white/20">
            {/* Success Checkmark Animation */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center animate-bounce-once shadow-2xl">
                  <svg
                    className="w-16 h-16 text-white animate-check-draw"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4 animate-text-reveal">
              Thank You!
            </h1>

            <p className="text-2xl text-gray-700 font-medium mb-2">
              Your payment was successful
            </p>

            <p className="text-gray-500 mb-8">
              Your balance has been updated and is ready to use
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/cart" className="flex-1">
                <button className="w-full px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg text-lg relative overflow-hidden group">
                  <span className="relative z-10">Go to Cart</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </Link>

              <Link href="/" className="flex-1">
                <button className="w-full px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm text-lg hover:shadow-lg">
                  Continue Shopping
                </button>
              </Link>
            </div>

            {/* Additional info */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-gray-500 text-sm">
                Receipt sent to your email • Questions? <a href="#" className="text-green-600 hover:text-green-700 font-medium">Contact us</a>
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(0.95);
          }
          50% {
            transform: scale(1.15);
          }
          75% {
            transform: scale(0.98);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
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

        @keyframes check-draw {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }

        @keyframes text-reveal {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-bounce-once {
          animation: bounce-once 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-confetti {
          animation: confetti linear forwards;
        }

        .animate-blob {
          animation: blob 10s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-check-draw {
          animation: check-draw 0.6s ease-out 0.2s forwards;
        }

        .animate-text-reveal {
          animation: text-reveal 0.8s ease-out 0.3s both;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}