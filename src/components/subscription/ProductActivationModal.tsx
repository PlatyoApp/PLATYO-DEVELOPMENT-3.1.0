import { useState, useEffect } from 'react';
import { X, Package, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';
import { subscriptionService } from '../../services/subscriptionService';

interface ProductActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToActivate: Product;
  restaurantId: string;
  onSuccess: () => void;
}

export function ProductActivationModal({
  isOpen,
  onClose,
  productToActivate,
  restaurantId,
  onSuccess,
}: ProductActivationModalProps) {
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchActiveProducts();
    }
  }, [isOpen, restaurantId]);

  const fetchActiveProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveProducts(data || []);
    } catch (error) {
      console.error('Error fetching active products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!selectedProduct) return;

    try {
      setSwapping(true);
      const result = await subscriptionService.swapProductActivation(
        productToActivate.id,
        selectedProduct,
        restaurantId
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.error || 'Failed to swap products');
      }
    } catch (error) {
      console.error('Error swapping products:', error);
      alert('An error occurred while swapping products');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activate Product">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">
                Product Limit Reached
              </h4>
              <p className="text-sm text-amber-800">
                You've reached your plan's product limit. To activate this product, you need to either:
              </p>
              <ul className="mt-2 text-sm text-amber-800 list-disc list-inside space-y-1">
                <li>Archive another active product (swap below)</li>
                <li>Upgrade your plan for more product slots</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Product to Activate
          </h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              {productToActivate.images?.[0] ? (
                <img
                  src={productToActivate.images[0]}
                  alt={productToActivate.name}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {productToActivate.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {productToActivate.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-2">
          <ArrowRightLeft className="w-5 h-5 text-gray-400" />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Select Product to Archive
          </h4>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading products...</div>
          ) : activeProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active products found</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedProduct === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {product.description}
                      </p>
                    </div>
                    {selectedProduct === product.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={swapping}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSwap}
            disabled={!selectedProduct || swapping}
            className="flex-1"
          >
            {swapping ? 'Swapping...' : 'Swap Products'}
          </Button>
        </div>

        <div className="text-center pt-2">
          <a
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <TrendingUp className="w-4 h-4" />
            Or upgrade your plan
          </a>
        </div>
      </div>
    </Modal>
  );
}
