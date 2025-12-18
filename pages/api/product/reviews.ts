import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { itemCode, source, itemUrl } = req.query;

  if (!itemCode || !source) {
    return res.status(400).json({ error: 'Missing itemCode or source' });
  }

  try {
    if (source === 'rakuten') {
      const appId = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;
      const affiliateId = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID;

      console.log('[Reviews API] Fetching Rakuten reviews for itemCode:', itemCode);

      // Сначала получаем информацию о товаре через IchibaItem API для получения shopCode
      const itemApiUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?` +
        `format=json&itemCode=${encodeURIComponent(itemCode as string)}&applicationId=${appId}&affiliateId=${affiliateId}`;

      console.log('[Reviews API] Fetching item info:', itemApiUrl);

      const itemResponse = await fetch(itemApiUrl);

      if (!itemResponse.ok) {
        console.error('[Reviews API] Item API error:', itemResponse.status);
        return res.status(200).json({ reviews: [], averageRating: 0, totalCount: 0 });
      }

      const itemData = await itemResponse.json();
      console.log('[Reviews API] Item data:', JSON.stringify(itemData).substring(0, 300));

      if (!itemData.Items || itemData.Items.length === 0) {
        console.log('[Reviews API] No item found');
        return res.status(200).json({ reviews: [], averageRating: 0, totalCount: 0 });
      }

      const item = itemData.Items[0].Item;
      const shopCode = item.shopCode;
      const shopItemCode = (itemCode as string).split(':')[1] || itemCode;

      console.log('[Reviews API] shopCode:', shopCode, 'shopItemCode:', shopItemCode);

      // Теперь получаем отзывы используя shopCode и shopItemCode
      const reviewsUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Review/20170426?` +
        `format=json&shopCode=${shopCode}&itemCode=${shopItemCode}&applicationId=${appId}&affiliateId=${affiliateId}&hits=10`;

      console.log('[Reviews API] Requesting reviews:', reviewsUrl);

      const reviewsResponse = await fetch(reviewsUrl);

      if (!reviewsResponse.ok) {
        console.error('[Reviews API] Reviews API error:', reviewsResponse.status);
        console.log('[Reviews API] Reviews API может быть недоступен на бесплатном плане, показываем только рейтинг');
        // Возвращаем хотя бы средний рейтинг из товара
        return res.status(200).json({
          reviews: [],
          averageRating: item.reviewAverage || 0,
          totalCount: item.reviewCount || 0,
          reviewsUnavailable: true,
          itemUrl: item.itemUrl
        });
      }

      const reviewsData = await reviewsResponse.json();
      console.log('[Reviews API] Reviews data:', JSON.stringify(reviewsData).substring(0, 300));

      const reviews = reviewsData.Reviews?.map((review: any) => ({
        id: review.reviewId,
        rating: review.evaluation,
        title: review.reviewTitle,
        comment: review.reviewBody,
        reviewer: review.reviewerName || 'Anonymous',
        date: review.reviewDate,
        helpful: review.helpfulCount || 0
      })) || [];

      return res.status(200).json({
        reviews,
        averageRating: item.reviewAverage || 0,
        totalCount: item.reviewCount || 0,
        itemUrl: item.itemUrl
      });

    } else if (source === 'yahoo') {
      // Yahoo Shopping Reviews API недоступен - всегда возвращаем пустой результат
      console.log('[Reviews API] Yahoo reviews API недоступен, отзывы не показываем');

      return res.status(200).json({
        reviews: [],
        averageRating: 0,
        totalCount: 0,
        reviewsUnavailable: true,
        itemUrl: itemUrl as string
      });

    } else {
      return res.status(400).json({ error: 'Invalid source' });
    }

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
