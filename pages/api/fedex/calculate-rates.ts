import { NextApiRequest, NextApiResponse } from 'next';
import { getAllFedExRates } from '../../../lib/fedex';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weight, toCountry, toCity, toState, toPostalCode, isCommercial } = req.body;

    if (!weight || !toCountry || !toCity || !toPostalCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // State/Province is required only for US, CA, and AU
    const requiresState = ['US', 'CA', 'AU'].includes(toCountry);
    if (requiresState && !toState) {
      return res.status(400).json({ error: 'State/Province is required for this country' });
    }

    console.log('📦 FedEx Rate Request:', {
      weight: parseFloat(weight),
      toCountry,
      toCity,
      toState: toState || 'N/A',
      toPostalCode
    });

    const result = await getAllFedExRates({
      weight: parseFloat(weight),
      fromCountry: 'JP',
      toCountry,
      toCity,
      toState: toState || '',
      toPostalCode,
      isCommercial: isCommercial || false,
      itemValueJPY: 10000, // Примерная стоимость для калькулятора
      itemDescription: 'General Merchandise'
    });

    console.log('✅ FedEx Rate Response:', result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error calculating FedEx rates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
