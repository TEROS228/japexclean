import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RakutenRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const url = router.query.url as string;
    if (!url) return;

    // Add auto-checkout flag to URL and open
    const separator = url.includes('?') ? '&' : '?';
    const target = `${url}${separator}_japrix_auto=1`;
    window.location.href = target;
  }, [router.isReady, router.query.url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Opening Rakuten...</p>
      </div>
    </div>
  );
}
