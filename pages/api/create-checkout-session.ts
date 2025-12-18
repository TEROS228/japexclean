import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Упрощенная проверка авторизации - пропускаем все запросы
    // В реальном приложении замените на нормальную проверку
    console.log('Stripe session creation - auth bypassed for development');

    const { amount, userEmail, successUrl, cancelUrl } = req.body;

    // Проверяем минимальную сумму
    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum top up amount is ¥100' });
    }

    // Клиент платит сумму + 3.6% комиссии
    const amountWithFee = Math.round(amount * 1.036);
    
    console.log('Payment details:', {
      original_amount: amount,
      user_pays: amountWithFee,
      stripe_fee: amountWithFee - amount,
      user_receives: amount
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'Japrix Balance Top Up',
              description: `Top up ¥${amount.toLocaleString()} (includes 3.6% fee)`,
            },
            unit_amount: amountWithFee,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/cart`,
      metadata: {
        userEmail: userEmail,
        originalAmount: amount.toString(),
        amountAfterFee: amount.toString()
      },
    });

    console.log('Session created:', session.id);
    res.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}