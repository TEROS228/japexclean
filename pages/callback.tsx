// pages/callback.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { code } = router.query;
    if (code) {
      console.log("Authorization code:", code);
      // Здесь позже поменяем на обмен кода на access_token
    }
  }, [router.isReady, router.query]);

  return <div>Processing OAuth...</div>;
}
