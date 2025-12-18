import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id as string);
    
    console.log('Stripe session metadata:', session.metadata);
    
    if (session.payment_status === 'paid') {
      // Get amount from metadata
      const originalAmount = session.metadata?.originalAmount
        ? parseInt(session.metadata.originalAmount)
        : 0;

      const amountAfterFee = session.metadata?.amountAfterFee
        ? parseInt(session.metadata.amountAfterFee)
        : originalAmount; // If amountAfterFee is not set, use originalAmount

      res.json({
        paid: true,
        amount: session.amount_total, // Amount paid by user (with fee)
        amountAfterFee: amountAfterFee, // Amount to be added to balance
        originalAmount: originalAmount, // Original top-up amount
        currency: session.currency,
        userEmail: session.metadata?.userEmail
      });
    } else {
      res.json({
        paid: false,
        error: 'Payment not completed'
      });
    }
    
  } catch (error) {
    console.error('Stripe verify error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
}