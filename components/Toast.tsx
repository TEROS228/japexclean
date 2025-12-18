// components/Toast.tsx
import { useEffect, useState } from "react";

export default function Toast({ message, visible, onClose }: {
  message: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timeout = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // подождать перед удалением
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [visible, onClose]);

  return (
    <div
      className={`fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform ${
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
      style={{ zIndex: 9999 }}
    >
      {message}
    </div>
  );
}
