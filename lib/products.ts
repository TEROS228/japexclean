// lib/products.ts

export async function getProductsByCategory(genreId: number) {
  try {
    const res = await fetch(`https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=${process.env.RAKUTEN_API_KEY}&genreId=${genreId}&format=json`);
    if (!res.ok) throw new Error("Failed to fetch Rakuten products");

    const data = await res.json();
    return data.Items.map((item: any) => {
      const product = item.Item;
      return {
        id: product.itemCode,
        title: product.itemName,
        image: product.mediumImageUrls?.[0]?.imageUrl || "",
        price: product.itemPrice,
        url: product.itemUrl,
        shop: product.shopName,
      };
    });
  } catch (err) {
    console.error("getProductsByCategory error:", err);
    return [];
  }
}
