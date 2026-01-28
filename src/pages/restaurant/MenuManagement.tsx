import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil as Edit,
  Trash2,
  Eye,
  Archive,
  AlertCircle,
  Search,
  Package,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  GripVertical,
  ExternalLink
} from 'lucide-react';
import { Category, Product, Restaurant, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ProductForm } from '../../components/restaurant/ProductForm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../utils/currencyUtils';

export const MenuManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; productId: string; productName: string }>({
    show: false,
    productId: '',
    productName: ''
  });
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);

  const handleActivateProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      await loadMenuData();

      showToast(
        'success',
        t('productActivatedTitle'),
        t('productActivatedMessage'),
        4000
      );
    } catch (error: any) {
      console.error('Error activating product:', error);
      showToast('error', 'Error', 'No se pudo activar el producto');
    }
  };

  const handleChangeProductStatus = async (productId: string, newStatus: Product['status']) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      await loadMenuData();

      showToast(
        'success',
        t('statusUpdated'),
        `${t('productStatusChangedTo')} ${t(newStatus)}`,
        3000
      );
    } catch (error: any) {
      console.error('Error changing product status:', error);
      showToast('error', 'Error', 'No se pudo cambiar el estado del producto');
    }
  };

  useEffect(() => {
    if (restaurant) {
      loadMenuData();
      loadSubscription();
    }
  }, [restaurant]);

  const loadSubscription = async () => {
    if (!restaurant?.id) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error loading subscription:', error);
      return;
    }

    setCurrentSubscription(data);
  };

  const loadMenuData = async () => {
    if (!restaurant?.id) return;

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    if (categoriesError) {
      console.error('Error loading categories:', categoriesError);
    }

    const { data: productsData } = await supabase
  .from('products')
  .select(`
    id,
    name,
    price,
    is_active,
    display_order,
    product_categories (
      category_id
    )
  `)
  .eq('restaurant_id', restaurant.id)
  .order('display_order', { ascending: true })
  .limit(20);


    if (productsError) {
      console.error('Error loading products:', productsError);
    }

    const productsWithCategories = (productsData || []).map((product: any) => ({
      ...product,
      category_id: product.product_categories?.[0]?.category_id || ''
    }));

    setCategories(categoriesData || []);
    setProducts(productsWithCategories);
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('active')}</Badge>;
      case 'draft':
        return <Badge variant="info">{t('draft')}</Badge>;
      case 'out_of_stock':
        return <Badge variant="warning">{t('outOfStock')}</Badge>;
      case 'archived':
        return <Badge variant="gray">{t('archived')}</Badge>;
      default:
        return <Badge variant="gray">{t('unknown')}</Badge>;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : t('unknownCategory');
  };

  const handleSaveProduct = async (productData: any) => {
    if (!restaurant) return;

    try {
      const minPrice = productData.variations && productData.variations.length > 0
        ? Math.min(...productData.variations.map((v: any) => v.price))
        : 0;

      const { category_id, ...productDataWithoutCategory } = productData;

      const dataToSave = {
        ...productDataWithoutCategory,
        price: minPrice
      };

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;

        if (category_id) {
          const { error: deleteCategoriesError } = await supabase
            .from('product_categories')
            .delete()
            .eq('product_id', editingProduct.id);

          if (deleteCategoriesError) throw deleteCategoriesError;

          const { error: insertCategoryError } = await supabase
            .from('product_categories')
            .insert({
              product_id: editingProduct.id,
              category_id: category_id
            });

          if (insertCategoryError) throw insertCategoryError;
        }
      } else {
        const maxDisplayOrder = Math.max(...products.map(p => (p as any).display_order || 0), -1);

        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            restaurant_id: restaurant.id,
            ...dataToSave,
            display_order: maxDisplayOrder + 1,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (category_id && newProduct) {
          const { error: categoryError } = await supabase
            .from('product_categories')
            .insert({
              product_id: newProduct.id,
              category_id: category_id
            });

          if (categoryError) throw categoryError;
        }
      }

      await loadMenuData();
      setShowProductModal(false);
      setEditingProduct(null);

      showToast(
        'success',
        editingProduct ? t('productUpdatedTitle') : t('productCreatedTitle'),
        editingProduct ? t('productUpdatedMessage') : t('productCreatedMessage'),
        4000
      );
    } catch (error: any) {
      console.error('Error saving product:', error);
      showToast('error', 'Error', error.message || 'No se pudo guardar el producto');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Clean up featured product IDs if this product was featured
      if (restaurant?.settings?.promo?.featured_product_ids?.includes(productId)) {
        const updatedFeaturedIds = restaurant.settings.promo.featured_product_ids.filter(
          (id: string) => id !== productId
        );

        await supabase
          .from('restaurants')
          .update({
            settings: {
              ...restaurant.settings,
              promo: {
                ...restaurant.settings.promo,
                featured_product_ids: updatedFeaturedIds
              }
            }
          })
          .eq('id', restaurant.id);
      }

      await loadMenuData();

      showToast(
        'info',
        t('productDeletedTitle'),
        t('productDeletedMessage'),
        4000
      );

      setDeleteConfirm({ show: false, productId: '', productName: '' });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showToast('error', 'Error', 'No se pudo eliminar el producto');
    }
  };

  const openDeleteConfirm = (product: Product) => {
    setDeleteConfirm({
      show: true,
      productId: product.id,
      productName: product.name
    });
  };

  const moveProductUp = async (productId: string) => {
    const currentIndex = filteredProducts.findIndex((p: Product) => p.id === productId);
    if (currentIndex <= 0) return;

    const currentProduct = filteredProducts[currentIndex];
    const previousProduct = filteredProducts[currentIndex - 1];

    try {
      const { error: error1 } = await supabase
        .from('products')
        .update({ display_order: previousProduct.display_order })
        .eq('id', currentProduct.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('products')
        .update({ display_order: currentProduct.display_order })
        .eq('id', previousProduct.id);

      if (error2) throw error2;

      await loadMenuData();

      showToast(
        'success',
        t('orderUpdatedTitle'),
        t('orderUpdatedMessage'),
        2000
      );
    } catch (error: any) {
      console.error('Error reordering product:', error);
      showToast('error', 'Error', 'No se pudo reordenar el producto');
    }
  };

  const moveProductDown = async (productId: string) => {
    const currentIndex = filteredProducts.findIndex((p: Product) => p.id === productId);
    if (currentIndex >= filteredProducts.length - 1) return;

    const currentProduct = filteredProducts[currentIndex];
    const nextProduct = filteredProducts[currentIndex + 1];

    try {
      const { error: error1 } = await supabase
        .from('products')
        .update({ display_order: nextProduct.display_order })
        .eq('id', currentProduct.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('products')
        .update({ display_order: currentProduct.display_order })
        .eq('id', nextProduct.id);

      if (error2) throw error2;

      await loadMenuData();

      showToast(
        'success',
        t('orderUpdatedTitle'),
        t('orderUpdatedMessage'),
        2000
      );
    } catch (error: any) {
      console.error('Error reordering product:', error);
      showToast('error', 'Error', 'No se pudo reordenar el producto');
    }
  };

  const handleDuplicateProduct = async (productId: string) => {
    if (!restaurant) return;

    const productToDuplicate = products.find((p: Product) => p.id === productId);
    if (!productToDuplicate) return;

    try {
      const maxDisplayOrder = Math.max(...products.map(p => (p as any).display_order || 0), -1);

      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurant.id,
          name: `${productToDuplicate.name} (${t('copyLabel')})`,
          description: productToDuplicate.description,
          images: productToDuplicate.images,
          variations: productToDuplicate.variations,
          ingredients: productToDuplicate.ingredients,
          dietary_restrictions: productToDuplicate.dietary_restrictions,
          spice_level: productToDuplicate.spice_level,
          preparation_time: productToDuplicate.preparation_time,
          status: productToDuplicate.status,
          sku: productToDuplicate.sku ? `${productToDuplicate.sku}-COPY` : '',
          is_available: productToDuplicate.is_available,
          is_featured: false,
          display_order: maxDisplayOrder + 1,
          price: productToDuplicate.variations && productToDuplicate.variations.length > 0
            ? Math.min(...productToDuplicate.variations.map(v => v.price))
            : 0
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (productToDuplicate.category_id && newProduct) {
        const { error: categoryError } = await supabase
          .from('product_categories')
          .insert({
            product_id: newProduct.id,
            category_id: productToDuplicate.category_id
          });

        if (categoryError) console.error('Error adding category:', categoryError);
      }

      await loadMenuData();

      showToast(
        'success',
        t('productDuplicatedTitle'),
        t('productDuplicatedMessage', { name: productToDuplicate.name }),
        4000
      );
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      showToast('error', 'Error', error.message || 'No se pudo duplicar el producto');
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      await loadMenuData();

      showToast(
        'info',
        t('productArchivedTitle'),
        t('productArchivedMessage'),
        4000
      );
    } catch (error: any) {
      console.error('Error archiving product:', error);
      showToast('error', 'Error', 'No se pudo archivar el producto');
    }
  };

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetProduct: Product) => {
    e.preventDefault();

    if (!draggedProduct || draggedProduct.id === targetProduct.id) {
      setDraggedProduct(null);
      return;
    }

    const draggedIndex = filteredProducts.findIndex((p: Product) => p.id === draggedProduct.id);
    const targetIndex = filteredProducts.findIndex((p: Product) => p.id === targetProduct.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    try {
      const reorderedProducts = [...filteredProducts];
      reorderedProducts.splice(draggedIndex, 1);
      reorderedProducts.splice(targetIndex, 0, draggedProduct);

      const updates = reorderedProducts.map((product, index) => ({
        id: product.id,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      await loadMenuData();
      setDraggedProduct(null);

      showToast(
        'success',
        t('orderUpdatedTitle'),
        t('productsReorderedMessage'),
        2000
      );
    } catch (error: any) {
      console.error('Error reordering products:', error);
      showToast('error', 'Error', 'No se pudo reordenar los productos');
      setDraggedProduct(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedProduct(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('productManagement')}</h1>
        <div className="flex gap-3">
          <a
            href={restaurant?.slug ? `/${restaurant.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!restaurant?.slug) {
                e.preventDefault();
                showToast('warning', 'No disponible', 'El menú público aún no está disponible', 3000);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            {t('viewMenu')}
          </a>
          <Button
            icon={Plus}
            onClick={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
          >
            {t('newProduct')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalProducts')}</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('active')}</p>
              <p className="text-2xl font-bold text-gray-900">{products.filter(p => p.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('outOfStock')}</p>
              <p className="text-2xl font-bold text-gray-900">{products.filter(p => p.status === 'out_of_stock').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('archived')}</p>
              <p className="text-2xl font-bold text-gray-900">{products.filter(p => p.status === 'archived').length}</p>
            </div>
          </div>
        </div>
      </div>

            {/* Search and Category Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('all')} ({products.filter(p =>
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
            ).length})
          </button>

          {categories.map(category => {
            const categoryProductCount = products.filter(p => {
              const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
              return p.category_id === category.id && matchesSearch;
            }).length;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.icon && <span>{category.icon}</span>}
                <span>{category.name}</span>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                  selectedCategory === category.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {categoryProductCount}
                </span>
              </button>
            );
          })}
        </div>

        {searchTerm === '' && filteredProducts.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <GripVertical className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p>
              <strong className="text-blue-700">{t('tipLabel')}:</strong> {t('dragToReorder')}
            </p>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? t('noProductsFound') : t('noProductsInCategory')}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? t('tryDifferentSearch') : t('createFirstProduct')}
          </p>

          {!searchTerm && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
            >
              {t('create')} {t('newProduct')}
            </Button>
          )}
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
            >
              {t('clearSearch')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              draggable={searchTerm === ''}
              onDragStart={(e) => handleDragStart(e, product)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, product)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all overflow-hidden group ${
                searchTerm === '' ? 'cursor-move' : ''
              } ${
                draggedProduct?.id === product.id
                  ? 'opacity-50 scale-95 border-blue-400'
                  : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
              }`}
            >
              {/* Product Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-12 h-12 mb-2" />
                    <span className="text-sm">{t('noImage')}</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(product.status)}
                </div>
                {product.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg">
                    +{product.images.length - 1}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getCategoryName(product.category_id)}
                  </p>
                </div>

                <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>

                {/* Price Range */}
                <div className="mb-4">
                  {product.variations.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(Math.min(...product.variations.map(v => v.price)), restaurant?.settings?.currency || 'USD')}
                        </span>
                        {product.variations.length > 1 && (
                          <span className="text-sm font-normal text-gray-600">
                            - {formatCurrency(Math.max(...product.variations.map(v => v.price)), restaurant?.settings?.currency || 'USD')}
                          </span>
                        )}
                      </div>
                      {product.variations.some(v => v.compare_at_price && v.compare_at_price > v.price) && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(Math.min(...product.variations.filter(v => v.compare_at_price).map(v => v.compare_at_price!)), restaurant?.settings?.currency || 'USD')}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                            {t('offer')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ArrowUp}
                      onClick={() => moveProductUp(product.id)}
                      className="text-blue-600 hover:text-blue-700"
                      title={t('moveUp')}
                      disabled={filteredProducts[0]?.id === product.id}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ArrowDown}
                      onClick={() => moveProductDown(product.id)}
                      className="text-blue-600 hover:text-blue-700"
                      title={t('moveDown')}
                      disabled={filteredProducts[filteredProducts.length - 1]?.id === product.id}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleEditProduct(product)}
                      title={t('editProduct')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Copy}
                      onClick={() => handleDuplicateProduct(product.id)}
                      className="text-purple-600 hover:text-purple-700"
                      title={t('duplicateProduct')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => openDeleteConfirm(product)}
                      className="text-red-600 hover:text-red-700"
                      title={t('deleteProduct')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={product.status}
                      onChange={(e) => handleChangeProductStatus(product.id, e.target.value as Product['status'])}
                      className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="active">{t('active')}</option>
                      <option value="out_of_stock">{t('outOfStock')}</option>
                      <option value="archived">{t('archived')}</option>
                    </select>
                    {product.sku && (
                      <span className="text-xs text-gray-500">
                        {product.sku}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? `${t('edit')} ${t('newProduct')}` : t('newProduct')}
        size="xl"
      >
        <ProductForm
          categories={categories}
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, productId: '', productName: '' })}
        onConfirm={() => handleDeleteProduct(deleteConfirm.productId)}
        title={t('deleteProductQuestion')}
        message={t('deleteProductWarning')}
        confirmText={t('deleteProduct')}
        cancelText={t('cancel')}
        variant="danger"
        itemName={deleteConfirm.productName}
      />
    </div>
  );
};
