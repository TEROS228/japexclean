import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount } = req.body;

    if (!amount || amount < 1000) {
      return res.status(400).json({ error: "Minimum amount is ¥1,000" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { name: "Balance Top-up" },
            unit_amount: amount, // amount already in JPY
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/balance/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/balance/cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
}
