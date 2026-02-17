// src/pages/restaurant/MenuManagement.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Archive,
  ArchiveRestore
} from 'lucide-react';

import { Category, Product, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ProductForm } from '../../components/restaurant/ProductForm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatCurrency } from '../../utils/currencyUtils';
import { ProductActivationModal } from '../../components/subscription/ProductActivationModal';
import { UpgradeModal } from '../../components/subscription/UpgradeModal';
import { subscriptionService } from '../../services/subscriptionService';

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
  | 'blocked_by_plan_limit'
> & {
  category_id: string;
};

type GlobalStats = {
  total: number;
  active: number;
  out_of_stock: number;
  archived: number;
};

// Cache entries (memoria + sessionStorage)
type CachePayload = {
  // categories: Category[]; // (SIN USO) Categorías ya NO se cachean
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

  // ====== In-memory cache (más rápido que sessionStorage) ======
  const memoryCacheRef = useRef(
    new Map<
      string,
      {
        ts: number;
        payload: CachePayload;
      }
    >()
  );

  const makeCacheSignature = (restaurantId: string) =>
    `${restaurantId}|p:${page}|cat:${selectedCategory}|s:${debouncedSearchTerm}`;

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

  // ====== Global stats (para ALL sin búsqueda) ======
  const [globalStatsAll, setGlobalStatsAll] = useState<GlobalStats | null>(null);
  const [loadingGlobalStatsAll, setLoadingGlobalStatsAll] = useState(false);

  const currency = restaurant?.settings?.currency || 'USD';
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  // drag paging cooldown
  const dragPagingCooldownRef = useRef<number>(0);

  // ====== Subscription Limits ======
  const { limits, status, checkProductLimit, refresh: refreshLimits } = useSubscriptionLimits(restaurant?.id);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFilterArchived, setShowFilterArchived] = useState(false);
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [productToActivate, setProductToActivate] = useState<Product | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);

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
    loadArchivedProducts();
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

  const loadArchivedProducts = async () => {
    if (!restaurant?.id) return;

    const info = await subscriptionService.getArchivedProducts(restaurant.id);
    setArchivedProducts(info.products);
    setArchivedCount(info.count);
  };

  // ============================
  // ✅ CATEGORÍAS SIN CACHÉ
  // ============================
  const loadCategoriesNoCache = async () => {
    if (!restaurant?.id) return;

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon') // payload pequeño
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('name', { ascending: true }); // si tienes display_order, cambia a display_order

    if (error) {
      console.error('[MenuManagement] Error loading categories (no cache):', error);
      return;
    }

    setCategories((data as any) || []);
  };

  // Carga inicial de categorías (sin caché)
  useEffect(() => {
    if (!restaurant?.id) return;
    loadCategoriesNoCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  // Escuchar evento global para actualizar categorías al instante
  useEffect(() => {
    const handler = async (e: any) => {
      const eventRestaurantId = e?.detail?.restaurantId;
      if (eventRestaurantId && restaurant?.id && eventRestaurantId !== restaurant.id) return;

      // Recarga categorías inmediatamente (SIN tocar productos/caché)
      await loadCategoriesNoCache();
    };

    window.addEventListener('categories_updated', handler as any);
    return () => window.removeEventListener('categories_updated', handler as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  // Si la categoría seleccionada ya no existe (p. ej. se desactivó), vuelve a ALL
  useEffect(() => {
    if (selectedCategory === 'all') return;
    const exists = categories.some((c) => c.id === selectedCategory);
    if (!exists) setSelectedCategory('all');
  }, [categories, selectedCategory]);

  // ====== Cache helpers (no rompe si excede cuota) ======
  const saveCache = (payload: CachePayload) => {
    if (!restaurant?.id) return;

    // cache en memoria
    const sig = makeCacheSignature(restaurant.id);
    memoryCacheRef.current.set(sig, { ts: Date.now(), payload });

    // cache en sessionStorage (best-effort)
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

  const invalidateCache = () => {
    if (!restaurant?.id) return;

    // limpia memoria
    const prefix = `${restaurant.id}|`;
    for (const key of memoryCacheRef.current.keys()) {
      if (key.startsWith(prefix)) memoryCacheRef.current.delete(key);
    }

    // limpia sessionStorage
    try {
      sessionStorage.removeItem(cacheKey(restaurant.id));
    } catch {
      // ignore
    }
  };

  // ====== Menú (server-side search + category + pagination) con cache ======
  useEffect(() => {
    if (!restaurant?.id) return;

    const tryLoadFromMemoryCache = () => {
      const sig = makeCacheSignature(restaurant.id);
      const hit = memoryCacheRef.current.get(sig);
      if (!hit) return false;

      const isFresh = Date.now() - hit.ts < CACHE_TTL_MS;
      if (!isFresh) {
        memoryCacheRef.current.delete(sig);
        return false;
      }

      // setCategories(hit.payload.categories ?? []); // (SIN USO) ya NO cacheamos categorías
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
            // categories: cached.categories ?? [], // (SIN USO)
            products: cached.products ?? [],
            totalProducts: cached.totalProducts ?? 0
          };

          // rellena memoria
          const sig = makeCacheSignature(restaurant.id);
          memoryCacheRef.current.set(sig, { ts: cached.ts, payload });

          // setCategories(payload.categories); // (SIN USO)
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
  }, [restaurant?.id, page, selectedCategory, debouncedSearchTerm]);

  // Helper: construir query de productos (reutilizable para prefetch)
  const buildProductsQuery = async (pageToLoad: number) => {
    if (!restaurant?.id) return { data: null as any, error: new Error('No restaurant'), count: 0 as number };

    const from = (pageToLoad - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // 2) Si hay filtro de categoría, obtenemos IDs desde tabla puente (robusto)
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
            blocked_by_plan_limit,
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
            blocked_by_plan_limit,
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
    const res = await query.range(from, to);
    return res;
  };

  const loadMenuData = async () => {
    if (!restaurant?.id) return;

    setLoadingProducts(true);

    try {
      // ⚠️ YA NO cargamos categorías aquí (las carga loadCategoriesNoCache sin caché)
      // const categoriesQuery = supabase
      //   .from('categories')
      //   .select('id, name, icon')
      //   .eq('restaurant_id', restaurant.id)
      //   .eq('is_active', true);

      const productsQueryPromise = buildProductsQuery(page);

      const [{ data: productsData, error: productsError, count }] = await Promise.all([
        productsQueryPromise
      ]);

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
        products: productsWithCategory,
        totalProducts: total
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // ====== Global stats loader (solo ALL sin búsqueda) ======
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

  // ====== Prefetch página siguiente (solo ALL sin búsqueda; acelera “Siguiente”) ======
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

  // ====== Reorder global (solo en ALL y sin búsqueda) ======
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
      const limitCheck = await checkProductLimit();
      if (!limitCheck.canCreate) {
        showToast(
          'warning',
          'Límite de productos alcanzado',
          `Has alcanzado el límite de ${limitCheck.maxCount} productos de tu plan ${status?.planName || ''}. Actualiza tu plan para duplicar más productos.`,
          6000
        );
        setShowUpgradeModal(true);
        return;
      }

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
      const currentProduct = products.find((p) => p.id === productId);

      if (currentProduct?.status === 'archived' && newStatus === 'active') {
        const canActivate = await checkProductLimit();
        if (!canActivate.canCreate) {
          const fullProduct = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          if (fullProduct.data) {
            setProductToActivate(fullProduct.data as Product);
            setShowActivationModal(true);
          }
          return;
        }
      }

      const { error } = await supabase
        .from('products')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      invalidateCache();
      await loadMenuData();
      await loadArchivedProducts();
      await refreshLimits();

      showToast('success', t('statusUpdated'), `${t('productStatusChangedTo')} ${t(newStatus)}`, 3000);
    } catch (error: any) {
      console.error('Error changing product status:', error);
      showToast('error', 'Error', 'No se pudo cambiar el estado del producto');
    }
  };

  const handleSaveProduct = async (productData: any) => {
    if (!restaurant) return;

    try {
      if (!editingProductId) {
        const limitCheck = await checkProductLimit();
        if (!limitCheck.canCreate) {
          showToast(
            'warning',
            'Límite de productos alcanzado',
            `Has alcanzado el límite de ${limitCheck.maxCount} productos de tu plan ${status?.planName || ''}. Actualiza tu plan para agregar más productos.`,
            6000
          );
          setShowUpgradeModal(true);
          return;
        }
      }

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

  // ====== Stats de página memoizadas (evita filters repetidos) ======
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
            onClick={async () => {
              const limitCheck = await checkProductLimit();
              if (!limitCheck.canCreate) {
                setShowUpgradeModal(true);
                return;
              }
              setEditingProductId(null);
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
        {(loadingProducts || (shouldUseGlobalAllStats && loadingGlobalStatsAll)) ? (
          [...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-7 bg-gray-200 rounded w-12" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('totalProducts')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {shouldUseGlobalAllStats ? (globalStatsAll?.total ?? totalProducts) : pageStats.total}
                  </p>
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
                    {shouldUseGlobalAllStats ? (globalStatsAll?.active ?? 0) : pageStats.active}
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
                    {shouldUseGlobalAllStats ? (globalStatsAll?.out_of_stock ?? 0) : pageStats.out}
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
                    {shouldUseGlobalAllStats ? (globalStatsAll?.archived ?? 0) : pageStats.archived}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
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
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Package className="w-12 h-12 mb-2" />
                      <span className="text-sm">{t('noImage')}</span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {getStatusBadge(product.status)}
                    {product.blocked_by_plan_limit && (
                      <Badge variant="warning">Bloqueado</Badge>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600">{getCategoryName(product.category_id)}</p>
                  </div>

                  {product.blocked_by_plan_limit && (
                    <p className="text-xs text-orange-600 mb-2 font-medium">
                      Este producto excede el límite de tu plan. Elimínalo o actualiza tu plan.
                    </p>
                  )}

                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">{product.description}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(product.price || 0, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEditProduct(product)} />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateProduct(product)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4 text-blue-600" />
                      </Button>

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
            currentPlanMaxProducts={limits?.max_products}
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

      {productToActivate && (
        <ProductActivationModal
          isOpen={showActivationModal}
          onClose={() => {
            setShowActivationModal(false);
            setProductToActivate(null);
          }}
          productToActivate={productToActivate}
          restaurantId={restaurant?.id || ''}
          onSuccess={async () => {
            await loadMenuData();
            await loadArchivedProducts();
            await refreshLimits();
            showToast('success', 'Product Activated', 'Product was successfully activated', 3000);
          }}
        />
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={status?.planName || currentSubscription?.plan_name || 'Free'}
        reason="products"
        currentLimit={limits?.max_products}
      />

      {showFilterArchived && (
        <Modal
          isOpen={showFilterArchived}
          onClose={() => setShowFilterArchived(false)}
          title={`Archived Products (${archivedCount})`}
        >
          <div className="space-y-3">
            {archivedProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No archived products found</p>
            ) : (
              archivedProducts.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{product.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatCurrency(product.price || 0, currency)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      icon={ArchiveRestore}
                      onClick={async () => {
                        const canActivate = await checkProductLimit();
                        if (!canActivate.canCreate) {
                          setProductToActivate(product);
                          setShowActivationModal(true);
                          setShowFilterArchived(false);
                        } else {
                          const result = await subscriptionService.activateProduct(
                            product.id,
                            restaurant?.id || ''
                          );
                          if (result.success) {
                            await loadMenuData();
                            await loadArchivedProducts();
                            await refreshLimits();
                            showToast('success', 'Product Activated', 'Product was successfully activated', 3000);
                          } else {
                            showToast('error', 'Error', result.error || 'Failed to activate product');
                          }
                        }
                      }}
                    >
                      Activate
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
