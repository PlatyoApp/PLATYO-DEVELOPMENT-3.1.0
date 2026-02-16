import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Product, Order } from '../../types';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/currencyUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface OrderProductSelectorProps {
  products: Product[];
  orderItems: Order['items'];
  onAddItem: (product: Product, variationId: string, quantity: number, ingredientIds?: string[], specialNotes?: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onShowToast: (type: 'success' | 'error', title: string, message: string, duration: number) => void;
  currency?: string;
}

export const OrderProductSelector: React.FC<OrderProductSelectorProps> = ({
  products,
  orderItems,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onShowToast,
  currency = 'USD',
}) => {
  const { t } = useLanguage();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleAddProduct = () => {
    if (!selectedProductId || !selectedVariationId) {
      onShowToast('error', t('error'), t('errorSelectProductVariation'), 3000);
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      onAddItem(product, selectedVariationId, quantity, selectedIngredients);
      setSelectedProductId('');
      setSelectedVariationId('');
      setQuantity(1);
      setSelectedIngredients([]);
    }
  };

  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-4">{t('orderProducts')}</h3>

      {/* Add Product Form */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 gap-3">
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setSelectedVariationId('');
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('selectProduct')}</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <>
              <select
                value={selectedVariationId}
                onChange={(e) => setSelectedVariationId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('selectVariation')}</option>
                {selectedProduct.variations.map(variation => (
                  <option key={variation.id} value={variation.id}>
                    {variation.name} - {formatCurrency(variation.price, currency)}
                  </option>
                ))}
              </select>

              {selectedProduct.ingredients && selectedProduct.ingredients.filter(ing => ing.optional).length > 0 && (
                <div className="border border-gray-300 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('additionalIngredients')}:</p>
                  <div className="space-y-2">
                    {selectedProduct.ingredients
                      .filter(ingredient => ingredient.optional)
                      .map(ingredient => (
                        <label key={ingredient.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIngredients.includes(ingredient.id)}
                            onChange={() => toggleIngredient(ingredient.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {ingredient.name}
                            {ingredient.extra_cost && ingredient.extra_cost > 0 && (
                              <span className="text-gray-500"> (+{formatCurrency(ingredient.extra_cost, currency)})</span>
                            )}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder={t('quantity')}
            />
            <Button
              type="button"
              onClick={handleAddProduct}
              size="sm"
              className="flex-1"
            >
              {t('addProduct')}
            </Button>
          </div>
        </div>
      </div>

      {/* Order Items List */}
      {orderItems.length > 0 ? (
        <div className="space-y-2 mb-4">
          {orderItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.product.name}</p>
                <p className="text-xs text-gray-600">{item.variation.name}</p>
                {item.selected_ingredients && item.selected_ingredients.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.selected_ingredients
                      .filter((ing: any) => ing.optional === true)
                      .map((ing, idx) => {
                        const ingredient = typeof ing === 'object' ? ing : null;
                        return (
                          <p key={idx} className="text-xs text-blue-600">
                            + {ingredient?.name || ing}
                            {ingredient?.extra_cost && ingredient.extra_cost > 0 ? (
                              <span className="text-gray-500 ml-1">
                                (+{formatCurrency(ingredient.extra_cost, currency)})
                              </span>
                            ) : null}
                          </p>
                        );
                      })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-medium w-20 text-right">
                  {formatCurrency(item.total_price, currency)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">{t('subtotal')}:</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(orderItems.reduce((sum, item) => sum + item.total_price, 0), currency)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg mb-4">
          {t('noProductsAdded')}. {t('selectProductsToAdd')}.
        </p>
      )}
    </div>
  );
};
