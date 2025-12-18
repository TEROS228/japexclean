import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type NotificationContextType = {
  message: string;
  showNotification: (msg: string) => void;
};

const NotificationContext = createContext<NotificationContextType>({
  message: "",
  showNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setVisible(true);
  };

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <NotificationContext.Provider value={{ message, showNotification }}>
      {children}

      <div
        className={`
          fixed top-24 left-1/2 -translate-x-1/2 transform
          bg-gradient-to-r from-green-500 to-green-600 text-white
          px-6 py-4 rounded-xl shadow-2xl
          z-[10000] pointer-events-none
          transition-all duration-500 ease-out
          flex items-center gap-3 min-w-[300px]
          ${visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 -translate-y-4 scale-95"
          }
        `}
      >
        <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <span className="font-medium text-[15px]">{message}</span>
      </div>
    </NotificationContext.Provider>
  );
};
