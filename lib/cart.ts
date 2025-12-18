import clientPromise from "./mongodb";

export interface CartItem {
  id: string;
  title?: string;
  price?: number;
  image?: string;
  quantity: number;
}

interface CartDocument {
  userId: string;
  products: CartItem[];
}

export const addToCart = async (userId: string, product: CartItem) => {
  const client = await clientPromise;
  const db = client.db("japrix");

  return await db.collection<CartDocument>("carts").updateOne(
    { userId },
    { $push: { products: product } },
    { upsert: true }
  );
};
