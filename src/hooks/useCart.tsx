import { createContext, useContext, useState, ReactNode } from 'react';
import { Beat, License, CartItem } from '@/types/beat';
import { SoundKit } from '@/types/soundKit';

export interface UnifiedCartItem {
  itemType: 'beat' | 'sound_kit';
  beat?: Beat;
  license?: License;
  soundKit?: SoundKit;
}

interface CartContextType {
  items: UnifiedCartItem[];
  addBeat: (beat: Beat, license: License) => void;
  addSoundKit: (soundKit: SoundKit) => void;
  removeItem: (id: string, itemType: 'beat' | 'sound_kit') => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  // Legacy support
  addItem: (beat: Beat, license: License) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UnifiedCartItem[]>([]);

  const addBeat = (beat: Beat, license: License) => {
    setItems((prev) => {
      // Remove existing item with same beat (only one license per beat)
      const filtered = prev.filter((item) => 
        !(item.itemType === 'beat' && item.beat?.id === beat.id)
      );
      return [...filtered, { itemType: 'beat', beat, license }];
    });
  };

  const addSoundKit = (soundKit: SoundKit) => {
    setItems((prev) => {
      // Check if sound kit already in cart
      const exists = prev.some(
        (item) => item.itemType === 'sound_kit' && item.soundKit?.id === soundKit.id
      );
      if (exists) return prev;
      return [...prev, { itemType: 'sound_kit', soundKit }];
    });
  };

  const removeItem = (id: string, itemType: 'beat' | 'sound_kit') => {
    setItems((prev) => prev.filter((item) => {
      if (itemType === 'beat') {
        return !(item.itemType === 'beat' && item.beat?.id === id);
      } else {
        return !(item.itemType === 'sound_kit' && item.soundKit?.id === id);
      }
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => {
    if (item.itemType === 'beat' && item.license) {
      return sum + item.license.price;
    } else if (item.itemType === 'sound_kit' && item.soundKit) {
      return sum + item.soundKit.price;
    }
    return sum;
  }, 0);

  const itemCount = items.length;

  // Legacy support for existing components
  const addItem = addBeat;

  return (
    <CartContext.Provider value={{ 
      items, 
      addBeat, 
      addSoundKit, 
      removeItem, 
      clearCart, 
      total, 
      itemCount,
      addItem 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
