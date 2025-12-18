import { useFavourites } from '@/context/FavouritesContext';

interface FavouriteButtonProps {
  item: {
    itemCode: string;
    itemName: string;
    itemPrice: number;
    itemUrl?: string;
    imageUrl?: string;
    _source?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavouriteButton({ item, size = 'md', className = '' }: FavouriteButtonProps) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const isFav = isFavourite(item.itemCode);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavourite({
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemPrice: item.itemPrice,
          itemUrl: item.itemUrl,
          imageUrl: item.imageUrl,
          _source: item._source,
          addedAt: new Date().toISOString(),
        });
      }}
      className={`${sizeClasses[size]} bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-xl ${className}`}
      aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
    >
      <svg
        className={`${iconSizes[size]} transition-all ${
          isFav ? 'fill-red-500 text-red-500' : 'fill-none text-gray-700'
        }`}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
