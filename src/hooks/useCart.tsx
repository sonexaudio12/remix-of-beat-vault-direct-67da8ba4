import { createContext, useContext, useState, ReactNode } from 'react';
import { Beat, License, CartItem } from '@/types/beat';

interface CartContextType {
  items: CartItem[];
  addItem: (beat: Beat, license: License) => void;
  removeItem: (beatId: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (beat: Beat, license: License) => {
    setItems((prev) => {
      // Remove existing item with same beat (only one license per beat)
      const filtered = prev.filter((item) => item.beat.id !== beat.id);
      return [...filtered, { beat, license }];
    });
  };

  const removeItem = (beatId: string) => {
    setItems((prev) => prev.filter((item) => item.beat.id !== beatId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.license.price, 0);
  const itemCount = items.length;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, itemCount }}>
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
