// pages/_app.tsx
import type { AppProps } from "next/app";
import Script from "next/script";
import "../styles/globals.css";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { MarketplaceProvider } from "@/context/MarketplaceContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { FavouritesProvider } from "@/context/FavouritesContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "@/components/Header";
import ErrorBoundary from "@/components/ErrorBoundary";
import LeadMagnetPopup from "@/components/LeadMagnetPopup";
import { useRouter } from "next/router";
import React from "react";

import { allCategories } from "@/data/categories";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = React.useState(false);

  const noHeaderPaths = ["/checkout"];
  const showHeader = !noHeaderPaths.some((path) =>
    router.pathname.startsWith(path)
  );

  // Global route loading indicator
  React.useEffect(() => {
    const onStart = () => setRouteLoading(true);
    const onDone = () => setRouteLoading(false);
    router.events.on('routeChangeStart', onStart);
    router.events.on('routeChangeComplete', onDone);
    router.events.on('routeChangeError', onDone);
    return () => {
      router.events.off('routeChangeStart', onStart);
      router.events.off('routeChangeComplete', onDone);
      router.events.off('routeChangeError', onDone);
    };
  }, [router.events]);

  // Патчим React для игнорирования NotFoundError
  React.useEffect(() => {
    
    // Track visit (analytics)
    import('@/lib/analytics').then(({ trackVisit }) => {
      trackVisit();
    });

    // Патчим window.onerror на самом раннем этапе
    const originalWindowError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (error && (error.name === 'NotFoundError' || error.message?.includes('can not be found here'))) {
                return true; // Блокируем ошибку
      }
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error);
      }
      return false;
    };

    const handleRouteChange = (url: string) => {
          };

    const handleRouteComplete = (url: string) => {
            // Обновляем страницу после перехода чтобы получить свежие данные
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteComplete);
      window.onerror = originalWindowError;
    };
  }, [router.pathname]);

  return (
    <>
      <SessionProvider session={pageProps.session}>
        <ErrorBoundary>
          <LanguageProvider>
            <CurrencyProvider>
            <MarketplaceProvider>
              <CategoryProvider>
                <NotificationProvider>
                  <UserProvider>
                    <FavouritesProvider>
                      <CartProvider>
                        <ProductsProvider>
                        {showHeader && <Header categories={allCategories} />}

                        {/* Global route transition loader */}
                        {routeLoading && (
                          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                              <div className="relative w-16 h-16 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 animate-spin" />
                                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-emerald-300 animate-spin" style={{ animationDuration: '0.5s', animationDirection: 'reverse' }} />
                              </div>
                              <p className="text-white font-semibold text-sm">Loading...</p>
                            </div>
                          </div>
                        )}

                        <ToastContainer
                          position="top-center"
                          autoClose={2000}
                          hideProgressBar={false}
                          newestOnTop
                          closeOnClick
                          rtl={false}
                          pauseOnFocusLoss
                          draggable
                          pauseOnHover
                          theme="light"
                        />

                        <main>
                          <Component {...pageProps} />
                        </main>

                        {/* Lead Magnet Popup */}
                        <LeadMagnetPopup />
                        </ProductsProvider>
                      </CartProvider>
                    </FavouritesProvider>
                  </UserProvider>
                </NotificationProvider>
              </CategoryProvider>
            </MarketplaceProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </SessionProvider>
    </>
  );
}

export default MyApp;
