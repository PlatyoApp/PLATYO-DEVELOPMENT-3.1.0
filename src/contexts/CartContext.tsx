import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product, ProductVariation } from '../types';

interface CartContextType {
  items: CartItem[];
  lastAddedItem: CartItem | null;
  addItem: (product: Product, variation: ProductVariation, quantity?: number, selectedIngredients?: string[], notes?: string) => void;
  removeItem: (productId: string, variationId: string) => void;
  updateQuantity: (productId: string, variationId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  clearLastAddedItem: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);

  const addItem = (product: Product, variation: ProductVariation, quantity = 1, selectedIngredients?: string[], notes?: string) => {
    const ingredientsToUse = selectedIngredients || product.ingredients?.filter(ing => !ing.optional).map(ing => ing.id) || [];

    const newItem: CartItem = {
      product,
      variation,
      quantity,
      special_notes: notes,
      selected_ingredients: ingredientsToUse,
    };

    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id &&
               item.variation.id === variation.id &&
               JSON.stringify(item.selected_ingredients.sort()) === JSON.stringify(ingredientsToUse.sort())
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      return [...prevItems, newItem];
    });

    setLastAddedItem(newItem);
  };

  const removeItem = (productId: string, variationId: string) => {
    setItems(prevItems => 
      prevItems.filter(item => 
        !(item.product.id === productId && item.variation.id === variationId)
      )
    );
  };

  const updateQuantity = (productId: string, variationId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variationId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId && item.variation.id === variationId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      // Calculate extra ingredients cost
      let extraIngredientsCost = 0;
      if (item.selected_ingredients && item.product.ingredients) {
        extraIngredientsCost = item.product.ingredients
          .filter(ing => ing.optional && item.selected_ingredients.includes(ing.id))
          .reduce((sum, ing) => sum + (ing.extra_cost || 0), 0);
      }
      
      return total + ((item.variation.price + extraIngredientsCost) * item.quantity);
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const clearLastAddedItem = () => {
    setLastAddedItem(null);
  };

  const value: CartContextType = {
    items,
    lastAddedItem,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    clearLastAddedItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};