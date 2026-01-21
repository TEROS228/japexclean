"use client";

import { useState, useEffect } from "react";
import { saveAuthData } from "@/lib/auth";
import { signIn, useSession } from "next-auth/react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useRouter } from "next/router";
import useUserContext from "@/context/UserContext";

export default function SignUpModal({
  isOpen,
  onClose,
  onSwitchToLogin
}: {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}) {
  const [name, setName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [fingerprint, setFingerprint] = useState("");
  const { data: session, status } = useSession();
  const [wasAuthenticating, setWasAuthenticating] = useState(false);
  const router = useRouter();
  const { refreshUser } = useUserContext();

  // Генерируем fingerprint при открытии модалки
  useEffect(() => {
    if (isOpen && !fingerprint) {
      const generateFingerprint = async () => {
        // Используем extendedResult для более строгого fingerprinting
        const fp = await FingerprintJS.load();
        const result = await fp.get({
          // Включаем дополнительные компоненты для более точного fingerprint
          extendedResult: true
        });

        // Логируем confidence score для мониторинга
        console.log(`[Fingerprint] ID: ${result.visitorId.substring(0, 8)}..., Confidence: ${result.confidence?.score || 'N/A'}`);

        setFingerprint(result.visitorId);
      };
      generateFingerprint();
    }
  }, [isOpen, fingerprint]);

  // Сбрасываем флаг когда модальное окно закрывается
  useEffect(() => {
    if (!isOpen) {
      setWasAuthenticating(false);
      setStep('register');
      setCode('');
      setError('');
    }
  }, [isOpen]);

  // Закрываем модальное окно только после НОВОЙ авторизации через Google
  useEffect(() => {
    if (status === "authenticated" && wasAuthenticating && isOpen) {
      setTimeout(() => {
        onClose();
        setWasAuthenticating(false);
      }, 500);
    }
  }, [status, wasAuthenticating, isOpen, onClose]);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !secondName || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    // Валидация пароля на frontend
    if (password.length < 5) {
      setError("Password must be at least 5 characters long");
      return;
    }

    if (!/\d/.test(password)) {
      setError("Password must contain at least 1 number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Отправляем код верификации на email
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Переходим к вводу кода
      setStep('verify');
    } catch (err: any) {
      setError(err.message || "Error sending verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup-with-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, secondName, email, password, code, marketingConsent, fingerprint }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      if (data.token && data.user) {
        console.log('[SignUp] Signup successful, saving auth data and redirecting...');

        // Сохраняем данные в localStorage
        saveAuthData(data.token, data.user);

        console.log('[SignUp] Auth data saved, token:', data.token.substring(0, 20) + '...');
        console.log('[SignUp] User data:', data.user);

        // Закрываем модалку
        onClose();

        // Немедленно перенаправляем на профиль
        console.log('[SignUp] Redirecting to /profile?tab=coupons');
        window.location.href = '/profile?tab=coupons';
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (err: any) {
      setError(err.message || "Error during signup");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRegister = () => {
    setStep('register');
    setCode('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all animate-scaleIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'register' ? 'Create Account' : 'Verify Email'}
          </h2>
          <p className="text-gray-600">
            {step === 'register' ? 'Join Japrix and start shopping' : `Code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {step === 'register' ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">First Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="John"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Second Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Last Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Doe"
                value={secondName}
                onChange={(e) => setSecondName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {/* Password requirements hint */}
            <div className="mt-2 space-y-1">
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                password.length >= 5 ? 'text-green-600' : 'text-gray-500'
              }`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  {password.length >= 5 ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <span className="font-medium">At least 5 characters</span>
              </div>
              <div className={`flex items-center gap-2 text-xs transition-colors ${
                /\d/.test(password) ? 'text-green-600' : 'text-gray-500'
              }`}>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  {/\d/.test(password) ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                <span className="font-medium">At least 1 number</span>
              </div>
            </div>
          </div>

          {/* Marketing consent checkbox */}
          <label className="custom-checkbox flex items-center gap-3 cursor-pointer user-select-none">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="hidden"
            />
            <span className="checkbox-box flex items-center justify-center w-[22px] h-[22px] min-w-[22px] border-[1.8px] border-[#22c55e] rounded-md transition-all duration-250">
              <svg className="checkbox-check w-[14px] h-[10px] stroke-white stroke-[2.2] fill-none" style={{strokeLinecap: 'round', strokeLinejoin: 'round', strokeDasharray: 20, strokeDashoffset: marketingConsent ? 0 : 20, transition: 'stroke-dashoffset 0.3s ease'}} viewBox="0 0 16 12">
                <path d="M1.5 6.5 L6.2 10.5 L14.5 1.5" />
              </svg>
            </span>
            <span className="text-xs text-slate-600">
              I agree to receive marketing emails and promotional offers from Japrix
            </span>
          </label>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="group flex-1 relative px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none overflow-hidden hover:scale-105 active:scale-95"
              disabled={loading}
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending code...
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={async () => {
              try {
                setWasAuthenticating(true); // Устанавливаем флаг перед началом авторизации
                await signIn("google", {
                  callbackUrl: `${window.location.origin}/profile?tab=coupons`,
                  redirect: true
                });
              } catch (error) {
                console.error('[SignUpModal] Sign in error:', error);
                setWasAuthenticating(false);
              }
            }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </form>
        ) : (
        <form onSubmit={handleVerifySubmit} className="space-y-5">
          {/* Verification Code */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 text-center">Enter 6-Digit Code</label>
            <div className="relative">
              <input
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">Code expires in 10 minutes</p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="group relative px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none overflow-hidden hover:scale-105 active:scale-95"
              disabled={loading || code.length !== 6}
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </span>
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToRegister}
                className="flex-1 px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        /* Custom Checkbox Styles */
        .custom-checkbox input:checked + .checkbox-box {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: transparent;
          box-shadow: 0 0 0 4px rgba(34,197,94,.18);
        }

        .custom-checkbox:hover .checkbox-box {
          box-shadow: 0 0 0 3px rgba(34,197,94,.12);
        }

        .custom-checkbox:active .checkbox-box {
          transform: scale(.94);
        }
      `}</style>
    </div>
  );
}
