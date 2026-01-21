import { useState, useEffect } from 'react';
import useUser from '@/context/UserContext';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function LeadMagnetPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [fingerprint, setFingerprint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, refreshUser } = useUser();

  // Слушатель для ручного открытия popup
  useEffect(() => {
    const handleOpenPopup = () => {
      localStorage.removeItem('leadMagnetShown');
      setIsVisible(true);
    };

    window.addEventListener('openLeadMagnet', handleOpenPopup);
    return () => window.removeEventListener('openLeadMagnet', handleOpenPopup);
  }, []);

  useEffect(() => {
    // Не показываем если пользователь уже залогинен
    if (user) return;

    // Генерируем browser fingerprint и проверяем не получал ли он бонус
    const checkEligibilityAndShow = async () => {
      // Используем extendedResult для более строгого fingerprinting
      const fp = await FingerprintJS.load();
      const result = await fp.get({
        // Включаем дополнительные компоненты для более точного fingerprint
        extendedResult: true
      });
      const visitorId = result.visitorId;

      // Логируем confidence score для мониторинга
      console.log(`[Fingerprint] ID: ${visitorId.substring(0, 8)}..., Confidence: ${result.confidence?.score || 'N/A'}`);

      setFingerprint(visitorId);

      // Проверяем на сервере не получал ли этот браузер/IP уже бонус
      try {
        const response = await fetch('/api/check-bonus-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: visitorId }),
        });

        const data = await response.json();

        // Если браузер/IP уже получил бонус, не показываем popup
        if (!data.eligible) {
          return;
        }

        // Показываем popup через 3 секунды каждый раз при заходе на главную
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('[LeadMagnet] Error checking eligibility:', error);
        // В случае ошибки показываем popup (fail-open)
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    };

    checkEligibilityAndShow();
  }, [user]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Переходим к вводу кода
      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          secondName,
          email,
          password,
          code,
          fingerprint,
          marketingConsent
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(true);

      // Если пользователь создан и залогинен, обновляем данные
      if (data.token) {
        localStorage.setItem('token', data.token);
        await refreshUser();

        // Перенаправляем в профиль на вкладку Coupons через 2 секунды
        setTimeout(() => {
          window.location.href = '/profile?tab=coupons';
        }, 2000);
      } else {
        // Если нет токена, просто закрываем через 3 секунды
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRegister = () => {
    setStep('register');
    setCode('');
    setError('');
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <style jsx>{`
        @keyframes floatIn {
          from {
            transform: translateY(20px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes glow {
          to { transform: rotate(360deg); }
        }

        .popup-card {
          animation: floatIn 0.5s ease;
          background: linear-gradient(180deg, #ffffff, #f8fafc);
          position: relative;
          overflow: hidden;
        }

        .popup-card::before {
          content: "";
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle, rgba(34,197,94,0.18), transparent 60%);
          animation: glow 6s linear infinite;
          pointer-events: none;
        }

        .input-wrapper {
          background: #f1f5f9;
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.25s;
        }

        .input-wrapper:focus-within {
          border-color: #22c55e;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.2);
        }

        .gradient-text {
          background: linear-gradient(90deg, #16a34a, #22c55e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .claim-btn {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }

        .claim-btn:hover:not(:disabled) {
          box-shadow: 0 12px 30px rgba(34,197,94,0.45);
        }

        .claim-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .claim-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Custom Checkbox Styles */
        .custom-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 13px;
          color: #064e3b;
          user-select: none;
        }

        .custom-checkbox input {
          display: none;
        }

        .checkbox-box {
          width: 22px;
          height: 22px;
          min-width: 22px;
          border-radius: 6px;
          border: 1.8px solid #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            background .25s ease,
            box-shadow .25s ease,
            transform .2s ease;
        }

        .checkbox-check {
          width: 14px;
          height: 10px;
          stroke: white;
          stroke-width: 2.2;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          transition: stroke-dashoffset .3s ease;
        }

        .custom-checkbox input:checked + .checkbox-box {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: transparent;
          box-shadow: 0 0 0 4px rgba(34,197,94,.18);
        }

        .custom-checkbox input:checked + .checkbox-box .checkbox-check {
          stroke-dashoffset: 0;
        }

        .custom-checkbox:hover .checkbox-box {
          box-shadow: 0 0 0 3px rgba(34,197,94,.12);
        }

        .custom-checkbox:active .checkbox-box {
          transform: scale(.94);
        }
      `}</style>

      <div
        className="popup-card relative rounded-[26px] shadow-[0_30px_80px_rgba(34,197,94,0.25),inset_0_1px_rgba(255,255,255,0.7)] max-w-[360px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-7 relative z-[2] text-center">
          {!success ? (
            <>
              {step === 'register' ? (
                <>
                  <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-400 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-3.5">
                    🎉 Welcome Bonus
                  </div>

                  <h1 className="text-[28px] font-bold text-emerald-950 mb-4.5">
                    Get ¥500 OFF instantly
                  </h1>

                  <form onSubmit={handleRegisterSubmit} className="mt-1.5 space-y-3">
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First name"
                    required
                    className="w-full border-none outline-none bg-transparent text-[15px]"
                  />
                </div>

                <div className="input-wrapper">
                  <input
                    type="text"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    placeholder="Last name"
                    required
                    className="w-full border-none outline-none bg-transparent text-[15px]"
                  />
                </div>

                <div className="input-wrapper">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full border-none outline-none bg-transparent text-[15px]"
                  />
                </div>

                    <div className="input-wrapper">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password (min 8 characters)"
                        required
                        minLength={8}
                        className="w-full border-none outline-none bg-transparent text-[15px]"
                      />
                    </div>

                    {/* Marketing consent checkbox */}
                    <label className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                      />
                      <span className="checkbox-box">
                        <svg className="checkbox-check" viewBox="0 0 16 12">
                          <path d="M1.5 6.5 L6.2 10.5 L14.5 1.5" />
                        </svg>
                      </span>
                      <span className="text-xs text-slate-600">
                        I agree to receive marketing emails and promotional offers from Japrix
                      </span>
                    </label>

                    {error && (
                      <div className="mt-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="claim-btn mt-4.5 w-full py-[15px] rounded-2xl border-none text-white text-[15px] font-semibold cursor-pointer"
                    >
                      {loading ? 'Sending code...' : 'Continue'}
                    </button>
                  </form>

                  <div className="mt-3.5 text-xs text-slate-500">
                    We'll send you a verification code
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-400 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-3.5">
                    📧 Verify Email
                  </div>

                  <h1 className="text-[22px] font-bold text-emerald-950 mb-2">
                    Enter Verification Code
                  </h1>
                  <p className="text-sm text-slate-600 mb-1">
                    We sent a 6-digit code to
                  </p>
                  <p className="text-sm font-semibold text-emerald-700 mb-4">
                    {email}
                  </p>

                  <form onSubmit={handleVerifySubmit} className="space-y-3">
                    <div className="input-wrapper">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        required
                        maxLength={6}
                        className="w-full border-none outline-none bg-transparent text-center text-2xl font-mono tracking-widest"
                      />
                    </div>

                    {/* Marketing consent checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer text-left">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-xs text-slate-600">
                        I agree to receive marketing emails and promotional offers from Japrix
                      </span>
                    </label>

                    {error && (
                      <div className="mt-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || code.length !== 6}
                      className="claim-btn mt-4.5 w-full py-[15px] rounded-2xl border-none text-white text-[15px] font-semibold cursor-pointer"
                    >
                      {loading ? 'Verifying...' : 'Claim ¥500 Bonus'}
                    </button>

                    <button
                      type="button"
                      onClick={handleBackToRegister}
                      className="w-full text-slate-600 hover:text-slate-800 text-sm py-2 transition-colors"
                    >
                      ← Change details
                    </button>
                  </form>

                  <div className="mt-3.5 text-xs text-slate-500">
                    Code expires in 10 minutes
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="py-8">
              <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-400 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-3.5">
                ✅ Success!
              </div>

              <h1 className="text-[22px] font-bold text-emerald-950 mb-2.5">
                Welcome Coupon Received!
              </h1>
              <div className="gradient-text text-[26px] font-extrabold mb-2">
                ¥500 OFF
              </div>
              <p className="text-sm text-slate-600">
                on orders over ¥3,000
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Check your coupons and start shopping! 🎉
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
