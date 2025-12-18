import { NextApiRequest, NextApiResponse } from 'next';
import { getAllFedExRates } from '../../../lib/fedex';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weight, toCountry, toCity, toState, toPostalCode, isCommercial } = req.body;

    if (!weight || !toCountry || !toCity || !toState || !toPostalCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await getAllFedExRates({
      weight: parseFloat(weight),
      fromCountry: 'JP',
      toCountry,
      toCity,
      toState,
      toPostalCode,
      isCommercial: isCommercial || false,
      itemValueJPY: 10000, // Примерная стоимость для калькулятора
      itemDescription: 'General Merchandise'
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error calculating FedEx rates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
