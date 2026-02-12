import React, { useEffect, useState } from 'react';
import { Star, Trash2, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  status: string;
}

export const FeaturedProductsManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
    loadFeaturedProducts();
  }, [restaurant?.id]);

  const loadProducts = async () => {
    if (!restaurant?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    if (!restaurant?.id) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', restaurant.id)
        .single();

      if (error) throw error;

      const featuredIds = data?.settings?.promo?.featured_product_ids || [];
      setSelectedProductIds(featuredIds);
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else if (prev.length < 5) {
        return [...prev, productId];
      } else {
        showToast('Solo puedes seleccionar hasta 5 productos destacados', 'error');
        return prev;
      }
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleSave = async () => {
    if (!restaurant?.id) return;

    setSaving(true);
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', restaurant.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedSettings = {
        ...(currentData?.settings || {}),
        promo: {
          ...(currentData?.settings?.promo || {}),
          featured_product_ids: selectedProductIds
        }
      };

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ settings: updatedSettings })
        .eq('id', restaurant.id);

      if (updateError) throw updateError;

      showToast('Productos destacados guardados exitosamente', 'success');
    } catch (error) {
      console.error('Error saving featured products:', error);
      showToast('Error al guardar productos destacados', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
  const availableProducts = products.filter((p) => !selectedProductIds.includes(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productos Destacados</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selecciona hasta 5 productos para destacar en tu menú público
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Los productos destacados aparecerán en una sección especial de tu menú
            </p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Máximo 5 productos destacados</li>
              <li>Se muestran al inicio del menú público</li>
              <li>Ideal para promociones o productos populares</li>
              <li>Solo productos activos pueden ser destacados</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Productos Destacados
            </h2>
            <span className="text-sm text-gray-600">
              {selectedProductIds.length}/5
            </span>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No hay productos destacados seleccionados
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Selecciona productos de la lista disponible
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${product.price.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Productos Disponibles
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-3">Cargando productos...</p>
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">
                {products.length === 0
                  ? 'No tienes productos activos'
                  : 'Todos tus productos están destacados'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {availableProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleToggleProduct(product.id)}
                  disabled={selectedProductIds.length >= 5}
                  className={`w-full flex items-center gap-3 p-3 border rounded-lg text-left transition-colors ${
                    selectedProductIds.length >= 5
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${product.price.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <Star className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
};
