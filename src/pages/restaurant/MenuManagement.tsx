import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // ajusta a tu ruta real
import { useToast } from '../../components/ui/use-toast'; // ajusta
import { Button } from '../../components/ui/button'; // ajusta
import { Input } from '../../components/ui/input'; // ajusta
import { Badge } from '../../components/ui/badge'; // ajusta
import { Modal } from '../../components/ui/modal'; // ajusta
import ProductForm from '../../components/restaurant/ProductForm'; // ajusta
import ConfirmDialog from '../../components/ui/confirm-dialog'; // ajusta

type Category = {
  id: string;
  name: string;
  is_active?: boolean;
  display_order?: number;
};

type ProductListItem = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  images: string[] | null;
  status: string;
  sku: string | null;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  price: number | null;
  updated_at: string | null;
  // derived
  category_id: string | null;
};

type ProductDetail = ProductListItem & {
  // campos pesados SOLO en detalle (no en listado)
  variations?: any;
  ingredients?: any;
  // agrega aquí lo que tu ProductForm necesite realmente
};

const PAGE_SIZE = 12;

// Cache: solo “listado ligero” y por página/filtros, con TTL y protección de cuota.
const CACHE_TTL_MS = 60_000; // 1 min (ajusta)
const CACHE_VERSION = 'v4';  // sube versión si cambias estructura
const cacheKey = (restaurantId: string) => `menu_cache_${CACHE_VERSION}:${restaurantId}`;

// Guardamos un caché compacto: categorías + última respuesta de productos (página actual)
type MenuCache = {
  ts: number;
  categories: Category[];
  lastQuery: {
    selectedCategory: string;
    search: string;
    page: number;
  };
  products: ProductListItem[];
  total: number;
};

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    // preferimos sessionStorage para evitar persistencia infinita
    sessionStorage.setItem(key, value);
    return true;
  } catch (e) {
    // Si es QuotaExceededError u otro, NO rompemos la app
    console.warn('[MenuManagement] Cache disabled (quota or storage error):', e);
    return false;
  }
}

function safeGetItem(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    console.warn('[MenuManagement] Cache read error:', e);
    return null;
  }
}

function debounce<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function MenuManagement() {
  const { toast } = useToast();

  // Aquí asumo que ya tienes el restaurant en algún contexto/hook.
  // Sustituye esto por tu hook real (por ejemplo useRestaurant()).
  const restaurant = (window as any).__CURRENT_RESTAURANT__ as { id: string } | null;

  const restaurantId = restaurant?.id ?? '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const [page, setPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalProducts / PAGE_SIZE)), [totalProducts]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = debounce(searchTerm.trim(), 300);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);

  // Para evitar dobles cargas si React StrictMode dispara efectos en dev:
  const didInitRef = useRef(false);

  const getCategoryName = useCallback(
    (categoryId: string | null) => {
      if (!categoryId) return 'Sin categoría';
      const c = categories.find((x) => x.id === categoryId);
      return c?.name ?? 'Sin categoría';
    },
    [categories]
  );

  // Si cambias filtro o búsqueda -> volver a página 1
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, debouncedSearch]);

  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,is_active,display_order')
      .eq('restaurant_id', restaurantId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    setCategories((data ?? []) as Category[]);
    return (data ?? []) as Category[];
  }, [restaurantId]);

  const buildProductsQuery = useCallback(async () => {
    // Necesitamos category_id para ALL (para no ver “Unknown Category”)
    // Lo traemos desde product_categories pero SOLO category_id, ligero.
    // OJO: esto asume 1 categoría por producto. Si hay varias, tomamos la primera.
    let q = supabase
      .from('products')
      .select(
        `
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
        product_categories:product_categories(category_id)
      `,
        { count: 'exact' }
      )
      .eq('restaurant_id', restaurantId);

    // Filtro por categoría (server-side)
    if (selectedCategory !== 'all') {
      // Filtramos por la tabla puente
      q = q.in(
        'id',
        supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_id', selectedCategory)
          .eq('restaurant_id', restaurantId) as any
      ) as any;
      // Nota: Supabase JS no soporta subquery directa “in(select…)” en todos los casos.
      // Si tu SDK falla aquí, usa el enfoque 2 (más abajo) con query previa de ids.
    }

    // Búsqueda global (server-side)
    if (debouncedSearch) {
      // Búsqueda por name/description/sku
      // Para description null, ilike funciona igual.
      q = q.or(
        `name.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`
      );
    }

    // Orden por display_order (orden global)
    q = q.order('display_order', { ascending: true });

    // Paginación
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    q = q.range(from, to);

    return q;
  }, [restaurantId, selectedCategory, debouncedSearch, page]);

  // Enfoque 2 (robusto): si tu Supabase no acepta el “in(subquery)” arriba,
  // hacemos primero fetch de IDs de categoría y luego q.in('id', ids).
  const getProductIdsForCategory = useCallback(async () => {
    if (selectedCategory === 'all') return null;

    const { data, error } = await supabase
      .from('product_categories')
      .select('product_id')
      .eq('restaurant_id', restaurantId)
      .eq('category_id', selectedCategory);

    if (error) throw error;

    const ids = (data ?? []).map((x: any) => x.product_id).filter(Boolean);
    return ids;
  }, [restaurantId, selectedCategory]);

  const loadProducts = useCallback(async () => {
    // Si NO es ALL, resolvemos ids primero (evita problemas de subquery)
    let productIds: string[] | null = null;
    if (selectedCategory !== 'all') {
      productIds = await getProductIdsForCategory();
      if (!productIds || productIds.length === 0) {
        setProducts([]);
        setTotalProducts(0);
        return { products: [], total: 0 };
      }
    }

    let q = supabase
      .from('products')
      .select(
        `
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
        product_categories:product_categories(category_id)
      `,
        { count: 'exact' }
      )
      .eq('restaurant_id', restaurantId);

    if (productIds) q = q.in('id', productIds);

    if (debouncedSearch) {
      q = q.or(
        `name.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`
      );
    }

    q = q.order('display_order', { ascending: true });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    q = q.range(from, to);

    const { data, error, count } = await q;

    if (error) throw error;

    const list: ProductListItem[] = (data ?? []).map((p: any) => {
      const pc = Array.isArray(p.product_categories) ? p.product_categories : [];
      const category_id = pc?.[0]?.category_id ?? (selectedCategory !== 'all' ? selectedCategory : null);

      return {
        id: p.id,
        restaurant_id: p.restaurant_id,
        name: p.name,
        description: p.description ?? null,
        images: p.images ?? null,
        status: p.status ?? 'active',
        sku: p.sku ?? null,
        is_available: !!p.is_available,
        is_featured: !!p.is_featured,
        display_order: typeof p.display_order === 'number' ? p.display_order : 0,
        price: typeof p.price === 'number' ? p.price : (p.price ?? null),
        updated_at: p.updated_at ?? null,
        category_id,
      };
    });

    setProducts(list);
    setTotalProducts(count ?? list.length);

    return { products: list, total: count ?? list.length };
  }, [restaurantId, selectedCategory, debouncedSearch, page, getProductIdsForCategory]);

  const loadMenuData = useCallback(async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      // 1) Intentar cache rápido (solo si coincide con query actual)
      const raw = safeGetItem(cacheKey(restaurantId));
      const cached = safeParseJSON<MenuCache>(raw);

      const isFresh =
        cached &&
        Date.now() - cached.ts < CACHE_TTL_MS &&
        cached.lastQuery.selectedCategory === selectedCategory &&
        cached.lastQuery.search === debouncedSearch &&
        cached.lastQuery.page === page;

      if (isFresh) {
        setCategories(cached.categories);
        setProducts(cached.products);
        setTotalProducts(cached.total);
        setLoading(false);

        // revalidación en segundo plano (opcional)
        // no return; para actualizar si cambió algo, pero sin bloquear
      }

      // 2) Cargar real desde server
      const cats = await loadCategories();
      const { products: prods, total } = await loadProducts();

      // 3) Guardar cache COMPACTO y seguro (si falla, no rompe)
      const payload: MenuCache = {
        ts: Date.now(),
        categories: cats,
        lastQuery: { selectedCategory, search: debouncedSearch, page },
        products: prods,
        total,
      };

      safeSetItem(cacheKey(restaurantId), JSON.stringify(payload));

    } catch (e: any) {
      console.error('[MenuManagement] loadMenuData error:', e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo cargar el menú',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, toast, loadCategories, loadProducts, selectedCategory, debouncedSearch, page]);

  useEffect(() => {
    if (!restaurantId) return;
    // Evitar doble init en dev si te molesta
    if (didInitRef.current) {
      loadMenuData();
      return;
    }
    didInitRef.current = true;
    loadMenuData();
  }, [restaurantId, loadMenuData]);

  // ====== Detalle lazy para edición ======
  const openEdit = useCallback(async (productId: string) => {
    setEditingProductId(productId);
    setEditingProduct(null);
    setIsEditModalOpen(true);
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*') // SOLO para detalle
        .eq('id', productId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (error) throw error;

      const detail: ProductDetail = {
        ...(data as any),
        category_id: null, // lo resolvemos si quieres; opcional
      };

      setEditingProduct(detail);
    } catch (e: any) {
      console.error('[MenuManagement] load product detail error:', e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo cargar el producto',
        variant: 'destructive',
      });
      setIsEditModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }, [restaurantId, toast]);

  const closeEdit = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingProductId(null);
    setEditingProduct(null);
  }, []);

  // ====== DUPLICAR (restaurado) ======
  const handleDuplicateProduct = useCallback(async (product: ProductListItem) => {
    try {
      // Traer detalle (para duplicar completo si lo necesitas)
      const { data: full, error: fullErr } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .eq('restaurant_id', restaurantId)
        .single();

      if (fullErr) throw fullErr;

      // Nuevo display_order: al final del orden global
      const maxOrder = Math.max(0, ...products.map((p) => p.display_order || 0));
      const copyName = `${full.name} (copia)`;

      const insertPayload: any = {
        ...full,
        id: undefined, // que Postgres genere uno nuevo
        name: copyName,
        display_order: maxOrder + 1,
        created_at: undefined,
        updated_at: undefined,
      };

      const { data: inserted, error: insErr } = await supabase
        .from('products')
        .insert(insertPayload)
        .select('id,restaurant_id,name,description,images,status,sku,is_available,is_featured,display_order,price,updated_at')
        .single();

      if (insErr) throw insErr;

      // Duplicar relación de categoría si existe
      if (product.category_id) {
        await supabase.from('product_categories').insert({
          restaurant_id: restaurantId,
          product_id: inserted.id,
          category_id: product.category_id,
        });
      }

      toast({ title: 'Producto duplicado', description: 'Se creó una copia al final del listado.' });

      // Refrescar solo si estás en ALL sin búsqueda (porque el orden global se ve)
      // Si estás filtrado/paginado, la copia puede no aparecer en la página actual.
      await loadMenuData();
    } catch (e: any) {
      console.error('[MenuManagement] duplicate error:', e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo duplicar el producto',
        variant: 'destructive',
      });
    }
  }, [restaurantId, products, toast, loadMenuData]);

  // ====== ORDENAMIENTO Up/Down (soluciona el error típico) ======
  // NOTA: esto modifica display_order global.
  // Recomendación: permitirlo solo cuando NO hay búsqueda activa y category=all,
  // para evitar confusiones con el orden global.
  const canReorderGlobal = useMemo(() => selectedCategory === 'all' && !debouncedSearch, [selectedCategory, debouncedSearch]);

  const swapDisplayOrder = useCallback(async (a: ProductListItem, b: ProductListItem) => {
    // Swap atómico (lo más simple). Si tu RLS lo permite, esto funciona.
    // Si falla por RLS, verás el error real en consola.
    const aOrder = a.display_order;
    const bOrder = b.display_order;

    // optimista local
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === a.id) return { ...p, display_order: bOrder };
        if (p.id === b.id) return { ...p, display_order: aOrder };
        return p;
      }).sort((x, y) => x.display_order - y.display_order)
    );

    // persistir
    const { error: e1 } = await supabase
      .from('products')
      .update({ display_order: bOrder })
      .eq('id', a.id)
      .eq('restaurant_id', restaurantId);

    if (e1) throw e1;

    const { error: e2 } = await supabase
      .from('products')
      .update({ display_order: aOrder })
      .eq('id', b.id)
      .eq('restaurant_id', restaurantId);

    if (e2) throw e2;
  }, [restaurantId]);

  const moveUp = useCallback(async (p: ProductListItem) => {
    if (!canReorderGlobal) {
      toast({ title: 'Orden global', description: 'Desactiva búsqueda y usa ALL para reordenar.' });
      return;
    }
    const sorted = [...products].sort((x, y) => x.display_order - y.display_order);
    const idx = sorted.findIndex((x) => x.id === p.id);
    if (idx <= 0) return;
    const prev = sorted[idx - 1];

    try {
      await swapDisplayOrder(p, prev);
      toast({ title: 'Orden actualizado' });
    } catch (e: any) {
      console.error('[MenuManagement] moveUp error:', e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo reordenar el producto',
        variant: 'destructive',
      });
      // fallback: recargar
      loadMenuData();
    }
  }, [products, canReorderGlobal, swapDisplayOrder, toast, loadMenuData]);

  const moveDown = useCallback(async (p: ProductListItem) => {
    if (!canReorderGlobal) {
      toast({ title: 'Orden global', description: 'Desactiva búsqueda y usa ALL para reordenar.' });
      return;
    }
    const sorted = [...products].sort((x, y) => x.display_order - y.display_order);
    const idx = sorted.findIndex((x) => x.id === p.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const next = sorted[idx + 1];

    try {
      await swapDisplayOrder(p, next);
      toast({ title: 'Orden actualizado' });
    } catch (e: any) {
      console.error('[MenuManagement] moveDown error:', e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo reordenar el producto',
        variant: 'destructive',
      });
      loadMenuData();
    }
  }, [products, canReorderGlobal, swapDisplayOrder, toast, loadMenuData]);

  // ====== Eliminar (ejemplo) ======
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      toast({ title: 'Producto eliminado' });
      setDeleteTarget(null);

      // refrescar página
      await loadMenuData();
    } catch (e: any) {
      console.error('[MenuManagement] delete error:', e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo eliminar',
        variant: 'destructive',
      });
    }
  }, [deleteTarget, restaurantId, toast, loadMenuData]);

  // ===== UI =====
  if (!restaurantId) {
    return <div className="p-6">No hay restaurante cargado.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, descripción o SKU…"
            className="w-[320px]"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-2 py-2"
          >
            <option value="all">ALL</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {!canReorderGlobal && (
            <Badge variant="secondary">
              Reordenar solo en ALL y sin búsqueda
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadMenuData()} disabled={loading}>
            Refrescar
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {loading ? 'Cargando…' : `Mostrando ${products.length} de ${totalProducts} productos`}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {products.map((p) => (
          <div key={p.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {getCategoryName(p.category_id)}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(p.id)}>
                  Editar
                </Button>

                <Button size="sm" variant="outline" onClick={() => handleDuplicateProduct(p)}>
                  Duplicar
                </Button>

                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(p)}>
                  Eliminar
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                {typeof p.price === 'number' ? `$ ${p.price.toLocaleString()}` : '—'}
              </div>

              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => moveUp(p)} disabled={!canReorderGlobal}>
                  ↑
                </Button>
                <Button size="sm" variant="ghost" onClick={() => moveDown(p)} disabled={!canReorderGlobal}>
                  ↓
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Orden: {p.display_order}
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setPage((x) => Math.max(1, x - 1))}
          disabled={page <= 1 || loading}
        >
          Anterior
        </Button>

        <div className="text-sm">
          Página <b>{page}</b> de <b>{totalPages}</b>
        </div>

        <Button
          variant="outline"
          onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
          disabled={page >= totalPages || loading}
        >
          Siguiente
        </Button>
      </div>

      {/* Modal edición */}
      <Modal open={isEditModalOpen} onOpenChange={(v) => (!v ? closeEdit() : null)} title="Editar producto">
        {loadingDetail ? (
          <div className="p-4">Cargando detalle…</div>
        ) : (
          <ProductForm
            product={editingProduct}
            productId={editingProductId}
            onCancel={closeEdit}
            onSaved={async () => {
              closeEdit();
              await loadMenuData();
            }}
          />
        )}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto"
        description={`¿Seguro que quieres eliminar "${deleteTarget?.name}"?`}
        confirmText="Eliminar"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
