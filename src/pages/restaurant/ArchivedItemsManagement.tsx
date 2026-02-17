import React, { useState, useEffect } from 'react';
import { Archive, FolderX, RotateCcw, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../utils/currencyUtils';
import type { Product, Category } from '../../types';

export function ArchivedItemsManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [inactiveCategories, setInactiveCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [restaurant, setRestaurant] = useState<{ id: string; name: string } | null>(null);
  const { limits, checkProductLimit } = useSubscriptionLimits(restaurant?.id);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadRestaurant();
  }, [user]);

  useEffect(() => {
    if (restaurant) {
      loadArchivedItems();
    }
  }, [restaurant]);

  const loadRestaurant = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setRestaurant(data);
    } catch (error) {
      console.error('Error loading restaurant:', error);
      showToast('Error al cargar restaurante', 'error');
    }
  };

  const loadArchivedItems = async () => {
    if (!restaurant) return;

    setLoading(true);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'archived')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', false)
          .order('created_at', { ascending: false })
      ]);

      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setArchivedProducts(productsResult.data || []);
      setInactiveCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error loading archived items:', error);
      showToast(t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateProduct = async (product: Product) => {
    const limitCheck = await checkProductLimit();

    if (!limitCheck.canCreate) {
      showToast(limitCheck.message, 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) throw error;

      showToast(`${product.name} reactivado exitosamente`, 'success');
      loadArchivedItems();
    } catch (error) {
      console.error('Error reactivating product:', error);
      showToast('Error al reactivar el producto', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      showToast('Producto eliminado permanentemente', 'success');
      loadArchivedItems();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Error al eliminar el producto', 'error');
    }
  };

  const handleReactivateCategory = async (category: Category) => {
    if (!limits) return;

    const activeCount = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant?.id)
      .eq('is_active', true);

    if (activeCount.count !== null && activeCount.count >= limits.maxCategories) {
      showToast(
        `Has alcanzado el límite de ${limits.maxCategories} categorías activas. Desactiva otras categorías primero.`,
        'error'
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', category.id);

      if (error) throw error;

      showToast(`${category.name} reactivada exitosamente`, 'success');
      loadArchivedItems();
    } catch (error) {
      console.error('Error reactivating category:', error);
      showToast('Error al reactivar la categoría', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      showToast('Categoría eliminada permanentemente', 'success');
      loadArchivedItems();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Error al eliminar la categoría', 'error');
    }
  };

  const filteredProducts = archivedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = inactiveCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('manageArchivedItems')}
        </h1>
        <p className="text-gray-600">
          Visualiza y gestiona todos los productos archivados y categorías desactivadas
        </p>
      </div>

      {limits && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-1">
                Límites del plan actual
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Productos: {limits.activeProducts} / {limits.maxProducts}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderX className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Categorías: {limits.activeCategories} / {limits.maxCategories}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Archive className="w-5 h-5" />
                {t('products')} ({archivedProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FolderX className="w-5 h-5" />
                {t('categories')} ({inactiveCategories.length})
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'products' ? (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No hay productos archivados</p>
                  <p className="text-sm text-gray-500">
                    Los productos archivados aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Archive className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{product.name}</h3>
                              {product.sku && (
                                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                              )}
                              <p className="text-lg font-bold text-gray-900 mt-1">
                                {formatCurrency(product.price)}
                              </p>
                            </div>
                            <Badge variant="gray">{t('archived')}</Badge>
                          </div>

                          {product.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => handleReactivateProduct(product)}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Reactivar
                            </Button>
                            <Button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Eliminar Producto',
                                  message: 'Esta acción eliminará permanentemente el producto',
                                  itemName: product.name,
                                  onConfirm: () => handleDeleteProduct(product.id),
                                });
                              }}
                              variant="danger"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No hay categorías desactivadas</p>
                  <p className="text-sm text-gray-500">
                    Las categorías desactivadas aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FolderX className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                                <Badge variant="gray">Desactivada</Badge>
                              </div>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => handleReactivateCategory(category)}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Reactivar
                            </Button>
                            <Button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Eliminar Categoría',
                                  message: 'Esta acción eliminará permanentemente la categoría',
                                  itemName: category.name,
                                  onConfirm: () => handleDeleteCategory(category.id),
                                });
                              }}
                              variant="danger"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        itemName={confirmDialog.itemName}
      />
    </div>
  );
}
