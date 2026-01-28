import React from 'react';
import { Product, Restaurant } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface ProductCardProps {
  product: Product;
  restaurant: Restaurant;
  viewMode: 'list' | 'grid' | 'editorial';
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, restaurant, viewMode, onClick }) => {
  const theme = restaurant.settings.theme;
  const primaryColor = theme.primary_color || '#FFC700';
  const secondaryColor = theme.secondary_color || '#f3f4f6';
  const cardBackgroundColor = theme.card_background_color || '#f9fafb';
  const primaryTextColor = theme.primary_text_color || '#111827';
  const secondaryTextColor = theme.secondary_text_color || '#6b7280';

  const minPrice = product.variations.length > 0
    ? Math.min(...product.variations.map((v) => v.price))
    : 0;

  const comparePrices = product.variations
    .map(v => v.compare_at_price)
    .filter((price): price is number => typeof price === 'number' && price > 0);
  const minComparePrice = comparePrices.length > 0 ? Math.min(...comparePrices) : 0;

  const hasDiscount = minComparePrice > 0 && minComparePrice > minPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((minComparePrice - minPrice) / minComparePrice) * 100)
    : 0;

  const isOutOfStock = product.status === 'out_of_stock';

  const includedIngredients = product.ingredients && Array.isArray(product.ingredients)
    ? product.ingredients.filter((ing: any) => !ing.optional).map((ing: any) => ing.name)
    : [];

  if (viewMode === 'editorial') {
    return (
      <div
        className="rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden relative mx-2 md:mx-0"
        onClick={() => !isOutOfStock && onClick()}
        style={{
          borderRadius: theme.button_style === 'rounded' ? '0.75rem' : '0.25rem',
          backgroundColor: cardBackgroundColor,
          opacity: isOutOfStock ? 0.7 : 1,
          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        }}
      >
        <div className="flex flex-col md:flex-row gap-2 px-0 md:px-0">
          {product.images[0] && (
            <div className="relative w-full md:w-auto">
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                className={`
                  w-full h-[200px] md:w-[164px] md:h-[154px] object-cover flex-shrink-0
                  ${theme.button_style === 'rounded' ? 'rounded-t-lg md:rounded-lg md:rounded-tr-none md:rounded-br-none' : 'rounded-t-sm md:rounded-sm md:rounded-tr-none md:rounded-br-none'}
                `}
              />
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="px-4 py-2 font-bold text-sm rounded">
                    AGOTADO
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h2
                className="font-bold flex-1"
                style={{
                  fontFamily: theme.primary_font || 'Poppins',
                  color: primaryColor,
                }}
              >
                {product.name}
              </h2>
              <div className="flex gap-2">
                {isOutOfStock && (
                  <span
                    className="px-2 py-1 text-xs font-bold rounded"
                    style={{
                      backgroundColor: primaryColor,
                      color: secondaryTextColor,
                    }}
                  >
                    AGOTADO
                  </span>
                )}
                {hasDiscount && (
                  <span
                    className="px-2 py-1 text-xs font-bold rounded"
                    style={{
                      backgroundColor: primaryColor,
                      color: secondaryTextColor,
                    }}
                  >
                    -{discountPercentage}%
                  </span>
                )}
              </div>
            </div>
            <p
              className="mb-2 text-base leading-relaxed line-clamp-2"
              style={{
                fontFamily: theme.secondary_font || 'Inter',
                color: secondaryTextColor,
              }}
            >
              {product.description}
            </p>
            {includedIngredients.length > 0 && (
              <p
                className="mb-4 text-sm italic line-clamp-1"
                style={{
                  fontFamily: theme.secondary_font || 'Inter',
                  color: secondaryTextColor,
                  opacity: 0.8,
                }}
              >
                {includedIngredients.join(', ')}
              </p>
            )}
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span
                  className="text-lg line-through opacity-60"
                  style={{
                    fontFamily: theme.secondary_font || 'Poppins',
                    color: secondaryTextColor,
                  }}
                >
                  {formatCurrency(minComparePrice, restaurant.settings.currency || 'USD')}
                </span>
              )}
              <span
                className="font-bold text-2xl"
                style={{
                  fontFamily: theme.secondary_font || 'Poppins',
                  color: primaryColor,
                }}
              >
                {formatCurrency(minPrice, restaurant.settings.currency || 'USD')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div
        className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden relative"
        onClick={() => !isOutOfStock && onClick()}
        style={{
          borderRadius: theme.button_style === 'rounded' ? '0.75rem' : '0.25rem',
          backgroundColor: cardBackgroundColor,
          opacity: isOutOfStock ? 0.7 : 1,
          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        }}
      >
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          {hasDiscount && (
            <div
              className="px-2 py-1 text-xs font-bold rounded"
              style={{
                backgroundColor: primaryColor,
                color: secondaryTextColor,
              }}
            >
              -{discountPercentage}%
            </div>
          )}
        </div>
        {product.images[0] && (
          <div className="relative">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span
                  className="px-4 py-2 font-bold text-sm rounded"
                  style={{
                    backgroundColor: primaryColor,
                    color: secondaryTextColor,
                  }}
                >
                  AGOTADO
                </span>
              </div>
            )}
          </div>
        )}
        <div className="p-2">
          <h2
            className="font-bold line-clamp-1"
            style={{
              fontSize: '16px',
              fontFamily: theme.primary_font || 'Poppins',
              color: primaryColor,
            }}
          >
            {product.name}
          </h2>
          <p
            className="text-base leading-relaxed line-clamp-2 mb-1"
            style={{
              fontFamily: theme.secondary_font || 'Inter',
              color: secondaryTextColor,
            }}
          >
            {product.description}
          </p>
          {includedIngredients.length > 0 && (
            <p
              className="text-xs italic line-clamp-1 mb-2"
              style={{
                fontFamily: theme.secondary_font || 'Inter',
                color: secondaryTextColor,
                opacity: 0.8,
              }}
            >
              {includedIngredients.join(', ')}
            </p>
          )}
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span
                className="text-sm line-through opacity-60"
                style={{
                  fontFamily: theme.secondary_font || 'Poppins',
                  color: secondaryTextColor,
                }}
              >
                {formatCurrency(minComparePrice, restaurant.settings.currency || 'USD')}
              </span>
            )}
            <span
              className="font-bold text-lg"
              style={{
                fontFamily: theme.secondary_font || 'Poppins',
                color: primaryColor,
              }}
            >
              {formatCurrency(minPrice, restaurant.settings.currency || 'USD')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-left gap-4 p-4 pl-0 py-0 relative"
      onClick={() => !isOutOfStock && onClick()}
      style={{
        borderRadius: theme.button_style === 'rounded' ? '0.75rem' : '0.25rem',
        display: 'flex',
        backgroundColor: cardBackgroundColor,
        opacity: isOutOfStock ? 0.7 : 1,
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
      }}
    >
      {product.images[0] && (
        <div className="relative">
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isOutOfStock && (
              <div
                className="px-2 py-1 text-xs font-bold rounded"
                style={{
                  backgroundColor: primaryColor,
                  color: secondaryTextColor,
                }}
              >
                AGOTADO
              </div>
            )}
            {hasDiscount && (
              <div
                className="px-2 py-1 text-xs font-bold rounded"
                style={{
                  backgroundColor: primaryColor,
                  color: secondaryTextColor,
                }}
              >
                -{discountPercentage}%
              </div>
            )}
          </div>
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="object-cover rounded-xl flex-shrink-0"
            style={{
              width: '150px',
              height: '150px',
              objectFit: 'cover',
              flexShrink: 0,
              borderTopRightRadius: '0px',
              borderBottomRightRadius: '0px',
            }}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl" style={{
              borderTopRightRadius: '0px',
              borderBottomRightRadius: '0px',
            }}>
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0 p-4">
        <h2
          className="font-bold mb-1 truncate"
          style={{
            fontSize: '16px',
            fontFamily: theme.primary_font || 'Poppins',
            color: primaryColor,
          }}
        >
          {product.name}
        </h2>
        <p
          className="text-sm mb-1 line-clamp-2"
          style={{
            fontFamily: theme.secondary_font || 'Inter',
            color: secondaryTextColor,
          }}
        >
          {product.description}
        </p>
        {includedIngredients.length > 0 && (
          <p
            className="text-xs italic line-clamp-1 mb-2"
            style={{
              fontFamily: theme.secondary_font || 'Inter',
              color: secondaryTextColor,
              opacity: 0.8,
            }}
          >
            {includedIngredients.join(', ')}
          </p>
        )}
        <div className="flex items-center gap-2">
          {hasDiscount && (
            <span
              className="text-sm line-through opacity-60"
              style={{
                fontFamily: theme.secondary_font || 'Poppins',
                color: secondaryTextColor,
              }}
            >
              {formatCurrency(minComparePrice, restaurant.settings.currency || 'USD')}
            </span>
          )}
          <span
            className="font-bold text-lg"
            style={{
              fontFamily: theme.secondary_font || 'Poppins',
              color: primaryColor,
            }}
          >
            {formatCurrency(minPrice, restaurant.settings.currency || 'USD')}
          </span>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
