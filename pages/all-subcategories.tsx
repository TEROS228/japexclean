// pages/all-subcategories.tsx

import { allCategories } from "@/data/categories";
import Link from "next/link";
import Image from "next/image";

export default function AllSubcategoriesPage() {
  return (
    <div className="p-4 space-y-10">
      {allCategories.map((category) => (
        <div key={category.id}>
          {/* Заголовок главной категории */}
          <h2 className="text-2xl font-bold mb-3">{category.name}</h2>

          {/* Горизонтальный скролл */}
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
            {category.subcategories?.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${category.id}/${sub.id}`}
                className="flex-shrink-0 w-40"
              >
                <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                  <Image
                    src={sub.image || "/placeholder.png"}
                    alt={sub.name}
                    width={160}
                    height={160}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 text-sm text-center">{sub.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
