"use client";

import { useState, useEffect } from "react";

export default function TranslateWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("ja");
  const [mounted, setMounted] = useState(false);

  const languages = [
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "th", name: "ไทย", flag: "🇹🇭" },
  ];

  useEffect(() => {
    setMounted(true);
    // Проверяем сохраненный язык
    const savedLang = localStorage.getItem("selectedLang") || "ja";
    setCurrentLang(savedLang);

    // Don't auto-translate on mount to avoid infinite reload
  }, []);

  const translatePage = async (targetLang: string) => {
    if (targetLang === "ja") {
      // Reload page to restore original Japanese text
      window.location.href = window.location.href;
      return;
    }

    // For now, just show a message that translation is selected
    // Full translation implementation would require more complex setup
    console.log(`Translation to ${targetLang} selected`);
  };

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem("selectedLang", langCode);
    translatePage(langCode);
    setIsOpen(false);
  };

  if (!mounted) return null;

  const currentLanguage = languages.find(l => l.code === currentLang);

  return (
    <div className="fixed top-3 right-3 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <span className="text-xl">{currentLanguage?.flag}</span>
          <span className="font-semibold text-gray-700 group-hover:text-green-700 text-sm">
            {currentLanguage?.code.toUpperCase()}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 group-hover:text-green-600 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-14 right-0 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn min-w-[160px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-0 ${
                  currentLang === lang.code
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLang === lang.code && (
                  <svg className="w-4 h-4 ml-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
}
