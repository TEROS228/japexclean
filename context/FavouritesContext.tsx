import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCompatibleAuthToken } from '@/lib/auth';

interface FavouriteItem {
  itemCode: string;
  itemName: string;
  itemPrice: number;
  itemUrl?: string;
  imageUrl?: string;
  _source?: string;
  addedAt: string;
}

interface FavouritesContextType {
  favourites: FavouriteItem[];
  addToFavourites: (item: FavouriteItem) => void;
  removeFromFavourites: (itemCode: string) => void;
  isFavourite: (itemCode: string) => boolean;
  toggleFavourite: (item: FavouriteItem) => void;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favourites from server on mount
  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    try {
      const token = getCompatibleAuthToken();
      if (!token) {
        setIsLoaded(true);
        return;
      }

      const response = await fetch('/api/favourites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavourites(data.favourites || []);
      }
    } catch (error) {
      console.error('Failed to load favourites:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const addToFavourites = async (item: FavouriteItem) => {
    try {
      const token = getCompatibleAuthToken();
      if (!token) {
        alert('Please log in to add items to favourites');
        return;
      }

      // Optimistic update
      const newItem = { ...item, addedAt: new Date().toISOString() };
      setFavourites((prev) => [newItem, ...prev]);

      const response = await fetch('/api/favourites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        // Revert on error
        setFavourites((prev) => prev.filter((f) => f.itemCode !== item.itemCode));
        throw new Error('Failed to add to favourites');
      }
    } catch (error) {
      console.error('Failed to add to favourites:', error);
    }
  };

  const removeFromFavourites = async (itemCode: string) => {
    try {
      const token = getCompatibleAuthToken();
      if (!token) return;

      // Optimistic update
      const previousFavourites = favourites;
      setFavourites((prev) => prev.filter((item) => item.itemCode !== itemCode));

      const response = await fetch(`/api/favourites?itemCode=${itemCode}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Revert on error
        setFavourites(previousFavourites);
        throw new Error('Failed to remove from favourites');
      }
    } catch (error) {
      console.error('Failed to remove from favourites:', error);
    }
  };

  const isFavourite = (itemCode: string): boolean => {
    return favourites.some((item) => item.itemCode === itemCode);
  };

  const toggleFavourite = (item: FavouriteItem) => {
    if (isFavourite(item.itemCode)) {
      removeFromFavourites(item.itemCode);
    } else {
      addToFavourites(item);
    }
  };

  return (
    <FavouritesContext.Provider
      value={{
        favourites,
        addToFavourites,
        removeFromFavourites,
        isFavourite,
        toggleFavourite,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (context === undefined) {
    throw new Error('useFavourites must be used within a FavouritesProvider');
  }
  return context;
}
