// src/pages/restaurant/MenuManagement.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Plus,
  Pencil as Edit,
  Trash2,
  AlertCircle,
  Search,
  Package,
  GripVertical,
  ExternalLink,
  Copy,
  CheckCircle,
  Archive
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

type GlobalStats = {
  total: number;
  active: number;
  out_of_stock: number;
  archived: number;
};

type CachePayload = {
  categories: Category[];
  products: ProductListItem[];
  totalProducts: number;
};

export const MenuManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // ====== Config ======
  const PAGE_SIZE = 12;
  const CACHE_TTL_MS = 60_000;
  const cacheKey = (restaurantId: string) => `menu_cache_v3:${restaurantId}`;

  // ====== In-memory cache ======
  const memoryCacheRef = useRef(
    new Map<
      string,
      {
        ts: number;
        payload: CachePayload;
      }
    >()
  );

  // ✅ NUEVO: para saltarse el cache una vez cuando cambian categorías
  const bypassCacheOnceRef = useRef(false);

  // ====== State ======
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingEditingProduct, setLoadingEditingProduct] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    productId: string;
    productName: string;
  }>({ show: false, productId: '', productName: '' });

  const [draggedProduct, setDraggedProduct] = useState<ProductListItem | null>(null);

  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [globalStatsAll, setGlobalStatsAll] = useState<GlobalStats | null>(null);
  const [loadingGlobalStatsAll, setLoadingGlobalStatsAll] = useState(false);

  const currency = restaurant?.settings?.currency || 'USD';
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  const dragPagingCooldownRef = useRef<number>(0);

  const makeCacheSignature = useCallback(
    (restaurantId: string) => `${restaurantId}|p:${page}|cat:${selectedCategory}|s:${debouncedSearchTerm}`,
    [page, selectedCategory, debouncedSearchTerm]
  );

  // ====== Debounce búsqueda ======
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

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
  const saveCache = (payload: CachePayload) => {
    if (!restaurant?.id) return;

    const sig = makeCacheSignature(restaurant.id);
    memoryCacheRef.current.set(sig, { ts: Date.now(), payload });

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
      console.warn('[MenuManagement] Cache skipped (quota/storage error):', err);
    }
  };

  const invalidateCache = useCallback(() => {
    if (!restaurant?.id) return;

    const prefix = `${restaurant.id}|`;
    for (const key of memoryCacheRef.current.keys()) {
      if (key.startsWith(prefix)) memoryCacheRef.current.delete(key);
    }

    try {
      sessionStorage.removeItem(cacheKey(restaurant.id));
    } catch {
      // ignore
    }
  }, [restaurant?.id]);

  // ✅ NUEVO: refrescar SOLO categorías (rápido)
  const refreshCategoriesOnly = useCallback(async () => {
    if (!restaurant?.id) return;

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    if (error) {
      console.error('[MenuManagement] refreshCategoriesOnly error:', error);
      return;
    }

    setCategories((data as any) || []);
  }, [restaurant?.id]);

  /**
   * ✅ NUEVO (importante):
   * Cuando se crea/edita una categoría en otra vista, nos saltamos el cache 1 vez
   * y refrescamos categorías inmediatamente.
   */
  useEffect(() => {
    const handler = async (e: any) => {
      const eventRestaurantId = e?.detail?.restaurantId;
      if (eventRestaurantId && restaurant?.id && eventRestaurantId !== restaurant.id) return;

      bypassCacheOnceRef.current = true; // <- evita que el efecto de cache pise el state
      invalidateCache();

      await refreshCategoriesOnly();

      // Si la categoría seleccionada ya no existe (o se desactivó), volvemos a ALL
      setSelectedCategory((prev) => {
        if (prev === 'all') return prev;
        const stillExists = (e?.detail?.categoryId)
          ? true
          : true; // no dependemos del payload; validamos con state después
        // validación real:
        // (usamos una función para no depender del closure viejo)
        return prev;
      });
    };

    window.addEventListener('categories_updated', handler as any);
    return () => window.removeEventListener('categories_updated', handler as any);
  }, [restaurant?.id, invalidateCache, refreshCategoriesOnly]);

  // ✅ NUEVO: si la categoría seleccionada deja de existir, caemos a ALL
  useEffect(() => {
    if (selectedCategory === 'all') return;
    const exists = categories.some((c) => c.id === selectedCategory);
    if (!exists) setSelectedCategory('all');
  }, [categories, selectedCategory]);

  // ====== Menú con cache ======
  useEffect(() => {
    if (!restaurant?.id) return;

    // ✅ NUEVO: si acabamos de recibir categories_updated, saltamos cache una vez
    if (bypassCacheOnceRef.current) {
      bypassCacheOnceRef.current = false;
      loadMenuData();
      return;
    }

    const tryLoadFromMemoryCache = () => {
      const sig = makeCacheSignature(restaurant.id);
      const hit = memoryCacheRef.current.get(sig);
      if (!hit) return false;

      const isFresh = Date.now() - hit.ts < CACHE_TTL_MS;
      if (!isFresh) {
        memoryCacheRef.current.delete(sig);
        return false;
      }

      setCategories(hit.payload.categories ?? []);
      setProducts(hit.payload.products ?? []);
      setTotalProducts(hit.payload.totalProducts ?? 0);
      return true;
    };

    const tryLoadFromSessionCache = () => {
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
          const payload: CachePayload = {
            categories: cached.categories ?? [],
            products: cached.products ?? [],
            totalProducts: cached.totalProducts ?? 0
          };

          const sig = makeCacheSignature(restaurant.id);
          memoryCacheRef.current.set(sig, { ts: cached.ts, payload });

          setCategories(payload.categories);
          setProducts(payload.products);
          setTotalProducts(payload.totalProducts);
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    if (tryLoadFromMemoryCache()) return;
    if (tryLoadFromSessionCache()) return;

    loadMenuData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id, page, selectedCategory, debouncedSearchTerm, makeCacheSignature]);

  // Helper: construir query de productos
  const buildProductsQuery = async (pageToLoad: number) => {
    if (!restaurant?.id) return { data: null as any, error: new Error('No restaurant'), count: 0 as number };

    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let productIdsForCategory: string[] | null = null;

    if (selectedCategory !== 'all') {
      const { data: pcData, error: pcError } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', selectedCategory);

      if (pcError) return { data: null as any, error: pcError, count: 0 as number };

      productIdsForCategory = (pcData ?? []).map((r: any) => r.product_id);

      if (productIdsForCategory.length === 0) {
        return { data: [] as any, error: null, count: 0 as number };
      }
    }

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

    if (debouncedSearchTerm) {
      const s = debouncedSearchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%,sku.ilike.%${s}%`);
    }

    if (productIdsForCategory) {
      query = query.in('id', productIdsForCategory);
    }

    return await query.range(from, to);
  };

  const loadMenuData = async () => {
    if (!restaurant?.id) return;

    setLoadingProducts(true);

    try {
      const categoriesQuery = supabase
        .from('categories')
        .select('id, name, icon')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true);

      const productsQueryPromise = buildProductsQuery(page);

      const [
        { data: categoriesData, error: categoriesError },
        { data: productsData, error: productsError, count }
      ] = await Promise.all([categoriesQuery, productsQueryPromise]);

      if (categoriesError) console.error('Error loading categories:', categoriesError);
      const safeCategories = (categoriesData as any) || [];
      setCategories(safeCategories);

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
    } finally {
      setLoadingProducts(false);
    }
  };

  // ====== Global stats loader ======
  const shouldUseGlobalAllStats = selectedCategory === 'all' && debouncedSearchTerm === '';

  useEffect(() => {
    if (!restaurant?.id) return;

    if (!shouldUseGlobalAllStats) {
      setGlobalStatsAll(null);
      setLoadingGlobalStatsAll(false);
      return;
    }

    let cancelled = false;

    const countByStatus = async (status?: Product['status']) => {
      let q = supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id);

      if (status) q = q.eq('status', status);

      const { count, error } = await q;
      if (error) throw error;
      if (count == null) throw new Error('Count was null (check RLS/permissions).');
      return count;
    };

    const loadGlobalAllStats = async () => {
      setLoadingGlobalStatsAll(true);
      try {
        const [total, active, out_of_stock, archived] = await Promise.all([
          countByStatus(undefined),
          countByStatus('active'),
          countByStatus('out_of_stock'),
          countByStatus('archived')
        ]);

        if (cancelled) return;
        setGlobalStatsAll({ total, active, out_of_stock, archived });
      } catch (err) {
        console.error('[MenuManagement] Global ALL stats failed:', err);
        if (cancelled) return;
        setGlobalStatsAll(null);
      } finally {
        if (!cancelled) setLoadingGlobalStatsAll(false);
      }
    };

    loadGlobalAllStats();

    return () => {
      cancelled = true;
    };
  }, [restaurant?.id, shouldUseGlobalAllStats]);

  // ====== Prefetch página siguiente ======
  useEffect(() => {
    if (!restaurant?.id) return;
    if (!shouldUseGlobalAllStats) return;
    if (loadingProducts) return;
    if (page >= totalPages) return;

    let cancelled = false;

    const prefetch = async () => {
      const nextPage = page + 1;

      const sig = `${restaurant.id}|p:${nextPage}|cat:${selectedCategory}|s:${debouncedSearchTerm}`;
      const hit = memoryCacheRef.current.get(sig);
      if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return;

      try {
        const { data: productsData, error, count } = await buildProductsQuery(nextPage);
        if (cancelled) return;
        if (error) return;

        const productsWithCategory: ProductListItem[] = (productsData ?? []).map((p: any) => ({
          ...p,
          category_id: p.product_categories?.[0]?.category_id || ''
        }));

        const payload: CachePayload = {
          categories,
          products: productsWithCategory,
          totalProducts: count ?? totalProducts
        };

        memoryCacheRef.current.set(sig, { ts: Date.now(), payload });
      } catch {
        // ignore
      }
    };

    prefetch();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id, shouldUseGlobalAllStats, page, totalPages, loadingProducts]);

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

  // ====== Reorder global ======
  const canReorder = selectedCategory === 'all' && debouncedSearchTerm === '';

  const persistDisplayOrders = async (updates: { id: string; display_order: number }[]) => {
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

  // ====== DUPLICAR ======
  const handleDuplicateProduct = async (product: ProductListItem) => {
    if (!restaurant?.id) return;

    try {
      const { data: full, error: fullError } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .eq('restaurant_id', restaurant.id)
        .single();

      if (fullError) throw fullError;

      const maxDisplayOrder = Math.max(...products.map((p) => (p as any).display_order || 0), -1);

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

      insertPayload.restaurant_id = restaurant.id;

      const { data: inserted, error: insertError } = await supabase
        .from('products')
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (product.category_id) {
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

  // ====== Status / CRUD ======
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

  const pageStats = useMemo(() => {
    let active = 0;
    let out = 0;
    let archived = 0;

    for (const p of products) {
      if (p.status === 'active') active++;
      else if (p.status === 'out_of_stock') out++;
      else if (p.status === 'archived') archived++;
    }

    return {
      total: products.length,
      active,
      out,
      archived
    };
  }, [products]);

  // ===== UI =====
  return (
    <div className="p-6">
      {/* ... tu JSX sin cambios ... */}

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
            onRefreshCategories={refreshCategoriesOnly}
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
