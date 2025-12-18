// lib/paymentLogger.ts
interface PaymentLog {
  sessionId: string;
  userEmail: string;
  amount: number;
  currency: string;
  timestamp: Date;
  status: 'processed' | 'duplicate' | 'error';
}

class PaymentLogger {
  private static instance: PaymentLogger;
  private processedPayments: Set<string> = new Set();
  private logs: PaymentLog[] = [];

  private constructor() {}

  static getInstance(): PaymentLogger {
    if (!PaymentLogger.instance) {
      PaymentLogger.instance = new PaymentLogger();
    }
    return PaymentLogger.instance;
  }

  logPayment(sessionId: string, userEmail: string, amount: number, currency: string): boolean {
    // Проверяем не обрабатывали ли уже этот платеж
    if (this.processedPayments.has(sessionId)) {
      this.logs.push({
        sessionId,
        userEmail,
        amount,
        currency,
        timestamp: new Date(),
        status: 'duplicate'
      });
      console.warn(`⚠️ Duplicate payment detected: ${sessionId}`);
      return false;
    }

    // Добавляем в обработанные
    this.processedPayments.add(sessionId);
    this.logs.push({
      sessionId,
      userEmail,
      amount,
      currency,
      timestamp: new Date(),
      status: 'processed'
    });

    console.log(`✅ Payment logged: ${sessionId} - ${userEmail} - ¥${amount}`);
    return true;
  }

  getLogs(): PaymentLog[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
    this.processedPayments.clear();
  }
}

export const paymentLogger = PaymentLogger.getInstance();