import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "@/context/NotificationContext";

export default function CartNotification() {
  const { message } = useNotification();

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
