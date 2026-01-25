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

  const noHeaderPaths = ["/checkout", "/product/"];
  const showHeader = !noHeaderPaths.some((path) =>
    router.pathname.startsWith(path)
  );

  // Патчим React для игнорирования NotFoundError
  React.useEffect(() => {
    console.log('[_app] Component mounted, pathname:', router.pathname);

    // Track visit (analytics)
    import('@/lib/analytics').then(({ trackVisit }) => {
      trackVisit();
    });

    // Патчим window.onerror на самом раннем этапе
    const originalWindowError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (error && (error.name === 'NotFoundError' || error.message?.includes('can not be found here'))) {
        console.debug('[window.onerror] Blocked NotFoundError');
        return true; // Блокируем ошибку
      }
      if (originalWindowError) {
        return originalWindowError(message, source, lineno, colno, error);
      }
      return false;
    };

    const handleRouteChange = (url: string) => {
      console.log('[_app] Route changing to:', url);
    };

    const handleRouteComplete = (url: string) => {
      console.log('[_app] Route changed to:', url);
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
