import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { translatePage, type Language } from '@/lib/translator';

interface LanguageContextType {
  currentLang: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLang, setCurrentLang] = useState<Language>('ja');
  const [isTranslating, setIsTranslating] = useState(false);
  const router = useRouter();

  // Загружаем сохраненный язык при инициализации
  useEffect(() => {
    const saved = localStorage.getItem('selected_language');
    const validLanguages: Language[] = ['ja', 'en', 'es', 'de', 'th', 'fil', 'pt'];
    if (saved && validLanguages.includes(saved as Language)) {
      setCurrentLang(saved as Language);
      if (saved !== 'ja') {
        // Автоматически переводим страницу при загрузке (без задержки)
        translatePage(saved as Language);
      }
    }
  }, []);

  // Переводим страницу при переходах между роутами
  useEffect(() => {
    if (currentLang !== 'ja') {
      // Небольшая задержка чтобы новый контент успел отрендериться
      const timer = setTimeout(() => {
        translatePage(currentLang);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [router.asPath, currentLang]);

  const setLanguage = async (lang: Language) => {
    if (lang === currentLang || isTranslating) return;

    setIsTranslating(true);
    setCurrentLang(lang);
    localStorage.setItem('selected_language', lang);

    // Переводим страницу без перезагрузки
    await translatePage(lang);
    setIsTranslating(false);
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
