import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { itemCode, source } = req.query;

  if (!itemCode || !source) {
    return res.status(400).json({ error: 'Missing itemCode or source' });
  }

  try {
    if (source === 'rakuten') {
      const appId = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;
      const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;

      const response = await fetch(
        `https://app.rakuten.co.jp/services/api/Product/Review/20170426?` +
        `format=json&itemCode=${itemCode}&applicationId=${appId}&affiliateId=${affiliateId}&hits=1`
      );

      if (!response.ok) {
        return res.status(200).json({ averageRating: 0, totalCount: 0 });
      }

      const data = await response.json();

      return res.status(200).json({
        averageRating: data.reviewAverage || 0,
        totalCount: data.reviewCount || 0
      });

    } else if (source === 'yahoo') {
      const appId = process.env.NEXT_PUBLIC_YAHOO_APP_ID;

      const response = await fetch(
        `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemReview?` +
        `appid=${appId}&itemcode=${itemCode}&results=1`
      );

      if (!response.ok) {
        return res.status(200).json({ averageRating: 0, totalCount: 0 });
      }

      const data = await response.json();

      return res.status(200).json({
        averageRating: data.result?.Rating || 0,
        totalCount: data.result?.TotalReview || 0
      });

    } else {
      return res.status(400).json({ error: 'Invalid source' });
    }

  } catch (error) {
    console.error('Error fetching rating:', error);
    return res.status(200).json({ averageRating: 0, totalCount: 0 });
  }
}
