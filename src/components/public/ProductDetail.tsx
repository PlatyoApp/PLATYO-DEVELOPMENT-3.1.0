import React, { useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { Product, ProductVariation, Restaurant, ProductIngredient } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/currencyUtils';

interface ProductDetailProps {
  product: Product;
  restaurant: Restaurant;
  onClose: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, restaurant, onClose }) => {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation>(
    product.variations && product.variations.length > 0
      ? product.variations[0]
      : { id: '1', name: 'Default', price: product.price || 0 }
  );
  const [selectedIngredients, setSelectedIngredients] = useState<ProductIngredient[]>(
    product.ingredients?.filter(ing => !ing.optional) || []
  );
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();

  const toggleIngredient = (ingredient: ProductIngredient) => {
    setSelectedIngredients(prev => {
      const isSelected = prev.some(ing => ing.id === ingredient.id);
      if (isSelected) {
        return prev.filter(ing => ing.id !== ingredient.id);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  const calculatePrice = () => {
    const basePrice = selectedVariation.price;
    const extraCost = selectedIngredients
      .filter(ing => ing.optional)
      .reduce((sum, ing) => sum + (ing.extra_cost || 0), 0);

    return (basePrice + extraCost) * quantity;
  };

  const handleAddToCart = () => {
    addItem(product, selectedVariation, quantity, selectedIngredients, '');
    onClose();
  };
  const theme = restaurant.settings.theme;
  const primaryColor = theme.primary_color || '#FFC700';
  const cardBackgroundColor = theme.card_background_color || '#ffffff';
  const primaryTextColor = theme.primary_text_color || '#111827';
  const secondaryTextColor = theme.secondary_text_color || '#6b7280';
  const currency = restaurant.settings.currency || 'USD';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: cardBackgroundColor,
          maxWidth: '32rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Scrollbar personalizado */}
        <style>
          {`
            /* Scrollbar general */
            .custom-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background-color: ${primaryColor};
              border-radius: 8px;
              opacity: 0.5;
            }
            .custom-scroll:hover::-webkit-scrollbar-thumb {
              opacity: 1;
            }
            /* Firefox */
            .custom-scroll {
              scrollbar-width: none;
              scrollbar-color: ${primaryColor} transparent;
            }
          `}
        </style>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 shadow-lg transition-colors"
        >
          <X className="w-5 h-5" style={{ color: primaryColor }} />
        </button>

        {/* Content */}
        <div className="overflow-y-auto custom-scroll" style={{ flex: 1 }}>
          {/* Product Image */}
          {product.images && product.images.length > 0 && (
            <div className="relative w-full h-[250px] md:h-[400px]">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Product Name */}
            <h2
              className="font-bold mb-3 text-center"
              style={{
                fontSize: '28px',
                color: primaryTextColor,
                fontFamily: theme.primary_font || 'Inter'
              }}
            >
              {product.name.split(' ').map((word, i) => (
                <span key={i}>
                  {i === 0 ? (
                    <span
                      style={{ cssText: `color: ${primaryColor} !important` }}
                    >
                      {word}
                    </span>
                  ) : (
                    <span>{' ' + word}</span>
                  )}
                </span>
              ))}
            </h2>

            {/* Description */}
            <p
              className="text-center mb-6"
              style={{
                fontSize: '14px',
                color: secondaryTextColor,
                lineHeight: '1.6',
                fontFamily: theme.secondary_font || 'Inter'
              }}
            >
              {product.description}
            </p>

            {/* Variations */}
            {product.variations && product.variations.length > 1 && (
              <div className="mb-6">
                <h3
                  className="font-semibold mb-3"
                  style={{
                    fontSize: '14px',
                    color: primaryTextColor,
                    fontFamily: theme.secondary_font || 'Poppins'
                  }}
                >
                  Selecciona una opción
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.variations.map(variation => (
                    <button
                      key={variation.id}
                      onClick={() => setSelectedVariation(variation)}
                      className="p-4 rounded-lg text-left transition-all border-2"
                      style={{
                        borderColor: selectedVariation.id === variation.id ? primaryColor : '#e5e7eb',
                        backgroundColor: selectedVariation.id === variation.id ? primaryColor : 'transparent',
                        color: selectedVariation.id === variation.id ? secondaryTextColor : primaryTextColor,
                        borderRadius: '8px'
                      }}
                    >
                      <div className="font-semibold" style={{ fontSize: '14px', marginBottom: '4px', fontFamily: theme.secondary_font || 'Poppins' }}>
                        {variation.name}
                      </div>
                      <div className="font-bold" style={{ fontSize: '16px', fontFamily: theme.secondary_font || 'Poppins' }}>
                        {formatCurrency(variation.price, currency)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredients - Only show optional ingredients */}
            {product.ingredients && product.ingredients.filter(ing => ing.optional).length > 0 && (
              <div className="mb-6">
                <h3
                  className="font-semibold mb-3"
                  style={{
                    fontSize: '14px',
                    color: primaryTextColor,
                    fontFamily: theme.secondary_font || 'Poppins'
                  }}
                >
                  Ingredientes opcionales
                </h3>
                <div className="space-y-2">
                  {product.ingredients.filter(ingredient => ingredient.optional).map(ingredient => (
                  <label
                    key={ingredient.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      borderRadius: '8px',
                      transition: 'background-color 0.3s ease',
                      fontFamily: theme.secondary_font || 'Poppins'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                      <input
                        type="checkbox"
                        checked={selectedIngredients.some(ing => ing.id === ingredient.id)}
                        onChange={() => toggleIngredient(ingredient)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: primaryColor, fontFamily: theme.secondary_font || 'Poppins' }}
                      />
                      <span
                        className="flex-1"
                        style={{
                          fontSize: '13px',
                          color: secondaryTextColor
                        }}
                      >
                        {ingredient.name}
                      </span>
                      {ingredient.extra_cost && ingredient.extra_cost > 0 && (
                        <span
                          className="font-medium"
                          style={{
                            fontSize: '13px',
                            color: primaryColor,
                            fontFamily: theme.secondary_font || 'Poppins'
                          }}
                        >
                          +{formatCurrency(ingredient.extra_cost, currency)}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 mt-6">
              {/* Quantity */}
              <div className="flex items-center gap-3">
                <span
                  className="font-medium"
                  style={{
                    fontSize: '14px',
                    color: primaryTextColor,
                    fontFamily: theme.secondary_font || 'Poppins'
                  }}
                >
                  Cantidad:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      border: `2px solid ${primaryColor}`,
                      color: primaryColor,
                      transition: 'background-color 0.3s ease',
                      fontFamily: theme.secondary_font || 'Poppins'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${primaryColor}4D`)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Minus className="w-5 h-5" strokeWidth={3} />
                  </button>
                  <span
                    className="font-bold w-8 text-center"
                    style={{
                      fontSize: '18px',
                      color: primaryTextColor,
                      fontFamily: theme.secondary_font || 'Poppins'
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      border: `2px solid ${primaryColor}`,
                      color: primaryColor,
                      transition: 'background-color 0.3s ease',
                      fontFamily: theme.secondary_font || 'Poppins'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${primaryColor}4D`)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Plus className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="w-full md:flex-1 px-6 py-3 text-white font-bold rounded-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: primaryColor,
                  fontSize: '16px',
                  borderRadius: '8px',
                  fontFamily: theme.secondary_font || 'Poppins'
                }}
              >
                Agregar {formatCurrency(calculatePrice(), currency)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
