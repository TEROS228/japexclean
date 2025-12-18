// components/ProductCard.tsx

import Link from "next/link";

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  url: string;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={product.url} target="_blank" rel="noopener noreferrer">
      <div className="border rounded-xl shadow hover:shadow-lg transition duration-200 p-3 h-full flex flex-col">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-contain mb-3"
        />
        <div className="flex-grow">
          <h2 className="text-sm font-medium line-clamp-2">{product.name}</h2>
        </div>
        <div className="mt-2 font-bold text-green-600">
          ¥{product.price.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}
