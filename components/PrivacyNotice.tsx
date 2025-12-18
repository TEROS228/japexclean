// components/PrivacyNotice.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function PrivacyNotice() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Показываем уведомление только на главной странице и если пользователь еще не видел
    if (pathname === '/' && !localStorage.getItem('privacyNoticeSeen')) {
      setShow(true);
    }
  }, [pathname]);

  const handleAccept = () => {
    setShow(false);
    localStorage.setItem('privacyNoticeSeen', 'true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-end sm:items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl shadow-2xl p-8 max-w-2xl w-full relative overflow-hidden"
          >
            {/* Decorative gradient orbs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl -z-0"></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Cookie Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.05.01-.1.01-.15 2.6-.98 4.68-2.99 5.74-5.55C11.58 8.56 14.37 10 17.5 10c.17 0 .33-.01.5-.02C17.98 10.64 18 11.31 18 12c0 4.41-3.59 8-8 8z"/>
                    <circle cx="8" cy="14" r="1.5"/>
                    <circle cx="12" cy="8" r="1.5"/>
                    <circle cx="15" cy="15" r="1.5"/>
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Privacy & Cookies Notice
              </h2>

              {/* Description */}
              <p className="text-gray-700 text-base leading-relaxed mb-8 text-center">
                We collect information such as your <span className="font-semibold text-gray-900">name</span>, <span className="font-semibold text-gray-900">email</span>, and <span className="font-semibold text-gray-900">browsing data</span> to improve your experience.
                We also use cookies to provide better functionality and analytics.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleAccept}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Accept & Continue
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <Link href="/privacy-policy">
                  <button
                    onClick={handleAccept}
                    className="px-8 py-4 bg-white/80 backdrop-blur text-gray-700 font-semibold rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
                  >
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
