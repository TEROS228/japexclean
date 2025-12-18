import { NextApiRequest, NextApiResponse } from 'next';
import { getUserData } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const user = getUserData();
    if (!user) throw new Error('You must be logged in');
    const { product } = req.body;
    if (!product) throw new Error('No product provided');

    // TODO: Implement addToCart function
    res.status(200).json({ message: 'Product added to cart' });
  } catch (err: any) {
    res.status(401).json({ message: err.message || 'You must be logged in' });
  }
}
