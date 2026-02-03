// src/pages/restaurant/MenuManagement.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil as Edit,
  Trash2,
  Archive,
  AlertCircle,
  Search,
  Package,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  GripVertical,
  ExternalLink
} from 'lucide-react';

import { Category, Product, Subscription } from '../../types';
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

type ProductListItem = Pick<
  Product,
  | 'id'
  | 'restaurant_id'
  | 'name'
  | 'description'
  | 'images'
  | 'status'
  | 'sku'
  | 'is_available'
  | 'is_featured'
  | 'display_order'
  | 'price'
  | 'updated_at'
> & {
  // Para UI (en ALL lo resolvemos desde product_categories)
  category_id: string;
};

export const MenuManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // ====== Config ======
  const PAGE_SIZE = 12;
  const CACHE_TTL_MS = 60_000; // 60s
  const cacheKey = (restaurantId: string) => `menu_cache_v2:${restaurantId}`;

  // ====== State ======
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);

  // Lazy edit
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingEditingProduct, setLoadingEditingProduct] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    productId: string;
    productName: string;
  }>({ show: false, productId: '', productName: '' });

  const [draggedProduct, setDraggedProduct] = useState<ProductListItem | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const currency = restaurant?.settings?.currency || 'USD';
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  // ====== Debounce búsqueda ======
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Reset a página 1 cuando cambien filtros/búsqueda (server-side)
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, debouncedSearchTerm]);

  // ====== Subscription ======
  useEffect(() => {
    if (!restaurant?.id) return;
    loadSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

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

  // ====== Cache helpers ======
  const saveCache = (payload: {
    categories: Category[];
    products: ProductListItem[];
    totalProducts: number;
  }) => {
    if (!restaurant?.id) return;
    sessionStorage.setItem(
      cacheKey(restaurant.id),
      JSON.stringify({
        ts: Date.now(),
        page,
        selectedCategory,
        search: debouncedSearchTerm,
        ...payload
      })
    );
  };

  const invalidateCache = () => {
    if (!restaurant?.id) return;
    sessionStorage.removeItem(cacheKey(restaurant.id));
  };

  // ====== Menú (server-side search + category + pagination) con cache ======
  useEffect(() => {
    if (!restaurant?.id) return;

    const tryLoadFromCache = () => {
      const raw = sessionStorage.getItem(cacheKey(restaurant.id));
      if (!raw) return false;

      try {
        const cached = JSON.parse(raw);
        const isFresh = Date.now() - cached.ts < CACHE_TTL_MS;

        if (
          isFresh &&
          cached.page === page &&
          cached.selectedCategory === selectedCategory &&
          cached.search === debouncedSearchTerm
        ) {
          setCategories(cached.categories ?? []);
          setProducts(cached.products ?? []);
          setTotalProducts(cached.totalProducts ?? 0);
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    if (tryLoadFromCache()) return;

    loadMenuData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id, page, selectedCategory, debouncedSearchTerm]);

  const loadMenuData = async () => {
    if (!restaurant?.id) return;

    // 1) categorías
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    if (categoriesError) console.error('Error loading categories:', categoriesError);
    const safeCategories = categoriesData || [];
    setCategories(safeCategories);

    setLoadingProducts(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // 2) Si hay filtro de categoría, obtenemos IDs desde tabla puente (robusto)
    let productIdsForCategory: string[] | null = null;

    if (selectedCategory !== 'all') {
      const { data: pcData, error: pcError } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', selectedCategory);

      if (pcError) {
        console.error('Error loading product_categories:', pcError);
        setLoadingProducts(false);
        return;
      }

      productIdsForCategory = (pcData ?? []).map((r: any) => r.product_id);

      if (productIdsForCategory.length === 0) {
        setProducts([]);
        setTotalProducts(0);
        setLoadingProducts(false);
        saveCache({ categories: safeCategories, products: [], totalProducts: 0 });
        return;
      }
    }

    // 3) Query base ligera
    //    En ALL incluimos product_categories(category_id) para mostrar la categoría correcta
    let query = supabase
      .from('products')
      .select(
        selectedCategory === 'all'
          ? `
            id,
            restaurant_id,
            name,
            description,
            images,
            status,
            sku,
            is_available,
            is_featured,
            display_order,
            price,
            updated_at,
            product_categories ( category_id )
          `
          : `
            id,
            restaurant_id,
            name,
            description,
            images,
            status,
            sku,
            is_available,
            is_featured,
            display_order,
            price,
            updated_at
          `,
        { count: 'exact' }
      )
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true });

    // 4) búsqueda server-side
    if (debouncedSearchTerm) {
      const s = debouncedSearchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%,sku.ilike.%${s}%`);
    }

    // 5) filtro categoría por IDs
    if (productIdsForCategory) {
      query = query.in('id', productIdsForCategory);
    }

    // 6) paginación
    const { data: productsData, error: productsError, count } = await query.range(from, to);

    setLoadingProducts(false);

    if (productsError) {
      console.error('Error loading products:', productsError);
      return;
    }

    const total = count ?? 0;
    setTotalProducts(total);

    // 7) category_id
    const productsWithCategory: ProductListItem[] = (productsData ?? []).map((p: any) => ({
      ...p,
      category_id:
        selectedCategory === 'all'
          ? (p.product_categories?.[0]?.category_id || '')
          : selectedCategory
    }));

    setProducts(productsWithCategory);

    saveCache({
      categories: safeCategories,
      products: productsWithCategory,
      totalProducts: total
    });
  };

  // ====== UI helpers ======
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
    if (!categoryId) return t('unknownCategory');
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : t('unknownCategory');
  };

  // ====== Status ======
  const handleChangeProductStatus = async (productId: string, newStatus: Product['status']) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      invalidateCache();
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

  // ====== Save (create/edit) ======
  const handleSaveProduct = async (productData: any) => {
    if (!restaurant) return;

    try {
      const minPrice =
        productData.variations && productData.variations.length > 0
          ? Math.min(...productData.variations.map((v: any) => v.price))
          : 0;

      const { category_id, ...productDataWithoutCategory } = productData;

      const dataToSave = {
        ...productDataWithoutCategory,
        price: minPrice
      };

      if (editingProductId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProductId);

        if (updateError) throw updateError;

        if (category_id) {
          const { error: deleteCategoriesError } = await supabase
            .from('product_categories')
            .delete()
            .eq('product_id', editingProductId);

          if (deleteCategoriesError) throw deleteCategoriesError;

          const { error: insertCategoryError } = await supabase.from('product_categories').insert({
            product_id: editingProductId,
            category_id
          });

          if (insertCategoryError) throw insertCategoryError;
        }
      } else {
        const maxDisplayOrder = Math.max(...products.map((p) => (p as any).display_order || 0), -1);

        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            restaurant_id: restaurant.id,
            ...dataToSave,
            display_order: maxDisplayOrder + 1
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        if (category_id && newProduct) {
          const { error: categoryError } = await supabase.from('product_categories').insert({
            product_id: newProduct.id,
            category_id
          });
          if (categoryError) throw categoryError;
        }
      }

      setShowProductModal(false);
      setEditingProductId(null);
      setEditingProduct(null);

      invalidateCache();
      await loadMenuData();

      showToast(
        'success',
        editingProductId ? t('productUpdatedTitle') : t('productCreatedTitle'),
        editingProductId ? t('productUpdatedMessage') : t('productCreatedMessage'),
        4000
      );
    } catch (error: any) {
      console.error('Error saving product:', error);
      showToast('error', 'Error', error.message || 'No se pudo guardar el producto');
    }
  };

  // ====== Lazy edit fetch ======
  useEffect(() => {
    const fetchEditingProduct = async () => {
      if (!showProductModal) return;

      if (!editingProductId) {
        setEditingProduct(null);
        return;
      }

      setLoadingEditingProduct(true);

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories ( category_id )
        `
        )
        .eq('id', editingProductId)
        .single();

      setLoadingEditingProduct(false);

      if (error) {
        console.error('Error loading product detail:', error);
        showToast('error', 'Error', 'No se pudo cargar el producto');
        return;
      }

      const fullProduct = {
        ...data,
        category_id: data.product_categories?.[0]?.category_id || ''
      };

      setEditingProduct(fullProduct as any);
    };

    fetchEditingProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProductModal, editingProductId]);

  const handleEditProduct = (product: ProductListItem) => {
    setEditingProductId(product.id);
    setShowProductModal(true);
  };

  // ====== Delete ======
  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

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

      setDeleteConfirm({ show: false, productId: '', productName: '' });

      invalidateCache();
      await loadMenuData();

      showToast('info', t('productDeletedTitle'), t('productDeletedMessage'), 4000);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showToast('error', 'Error', 'No se pudo eliminar el producto');
    }
  };

  const openDeleteConfirm = (product: ProductListItem) => {
    setDeleteConfirm({
      show: true,
      productId: product.id,
      productName: product.name
    });
  };

  // ====== Duplicate ======
  const handleDuplicateProduct = async (productId: string) => {
    if (!restaurant) return;

    try {
      const { data: productToDuplicate, error: fetchError } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories ( category_id )
        `
        )
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;
      if (!productToDuplicate) return;

      const category_id = productToDuplicate.product_categories?.[0]?.category_id || '';
      const maxDisplayOrder = Math.max(...products.map((p) => (p as any).display_order || 0), -1);

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
          price:
            productToDuplicate.variations && productToDuplicate.variations.length > 0
              ? Math.min(...productToDuplicate.variations.map((v: any) => v.price))
              : productToDuplicate.price || 0
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (category_id && newProduct) {
        const { error: categoryError } = await supabase.from('product_categories').insert({
          product_id: newProduct.id,
          category_id
        });
        if (categoryError) console.error('Error adding category:', categoryError);
      }

      invalidateCache();
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

  // ====== Archive ======
  const handleArchiveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      invalidateCache();
      await loadMenuData();

      showToast('info', t('productArchivedTitle'), t('productArchivedMessage'), 4000);
    } catch (error: any) {
      console.error('Error archiving product:', error);
      showToast('error', 'Error', 'No se pudo archivar el producto');
    }
  };

  // ====== Drag handlers (sin ordenamiento global aquí) ======
  const handleDragStart = (e: React.DragEvent, product: ProductListItem) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, _targetProduct: ProductListItem) => {
    e.preventDefault();
    setDraggedProduct(null);
    showToast('info', 'Info', 'El orden global se gestiona en el menú público (lista completa).', 2500);
  };

  const handleDragEnd = () => setDraggedProduct(null);

  const moveProductUp = async (_productId: string) => {
    showToast('info', 'Info', 'El orden global se gestiona en el menú público.', 2500);
  };

  const moveProductDown = async (_productId: string) => {
    showToast('info', 'Info', 'El orden global se gestiona en el menú público.', 2500);
  };

  return (
    <div className="p-6">
      {/* Header */}
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
              setEditingProductId(null);
              setEditingProduct(null);
              setShowProductModal(true);
            }}
          >
            {t('newProduct')}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalProducts')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
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
              <p className="text-2xl font-bold text-gray-900">
                {products.filter((p) => p.status === 'active').length}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {products.filter((p) => p.status === 'out_of_stock').length}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {products.filter((p) => p.status === 'archived').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + category filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('all')}
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {(category as any).icon && <span>{(category as any).icon}</span>}
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {searchTerm === '' && products.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <GripVertical className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p>
              <strong className="text-blue-700">{t('tipLabel')}:</strong> {t('dragToReorder')}
            </p>
          </div>
        )}
      </div>

      {/* Grid */}
      {loadingProducts ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
          Cargando productos...
        </div>
      ) : products.length === 0 ? (
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
                setEditingProductId(null);
                setEditingProduct(null);
                setShowProductModal(true);
              }}
            >
              {t('create')} {t('newProduct')}
            </Button>
          )}

          {searchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              {t('clearSearch')}
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {products.map((product) => (
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
                {/* Image */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  {product.images?.length > 0 ? (
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

                  <div className="absolute top-2 right-2">{getStatusBadge(product.status)}</div>

                  {product.images?.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg">
                      +{product.images.length - 1}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600">{getCategoryName(product.category_id)}</p>
                  </div>

                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{product.description}</p>

                  {/* Price precomputed */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(product.price || 0, currency)}
                      </span>
                    </div>
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
                        disabled={products[0]?.id === product.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowDown}
                        onClick={() => moveProductDown(product.id)}
                        className="text-blue-600 hover:text-blue-700"
                        title={t('moveDown')}
                        disabled={products[products.length - 1]?.id === product.id}
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
                        onChange={(e) =>
                          handleChangeProductStatus(product.id, e.target.value as Product['status'])
                        }
                        className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="active">{t('active')}</option>
                        <option value="out_of_stock">{t('outOfStock')}</option>
                        <option value="archived">{t('archived')}</option>
                      </select>

                      {product.sku && <span className="text-xs text-gray-500">{product.sku}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalProducts > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-6 bg-white p-3 rounded-lg shadow border">
              <div className="text-sm text-gray-600">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong> · {totalProducts}{' '}
                productos
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProductId(null);
          setEditingProduct(null);
        }}
        title={editingProductId ? `${t('edit')} ${t('newProduct')}` : t('newProduct')}
        size="xl"
      >
        {loadingEditingProduct ? (
          <div className="p-6 text-sm text-gray-600">Cargando producto...</div>
        ) : (
          <ProductForm
            categories={categories}
            product={editingProduct}
            onSave={handleSaveProduct}
            onCancel={() => {
              setShowProductModal(false);
              setEditingProductId(null);
              setEditingProduct(null);
            }}
          />
        )}
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
