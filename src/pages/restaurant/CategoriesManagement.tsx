import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  Image as ImageIcon,
  FolderOpen,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Category, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SubscriptionExpiredBanner } from '../../components/subscription/SubscriptionExpiredBanner';
import { SubscriptionBlocker } from '../../components/subscription/SubscriptionBlocker';
import { UpgradeModal } from '../../components/subscription/UpgradeModal';

export const CategoriesManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ===== Config =====
  const CACHE_TTL_MS = 60_000;
  const cacheKey = (restaurantId: string) => `categories_cache_v3:${restaurantId}`;
  const PAGE_SIZE = 15;

  // ===== State =====
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    categoryId: string;
    categoryName: string;
  }>({ show: false, categoryId: '', categoryName: '' });

  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);

  // Para cambiar de página mientras arrastras (evita spam)
  const dragPagingCooldownRef = useRef<number>(0);

  // ===== Subscription Limits =====
  const { limits, status, checkCategoryLimit, refresh: refreshLimits } = useSubscriptionLimits(restaurant?.id);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ===== Debounce búsqueda =====
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 250);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

  // Cuando cambia búsqueda, vuelve a página 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // ===== Cache helpers =====
  const saveCache = (cats: Category[]) => {
    if (!restaurant?.id) return;
    sessionStorage.setItem(
      cacheKey(restaurant.id),
      JSON.stringify({ ts: Date.now(), categories: cats })
    );
  };

  const invalidateCache = () => {
    if (!restaurant?.id) return;
    sessionStorage.removeItem(cacheKey(restaurant.id));
  };

  const tryLoadFromCache = () => {
    if (!restaurant?.id) return false;
    const raw = sessionStorage.getItem(cacheKey(restaurant.id));
    if (!raw) return false;

    try {
      const cached = JSON.parse(raw);
      const isFresh = Date.now() - cached.ts < CACHE_TTL_MS;
      if (!isFresh) return false;
      if (Array.isArray(cached.categories)) {
        setCategories(cached.categories);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  // ===== Initial load =====
  useEffect(() => {
    if (!restaurant?.id) return;

    const loaded = tryLoadFromCache();
    if (!loaded) loadCategories();
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

  const loadCategories = async () => {
    if (!restaurant?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('categories')
      .select('id, restaurant_id, name, description, icon, display_order, is_active, created_at, updated_at')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true });

    setLoading(false);

    if (error) {
      console.error('Error loading categories:', error);
      showToast('error', 'Error', 'No se pudieron cargar las categorías');
      return;
    }

    const cats = (data || []) as Category[];
    setCategories(cats);
    saveCache(cats);
  };

  // ===== Derived =====
  const filteredCategories = useMemo(() => {
    if (!debouncedSearchTerm) return categories;
    const q = debouncedSearchTerm.toLowerCase();
    return categories.filter((c) => {
      const n = c.name?.toLowerCase() || '';
      const d = (c.description || '').toLowerCase();
      return n.includes(q) || d.includes(q);
    });
  }, [categories, debouncedSearchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));

  // Ajuste de page si queda fuera de rango
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedCategories = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    return filteredCategories.slice(from, to);
  }, [filteredCategories, page]);

  // ===== CRUD =====
  const handleSave = async () => {
    if (!restaurant || !formData.name.trim()) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            description: formData.description,
            icon: formData.icon
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        setCategories((prev) => {
          const next = prev.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: formData.name.trim(), description: formData.description, icon: formData.icon }
              : c
          );
          saveCache(next);
          return next;
        });
      } else {
        const maxOrder = Math.max(...categories.map((c) => c.display_order || 0), 0);

        const { data: inserted, error } = await supabase
          .from('categories')
          .insert({
            restaurant_id: restaurant.id,
            name: formData.name.trim(),
            description: formData.description,
            icon: formData.icon,
            display_order: maxOrder + 1,
            is_active: true
          })
          .select('id, restaurant_id, name, description, icon, display_order, is_active, created_at, updated_at')
          .single();

        if (error) throw error;

        setCategories((prev) => {
          const next = [...prev, inserted as Category].sort(
            (a, b) => (a.display_order || 0) - (b.display_order || 0)
          );
          saveCache(next);
          return next;
        });
      }

      handleCloseModal();
      invalidateCache();

      showToast(
        'success',
        editingCategory ? t('categoryUpdated') : t('categoryCreated'),
        editingCategory ? t('messageCategoryUpdated') : t('messageCategoryCreated'),
        4000
      );
    } catch (error: any) {
      console.error('Error saving category:', error);
      showToast('error', 'Error', error.message || 'No se pudo guardar la categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;

      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== categoryId);
        saveCache(next);
        return next;
      });

      showToast('info', t('categoryDeleted'), t('messageCategoryDeleted'), 4000);
      setDeleteConfirm({ show: false, categoryId: '', categoryName: '' });
      invalidateCache();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showToast('error', 'Error', error.message || 'No se pudo eliminar la categoría');
    }
  };

  const openDeleteConfirm = (category: Category) => {
    setDeleteConfirm({ show: true, categoryId: category.id, categoryName: category.name });
  };

  const toggleActive = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    try {
      const nextActive = !category.is_active;

      const { error } = await supabase
        .from('categories')
        .update({ is_active: nextActive })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories((prev) => {
        const next = prev.map((c) => (c.id === categoryId ? { ...c, is_active: nextActive } : c));
        saveCache(next);
        return next;
      });

      showToast(
        'info',
        nextActive ? t('categoryActivated') : t('categoryDeactivated'),
        nextActive ? t('categoryActivatedDes') : t('categoryDeactivatedDes'),
        4000
      );

      invalidateCache();
    } catch (error: any) {
      console.error('Error toggling category:', error);
      showToast('error', 'Error', error.message || 'No se pudo actualizar la categoría');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '' });
  };

  // ===== Reorder helpers (global order) =====
  const persistDisplayOrders = async (updates: { id: string; display_order: number }[]) => {
    // actualiza solo lo afectado
    for (const u of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: u.display_order })
        .eq('id', u.id);

      if (error) throw error;
    }
  };

  // Inserta dragged en la posición de target (global), recalculando SOLO el rango afectado
  const reorderGlobalByInsert = async (draggedId: string, targetId: string, place: 'before' | 'after') => {
    const sorted = [...categories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const fromIndex = sorted.findIndex((c) => c.id === draggedId);
    const toIndex = sorted.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    // Construir nuevo orden
    const working = [...sorted];
    const [dragged] = working.splice(fromIndex, 1);

    const insertIndex = place === 'before'
      ? (toIndex > fromIndex ? toIndex - 1 : toIndex)
      : (toIndex > fromIndex ? toIndex : toIndex + 1);

    working.splice(insertIndex, 0, dragged);

    // Solo rango afectado
    const start = Math.min(fromIndex, insertIndex);
    const end = Math.max(fromIndex, insertIndex);

    const affected = working.slice(start, end + 1);

    // Tomar los display_order existentes del rango original, ordenados
    const originalOrders = sorted
      .slice(start, end + 1)
      .map((c) => c.display_order || 0)
      .sort((a, b) => a - b);

    const updates = affected.map((c, i) => ({
      id: c.id,
      display_order: originalOrders[i]
    }));

    // Optimistic UI
    setCategories((prev) => {
      const map = new Map(prev.map((c) => [c.id, { ...c }]));
      for (const u of updates) {
        const item = map.get(u.id);
        if (item) item.display_order = u.display_order as any;
      }
      const next = Array.from(map.values()).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      saveCache(next);
      return next;
    });

    try {
      await persistDisplayOrders(updates);
      invalidateCache();
    } catch (err) {
      console.error('Error persisting reorder:', err);
      showToast('error', 'Error', 'No se pudo reordenar las categorías');
      await loadCategories();
    }
  };

  // Mover al inicio o final de la página actual (cuando no hay target específico)
  const moveDraggedToPageEdge = async (edge: 'start' | 'end') => {
    if (!draggedCategory) return;

    // si no hay items en página, no hacemos nada
    if (pagedCategories.length === 0) return;

    const target = edge === 'start' ? pagedCategories[0] : pagedCategories[pagedCategories.length - 1];
    await reorderGlobalByInsert(draggedCategory.id, target.id, edge === 'start' ? 'before' : 'after');
  };

  // ===== Drag and Drop (cross-page) =====
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    if (debouncedSearchTerm) return; // evita reorder mientras buscas
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (debouncedSearchTerm) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnItem = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();

    if (!draggedCategory || draggedCategory.id === targetCategory.id) {
      setDraggedCategory(null);
      return;
    }

    if (debouncedSearchTerm) {
      setDraggedCategory(null);
      return;
    }

    // Insertar antes del target (puedes cambiar a after si lo prefieres)
    await reorderGlobalByInsert(draggedCategory.id, targetCategory.id, 'before');
    setDraggedCategory(null);
  };

  const handleDragEnd = () => setDraggedCategory(null);

  // Drop zones para mover a inicio/final de página actual
  const handleDropOnPageStart = async (e: React.DragEvent) => {
    e.preventDefault();
    if (debouncedSearchTerm) return;
    await moveDraggedToPageEdge('start');
    setDraggedCategory(null);
  };

  const handleDropOnPageEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    if (debouncedSearchTerm) return;
    await moveDraggedToPageEdge('end');
    setDraggedCategory(null);
  };

  // Cambiar página mientras arrastras (drag enter en botones)
  const maybeTurnPageWhileDragging = (direction: 'prev' | 'next') => {
    if (!draggedCategory) return;
    const now = Date.now();
    if (now - dragPagingCooldownRef.current < 450) return;
    dragPagingCooldownRef.current = now;

    setPage((p) => {
      if (direction === 'prev') return Math.max(1, p - 1);
      return Math.min(totalPages, p + 1);
    });
  };

  // ===== UI =====
  if (status?.isExpired || !status?.isActive) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('categoryManagement')}</h1>
        </div>
        <SubscriptionBlocker planName={status?.planName} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('categoryManagement')}</h1>

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
              const limitCheck = await checkCategoryLimit();
              if (!limitCheck.canCreate) {
                setShowUpgradeModal(true);
                return;
              }
              setEditingCategory(null);
              setFormData({ name: '', description: '', icon: '' });
              setShowModal(true);
            }}
          >
            {t('newCategory')}
          </Button>
        </div>
      </div>

      {limits && limits.current_categories >= limits.max_categories && (
        <SubscriptionExpiredBanner
          type="limit_reached"
          planName={status?.planName}
          current={limits.current_categories}
          max={limits.max_categories}
          resourceType="categories"
        />
      )}

      {limits && limits.current_categories >= limits.max_categories * 0.8 && limits.current_categories < limits.max_categories && (
        <SubscriptionExpiredBanner
          type="near_limit"
          planName={status?.planName}
          current={limits.current_categories}
          max={limits.max_categories}
          resourceType="categories"
          dismissible
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalCategories')}</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('activeCategories')}</p>
              <p className="text-2xl font-bold text-gray-900">{categories.filter((c) => c.is_active).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
              <EyeOff className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('inactiveCategories')}</p>
              <p className="text-2xl font-bold text-gray-900">{categories.filter((c) => !c.is_active).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`${t('search')} categories...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {!debouncedSearchTerm && categories.length > 1 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <GripVertical className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p>
              <strong className="text-blue-700">Tip:</strong> Arrastra una categoría y, sin soltar, pasa por “Anterior/Siguiente” para cambiar de página. Suelta encima de una categoría (o en la franja superior/inferior) para colocarla.
            </p>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">{t('loading')}...</div>
      ) : pagedCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {categories.length === 0 ? t('noCategoriesCreated') : 'No categories found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {categories.length === 0 ? t('createFirstCategory') : 'Try different search terms.'}
          </p>
          {categories.length === 0 && (
            <Button
              icon={Plus}
              onClick={async () => {
                const limitCheck = await checkCategoryLimit();
                if (!limitCheck.canCreate) {
                  setShowUpgradeModal(true);
                  return;
                }
                setShowModal(true);
              }}
            >
              {t('create')} {t('newCategory')}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Drop zone: inicio de página */}
          {!debouncedSearchTerm && draggedCategory && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDropOnPageStart}
              className="mb-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm px-4 py-2"
            >
              Suelta aquí para mover al inicio de esta página
            </div>
          )}

          <div className="space-y-3">
            {pagedCategories.map((category) => (
              <div
                key={category.id}
                draggable={!debouncedSearchTerm}
                onDragStart={(e) => handleDragStart(e, category)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnItem(e, category)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                  !debouncedSearchTerm ? 'cursor-move' : ''
                } ${
                  draggedCategory?.id === category.id
                    ? 'opacity-50 scale-95 border-blue-400'
                    : 'border-gray-200 hover:shadow-md hover:border-blue-300'
                }`}
              >
                <div className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 overflow-hidden">
                  {!debouncedSearchTerm && (
                    <div className="flex-shrink-0">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{category.display_order}</span>
                  </div>

                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                    {category.icon ? (
                      <span className="text-3xl">{category.icon}</span>
                    ) : (
                      <FolderOpen className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{category.name}</h3>
                      <Badge variant={category.is_active ? 'success' : 'gray'}>
                        {category.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{category.description || 'Sin descripción'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('categoriesCreated')}: {new Date(category.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end w-full md:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-blue-600" />
                    </button>

                    <button
                      onClick={() => toggleActive(category.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {category.is_active ? (
                        <EyeOff className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-600" />
                      )}
                    </button>

                    <button
                      onClick={() => openDeleteConfirm(category)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Drop zone: final de página */}
          {!debouncedSearchTerm && draggedCategory && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDropOnPageEnd}
              className="mt-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 text-sm px-4 py-2"
            >
              Suelta aquí para mover al final de esta página
            </div>
          )}

          {/* Pagination */}
          {filteredCategories.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-6 bg-white p-3 rounded-lg shadow border">
              <div className="text-sm text-gray-600">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong> · {filteredCategories.length} categorías
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  onDragEnter={() => maybeTurnPageWhileDragging('prev')}
                >
                  Anterior
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  onDragEnter={() => maybeTurnPageWhileDragging('next')}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
          setFormData({ name: '', description: '', icon: '' });
        }}
        title={editingCategory ? `${t('edit')} ${t('category')}` : t('newCategory')}
        size="lg"
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <Input
              label={`${t('categoryName')}*`}
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('categoriesNameDes')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder={t('categoriesDescription')}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-600" />
              {t('categoryAppearance')}
            </h4>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('catIconSec')}</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="🍕 🥤 🍰"
              />
              <p className="text-xs text-gray-500">{t('catIconDes')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">{t('catObligatry')}</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowModal(false);
                  setEditingCategory(null);
                  setFormData({ name: '', description: '', icon: '' });
                }}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                {editingCategory ? t('update') : t('create')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, categoryId: '', categoryName: '' })}
        onConfirm={() => handleDelete(deleteConfirm.categoryId)}
        title={t('deleteCategoryTitle')}
        message={t('deleteCategoryMessage')}
        confirmText={t('deleteCategoryButton')}
        cancelText={t('cancel')}
        variant="danger"
        itemName={deleteConfirm.categoryName}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={status?.planName || currentSubscription?.plan_name || 'Free'}
        reason="categories"
        currentLimit={limits?.max_categories}
      />
    </div>
  );
};
