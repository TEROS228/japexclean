import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Globe, Loader2 } from 'lucide-react';
import { type Language } from '@/lib/translator';
import { useLanguage } from '@/context/LanguageContext';

const languages = [
  { code: 'ja' as Language, name: '日本語', flag: '🇯🇵' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'th' as Language, name: 'ไทย', flag: '🇹🇭' },
  { code: 'fil' as Language, name: 'Filipino', flag: '🇵🇭' },
  { code: 'pt' as Language, name: 'Português', flag: '🇵🇹' },
];

export default function LanguageSelector() {
  const { currentLang, setLanguage, isTranslating } = useLanguage();

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="group w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white hover:border-green-500 active:border-green-500 hover:bg-green-50 active:bg-green-50 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm hover:shadow-md active:shadow-md touch-manipulation">
        {isTranslating ? (
          <Loader2 size={18} className="sm:w-5 sm:h-5 text-green-600 animate-spin" />
        ) : (
          <Globe size={18} className="sm:w-5 sm:h-5 text-gray-600 group-hover:text-green-600 group-active:text-green-600 transition-colors" />
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 sm:w-64 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 sm:p-4">
            <div className="text-center mb-3 sm:mb-4">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🌐</div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-0.5 sm:mb-1">Select Language</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">Choose your preferred language</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              {languages.map((lang) => (
                <Menu.Item key={lang.code}>
                  {({ active }) => (
                    <button
                      onClick={() => setLanguage(lang.code)}
                      disabled={isTranslating}
                      className={`
                        w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all touch-manipulation
                        ${currentLang === lang.code
                          ? 'bg-green-500 text-white shadow-md'
                          : active
                            ? 'bg-green-50 text-gray-900'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-100'
                        }
                        ${isTranslating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span className="text-xl sm:text-2xl">{lang.flag}</span>
                      <span className="font-medium text-sm sm:text-base">{lang.name}</span>
                      {currentLang === lang.code && (
                        <span className="ml-auto text-xs sm:text-sm">✓</span>
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>

            {isTranslating && (
              <div className="mt-3 sm:mt-4 text-center">
                <p className="text-[10px] sm:text-xs text-gray-500">Translating page...</p>
              </div>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
