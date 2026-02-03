// src/pages/restaurant/MenuManagement.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Pencil as Edit,
  Trash2,
  AlertCircle,
  Search,
  Package,
  GripVertical,
  ExternalLink,
  Copy
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
  category_id: string;
};

export const MenuManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // ====== Config ======
  const PAGE_SIZE = 12;
  const CACHE_TTL_MS = 60_000;
  const cacheKey = (restaurantId: string) => `menu_cache_v3:${restaurantId}`;

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

  // drag paging cooldown
  const dragPagingCooldownRef = useRef<number>(0);

  // ====== Debounce búsqueda ======
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(id);
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

  // ====== Cache helpers (ARREGLADO: no rompe si excede cuota) ======
  const saveCache = (payload: { categories: Category[]; products: ProductListItem[]; totalProducts: number }) => {
    if (!restaurant?.id) return;
    try {
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
    } catch (err) {
      // IMPORTANT: no romper la app por el cache
      console.warn('[MenuManagement] Cache skipped (quota/storage error):', err);
    }
  };

  const invalidateCache = () => {
    if (!restaurant?.id) return;
    try {
      sessionStorage.removeItem(cacheKey(restaurant.id));
    } catch {
      // ignore
    }
  };

  // ====== Menú (server-side search + category + pagination) con cache ======
  useEffect(() => {
    if (!restaurant?.id) return;

    const tryLoadFromCache = () => {
      let raw: string | null = null;
      try {
        raw = sessionStorage.getItem(cacheKey(restaurant.id));
      } catch {
        return false;
      }
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

  // ====== Reorder global (solo en ALL y sin búsqueda) ======
  const canReorder = selectedCategory === 'all' && debouncedSearchTerm === '';

  const persistDisplayOrders = async (updates: { id: string; display_order: number }[]) => {
    // En paralelo para que no sea tan lento (y reduzca timeouts)
    const jobs = updates.map((u) =>
      supabase
        .from('products')
        .update({ display_order: u.display_order, updated_at: new Date().toISOString() })
        .eq('id', u.id)
    );

    const results = await Promise.all(jobs);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw firstError;
  };

  const reorderGlobalByInsert = async (draggedId: string, targetId: string, place: 'before' | 'after') => {
    // Necesitamos el orden global real (ids+display_order).
    if (!restaurant?.id) return;

    const { data: allData, error } = await supabase
      .from('products')
      .select('id, display_order')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    const sorted = (allData || []).map((x: any) => ({ id: x.id, display_order: x.display_order || 0 }));

    const fromIndex = sorted.findIndex((x) => x.id === draggedId);
    const toIndex = sorted.findIndex((x) => x.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const working = [...sorted];
    const [dragged] = working.splice(fromIndex, 1);

    const insertIndex =
      place === 'before'
        ? (toIndex > fromIndex ? toIndex - 1 : toIndex)
        : (toIndex > fromIndex ? toIndex : toIndex + 1);

    working.splice(insertIndex, 0, dragged);

    const start = Math.min(fromIndex, insertIndex);
    const end = Math.max(fromIndex, insertIndex);

    const affected = working.slice(start, end + 1);
    const originalOrders = sorted
      .slice(start, end + 1)
      .map((x) => x.display_order)
      .sort((a, b) => a - b);

    const updates = affected.map((x, i) => ({ id: x.id, display_order: originalOrders[i] }));

    await persistDisplayOrders(updates);

    invalidateCache();
    await loadMenuData();
  };

  const moveDraggedToPageEdge = async (edge: 'start' | 'end') => {
    if (!draggedProduct) return;
    if (products.length === 0) return;

    const target = edge === 'start' ? products[0] : products[products.length - 1];
    await reorderGlobalByInsert(draggedProduct.id, target.id, edge === 'start' ? 'before' : 'after');
  };

  const maybeTurnPageWhileDragging = (direction: 'prev' | 'next') => {
    if (!draggedProduct) return;
    const now = Date.now();
    if (now - dragPagingCooldownRef.current < 450) return;
    dragPagingCooldownRef.current = now;

    setPage((p) => {
      if (direction === 'prev') return Math.max(1, p - 1);
      return Math.min(totalPages, p + 1);
    });
  };

  // ====== Drag handlers ======
  const handleDragStart = (e: React.DragEvent, product: ProductListItem) => {
    if (!canReorder) return;
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnItem = async (e: React.DragEvent, targetProduct: ProductListItem) => {
    e.preventDefault();

    if (!canReorder) return;

    if (!draggedProduct || draggedProduct.id === targetProduct.id) {
      setDraggedProduct(null);
      return;
    }

    try {
      await reorderGlobalByInsert(draggedProduct.id, targetProduct.id, 'before');
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'No se pudo reordenar el producto');
    } finally {
      setDraggedProduct(null);
    }
  };

  const handleDropOnPageStart = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!canReorder) return;

    try {
      await moveDraggedToPageEdge('start');
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'No se pudo reordenar el producto');
    } finally {
      setDraggedProduct(null);
    }
  };

  const handleDropOnPageEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!canReorder) return;

    try {
      await moveDraggedToPageEdge('end');
    } catch (err) {
      console.error(err);
      showToast('error', 'Error', 'No se pudo reordenar el producto');
    } finally {
      setDraggedProduct(null);
    }
  };

  const handleDragEnd = () => setDraggedProduct(null);

  // ====== DUPLICAR (AÑADIDO) ======
  const handleDuplicateProduct = async (product: ProductListItem) => {
    if (!restaurant?.id) return;

    try {
      // 1) Traer detalle completo del producto a duplicar
      const { data: full, error: fullError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .eq('restaurant_id', restaurant.id)
        .single();

      if (fullError) throw fullError;

      // 2) Calcular nuevo display_order al final
      const maxDisplayOrder = Math.max(...products.map((p) => (p as any).display_order || 0), -1);

      // 3) Preparar copia (limpiar campos que no deben clonarse)
      const nowIso = new Date().toISOString();
      const copyName = `${full.name} (Copia)`;

      const insertPayload: any = {
        ...full,
        id: undefined,
        name: copyName,
        display_order: maxDisplayOrder + 1,
        created_at: undefined,
        updated_at: nowIso
      };

      // Asegurar restaurant_id
      insertPayload.restaurant_id = restaurant.id;

      // 4) Insertar el producto duplicado
      const { data: inserted, error: insertError } = await supabase
        .from('products')
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertError) throw insertError;

      // 5) Copiar categoría (si existe)
      if (product.category_id) {
        // limpia relaciones previas por si tu tabla tiene constraints (normalmente no hace falta, pero es seguro)
        await supabase.from('product_categories').insert({
          product_id: inserted.id,
          category_id: product.category_id
        });
      }

      invalidateCache();
      await loadMenuData();

      showToast('success', 'Duplicado', 'Producto duplicado correctamente', 3000);
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      showToast('error', 'Error', error?.message || 'No se pudo duplicar el producto');
    }
  };

  // ====== Status / CRUD (igual) ======
  const handleChangeProductStatus = async (productId: string, newStatus: Product['status']) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      invalidateCache();
      await loadMenuData();

      showToast('success', t('statusUpdated'), `${t('productStatusChangedTo')} ${t(newStatus)}`, 3000);
    } catch (error: any) {
      console.error('Error changing product status:', error);
      showToast('error', 'Error', 'No se pudo cambiar el estado del producto');
    }
  };

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

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

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
    setDeleteConfirm({ show: true, productId: product.id, productName: product.name });
  };

  // ===== UI =====
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
              setEditingProductId(null);
              setEditingProduct(null);
              setShowProductModal(true);
            }}
          >
            {t('newProduct')}
          </Button>
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

        {canReorder && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <GripVertical className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p>
              <strong className="text-blue-700">{t('tipLabel')}:</strong> Arrastra un producto, pasa por “Anterior/Siguiente” para cambiar de página, y suelta sobre otro producto (o en la franja superior/inferior).
            </p>
          </div>
        )}

        {!canReorder && (
          <div className="text-xs text-gray-500">
            Para reordenar con drag-and-drop, selecciona <strong>ALL</strong> y limpia la búsqueda.
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
        </div>
      ) : (
        <>
          {/* Drop zone: inicio de página */}
          {canReorder && draggedProduct && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDropOnPageStart}
              className="mb-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm px-4 py-2"
            >
              Suelta aquí para mover al inicio de esta página
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                draggable={canReorder}
                onDragStart={(e) => handleDragStart(e, product)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnItem(e, product)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all overflow-hidden group ${
                  canReorder ? 'cursor-move' : ''
                } ${
                  draggedProduct?.id === product.id
                    ? 'opacity-50 scale-95 border-blue-400'
                    : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
                }`}
              >
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
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600">{getCategoryName(product.category_id)}</p>
                  </div>

                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{product.description}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(product.price || 0, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Acciones (AQUÍ se restaura Duplicar) */}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEditProduct(product)} />

<Button
  variant="ghost"
  size="sm"
  icon={Copy}
  iconClassName="text-blue-600"
  onClick={() => handleDuplicateProduct(product)}
/>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => openDeleteConfirm(product)}
                        className="text-red-600 hover:text-red-700"
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
                      {product.sku && <span className="text-xs text-gray-500">{product.sku}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Drop zone: final de página */}
          {canReorder && draggedProduct && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDropOnPageEnd}
              className="mt-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm px-4 py-2"
            >
              Suelta aquí para mover al final de esta página
            </div>
          )}

          {/* Pagination */}
          {totalProducts > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-6 bg-white p-3 rounded-lg shadow border">
              <div className="text-sm text-gray-600">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong> · {totalProducts} productos
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  onDragEnter={() => canReorder && maybeTurnPageWhileDragging('prev')}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  onDragEnter={() => canReorder && maybeTurnPageWhileDragging('next')}
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
