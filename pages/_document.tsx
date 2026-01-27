import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <meta httpEquiv="content-language" content="ja" />

        {/* Подавляем ВСЕ ошибки от переводчика ДО загрузки React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Полная блокировка ВСЕХ ошибок от Google Translate
                const isTranslateError = (error) => {
                  if (!error) return false;
                  const msg = error.message || error.toString();
                  return (
                    error.name === 'NotFoundError' ||
                    msg.includes('can not be found') ||
                    msg.includes('removeChild') ||
                    msg.includes('not a child') ||
                    msg.includes('Text')
                  );
                };

                // Блокируем console.error
                const origError = console.error;
                console.error = function(...args) {
                  const str = args.join(' ');
                  if (str.includes('NotFoundError') ||
                      str.includes('removeChild') ||
                      str.includes('Text') ||
                      str.includes('can not be found')) {
                    return;
                  }
                  origError.apply(console, args);
                };

                // Блокируем window.onerror
                window.onerror = function(msg, url, line, col, error) {
                  if (isTranslateError(error) || (typeof msg === 'string' && (
                    msg.includes('NotFoundError') ||
                    msg.includes('removeChild')
                  ))) {
                    return true;
                  }
                };

                // Блокируем все error события
                window.addEventListener('error', function(e) {
                  if (isTranslateError(e.error)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                  }
                }, true);

                // Блокируем unhandledrejection
                window.addEventListener('unhandledrejection', function(e) {
                  if (isTranslateError(e.reason)) {
                    e.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
