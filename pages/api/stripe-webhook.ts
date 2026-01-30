import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { sendTelegramNotification } from "../../lib/telegram";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil"
});

export const config = {
  api: { bodyParser: false },
};

const buffer = async (req: NextApiRequest): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("❌ Missing stripe-signature or webhook secret");
    return res.status(400).json({ error: "Webhook configuration error" });
  }

  try {
    const buf = await buffer(req);
    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);

    
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === "paid") {
        const userEmail = session.metadata?.userEmail;
        const amountPaid = session.amount_total;
        const amountReceived = session.metadata?.amountAfterFee;

        if (userEmail && amountPaid && amountReceived) {
          ,
            sessionId: session.id
          });

          // Отправляем уведомление в Telegram
          const telegramMessage = `
💰 <b>NEW BALANCE TOP-UP</b>

👤 <b>User:</b> ${userEmail}
💵 <b>Amount Paid:</b> ¥${(amountPaid / 100).toLocaleString()}
✅ <b>Amount Received:</b> ¥${(parseInt(amountReceived) / 100).toLocaleString()}
💳 <b>Fee:</b> ¥${((amountPaid - parseInt(amountReceived)) / 100).toLocaleString()}

<b>Session ID:</b> <code>${session.id}</code>
          `.trim();

          await sendTelegramNotification(telegramMessage);
        }
      }
    }

    res.status(200).json({ received: true });

  } catch (err: any) {
    console.error("❌ Webhook Error:", err.message);
    res.status(400).json({ error: "Webhook Error", message: err.message });
  }
}