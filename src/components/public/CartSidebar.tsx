import React from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { getThemeColors } from '../../utils/themeUtils';
import { Restaurant } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  restaurant: Restaurant;
  tableNumber?: string | null;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, onCheckout, restaurant, tableNumber }) => {
  const { items, updateQuantity, removeItem, getTotal, getItemCount } = useCart();

  const themeColors = getThemeColors(restaurant?.settings?.theme);
  const theme = restaurant?.settings?.theme;
  const primaryColor = theme?.primary_color || '#FFC700';
  const secondaryTextColor = theme.secondary_text_color || '#6b7280';
  const cardBackgroundColor = theme.card_background_color || '#f9fafb';
  const currency = restaurant?.settings?.currency || 'USD';

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
<div
  className="fixed right-0 top-0 h-full w-[90%] md:w-96 shadow-xl z-[50] transition-transform"
  style={{ backgroundColor:cardBackgroundColor }}
>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
            <h2
              className="text-xl font-bold"
              style={{ color: themeColors.primaryText, fontFamily: theme.primary_font || 'Poppins'}}
            >
              Tu carrito
            </h2>
            <button
              onClick={onClose}
              className="hover:opacity-70 transition-opacity"
              style={{ color: themeColors.primaryText }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: primaryColor, opacity: 0.8 }} />
                <p className="text-lg" style={{ color: themeColors.primaryText, opacity: 0.7, fontFamily: theme.secondary_font || 'Poppins',}}>Tu carrito está vacío</p>
                <p className="text-sm mt-2" style={{ color: themeColors.secondaryText, fontFamily: theme.secondary_font || 'Poppins' }}>
                  Agrega algunos productos para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  let extraCost = 0;
                  const additionalIngredients: string[] = [];

                  if (item.selected_ingredients && item.product.ingredients) {
                    item.product.ingredients.forEach(ing => {
                      if (ing.optional && item.selected_ingredients.includes(ing.id)) {
                        extraCost += ing.extra_cost || 0;
                        additionalIngredients.push(ing.name);
                      }
                    });
                  }
                  const itemTotal = (item.variation.price + extraCost) * item.quantity;

                  return (
                    <div key={`${item.product.id}-${item.variation.id}-${index}`} className="flex items-center gap-4">
                      {/* Product Image */}
                      {item.product.images && item.product.images.length > 0 && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold text-sm leading-tight mb-1"
                          style={{ color: themeColors.primaryText,fontFamily: theme.primary_font || 'Inter' }}
                        >
                          {item.product.name}
                        </h3>
                        <p
                          className="text-xs mb-1"
                          style={{ color: themeColors.secondaryText,fontFamily: theme.secondary_font || 'Poppins' }}
                        >
                          {item.variation.name}
                        </p>
                        {additionalIngredients.length > 0 && (
                          <p
                            className="text-xs mb-1 italic"
                            style={{ color: primaryColor, fontFamily: theme.secondary_font || 'Poppins' }}
                          >
                            + {additionalIngredients.join(', ')}
                          </p>
                        )}
                        <p
                          className="font-bold text-sm"
                          style={{ color: primaryColor, fontFamily: theme.primary_font || 'Poppins' }}
                        >
                          {formatCurrency(itemTotal, currency)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2">
                        {/* Delete Button */}
                        <button
                          onClick={() => removeItem(item.product.id, item.variation.id)}
                          className="hover:opacity-70 transition-opacity"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.variation.id, Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:opacity-70"
                            style={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              backgroundColor: 'transparent'
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span
                            className="font-semibold text-sm w-6 text-center"
                            style={{ color: themeColors.primaryText, fontFamily: theme.secondary_font || 'Poppins' }}
                          >
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(item.product.id, item.variation.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors hover:opacity-70"
                            style={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              backgroundColor: 'transparent'
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-6" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex justify-between items-center mb-4">
                <span
                  className="text-base font-semibold"
                  style={{ color: themeColors.primaryText, fontFamily: theme.secondary_font || 'Poppins' }}
                >
                  Total:
                </span>
                <span
                  className="text-xl font-bold"
                  style={{ color: themeColors.primaryText, fontFamily: theme.primary_font || 'Poppins' }}
                >
                  {formatCurrency(getTotal(), currency)}
                </span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-3 font-bold rounded-lg transition-all hover:opacity-90 uppercase text-sm"
                style={{
                  backgroundColor: primaryColor,
                  color: secondaryTextColor,
                  fontFamily: theme.secondary_font || 'Poppins'
                }}
              >
                CONFIRMAR
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
