import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Check } from 'lucide-react';
import { CartItem, Restaurant } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface CartPreviewProps {
  item: CartItem | null;
  restaurant: Restaurant;
  onViewCart: () => void;
  onClose: () => void;
}

export const CartPreview: React.FC<CartPreviewProps> = ({
  item,
  restaurant,
  onViewCart,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (item) {
      setIsVisible(true);
      setIsLeaving(false);

      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [item]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!item || !isVisible) return null;

  const theme = restaurant.settings.theme;
  const primaryColor = theme.primary_color || '#FFC700';
  const cardBackgroundColor = theme.card_background_color || '#f9fafb';
  const primaryTextColor = theme.primary_text_color || '#111827';
  const secondaryTextColor = theme.secondary_text_color || '#6b7280';
  const currency = restaurant.settings.currency || 'USD';

  let extraCost = 0;
  const additionalIngredients: Array<{name: string, cost: number}> = [];

  if (item.selected_ingredients) {
    item.selected_ingredients.forEach(ing => {
      if (ing.optional) {
        extraCost += ing.extra_cost || 0;
        additionalIngredients.push({name: ing.name, cost: ing.extra_cost || 0});
      }
    });
  }
  const itemTotal = (item.variation.price + extraCost) * item.quantity;

  return (
    <div
      className={`fixed top-20 right-4 z-[60] w-[90%] max-w-sm transition-all duration-300 ${
        isLeaving ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      }`}
      style={{
        animation: isLeaving ? 'none' : 'slideInRight 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(2rem);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>

      <div
        className="rounded-xl shadow-2xl overflow-hidden border-2"
        style={{
          backgroundColor: cardBackgroundColor,
          borderColor: primaryColor,
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Check
                className="w-5 h-5"
                style={{ color: secondaryTextColor, stroke: secondaryTextColor }}
              />
            </div>
            <h3
              className="font-bold text-sm"
              style={{
                color: secondaryTextColor,
                fontFamily: theme.primary_font || 'Poppins',
              }}
            >
              Agregado al carrito
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="hover:opacity-70 transition-opacity"
            style={{ color: secondaryTextColor }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {item.product.images && item.product.images.length > 0 && (
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-sm leading-tight mb-1"
                style={{
                  color: primaryTextColor,
                  fontFamily: theme.primary_font || 'Poppins',
                }}
              >
                {item.product.name}
              </h3>
              <p
                className="text-xs mb-1"
                style={{
                  color: secondaryTextColor,
                  fontFamily: theme.secondary_font || 'Poppins',
                }}
              >
                {item.variation.name} × {item.quantity}
              </p>
              {additionalIngredients.length > 0 && (
                <div
                  className="text-xs mb-1 italic"
                  style={{ color: primaryColor, fontFamily: theme.secondary_font || 'Poppins' }}
                >
                  {additionalIngredients.map((ing, idx) => (
                    <div key={idx}>
                      + {ing.name}
                      {ing.cost > 0 && ` (+${formatCurrency(ing.cost, currency)})`}
                    </div>
                  ))}
                </div>
              )}
              <p
                className="font-bold text-sm"
                style={{
                  color: primaryColor,
                  fontFamily: theme.primary_font || 'Poppins',
                }}
              >
                {formatCurrency(itemTotal, currency)}
              </p>
            </div>
          </div>

          {/* View Cart Button */}
          <button
            onClick={() => {
              handleClose();
              onViewCart();
            }}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{
              backgroundColor: primaryColor,
              color: secondaryTextColor,
              fontFamily: theme.secondary_font || 'Poppins',
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            Ver carrito completo
          </button>
        </div>
      </div>
    </div>
  );
};
