import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useUserContext from "@/context/UserContext";

export default function VerifyBalancePage() {
  const router = useRouter();
  const { updateBalance } = useUserContext();
  const [message, setMessage] = useState("Проверка платежа...");

  useEffect(() => {
    if (!router.isReady) return;
    const sessionId = router.query.session_id as string;
    if (!sessionId) return setMessage("Session ID не найден");

    const verify = async () => {
      try {
        const res = await fetch(`/api/balance/verify?session_id=${sessionId}`);
        const data = await res.json();
        if (data.success && data.amount && data.email) {
          updateBalance(Number(data.amount));
          setMessage(`Баланс успешно пополнен на ¥${data.amount}`);
        } else {
          setMessage("Ошибка при проверке платежа");
        }
      } catch {
        setMessage("Ошибка при проверке платежа");
      }
    };

    verify();
  }, [router.isReady, router.query.session_id]);

  return (
    <main className="p-6 max-w-7xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Stripe Payment</h1>
      <p className="text-lg">{message}</p>
      <button
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => router.push("/cart")}
      >
        Вернуться в корзину
      </button>
    </main>
  );
}
