import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pencil as Edit,
} from 'lucide-react';
import { Subscription, Restaurant, SubscriptionPlan } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';

const PAGE_SIZE = 10;

type GlobalStats = {
  active: number;
  expired: number;
  expiringSoon: number;
  free: number;
};

export const SubscriptionsManagement: React.FC = () => {
  const { showToast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);

  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const [loading, setLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats globales reales (no dependen de la página)
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    active: 0,
    expired: 0,
    expiringSoon: 0,
    free: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [formData, setFormData] = useState({
    plan_name: 'free',
    duration: 'monthly' as Subscription['duration'],
    start_date: '',
    end_date: '',
    status: 'active' as Subscription['status'],
    auto_renew: true,
  });

  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState(''); // vencimiento desde
  const [endDate, setEndDate] = useState(''); // vencimiento hasta
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'expiring'>('newest');

  // Búsqueda global: input inmediato + término debounced
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce (más fluido)
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // Reset a página 1 cuando cambian filtros/búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPlan, filterStatus, startDate, endDate, sortBy, searchTerm]);

  const calculateNewEndDate = useCallback(
    (currentEndDateIso: string, duration: Subscription['duration']): string => {
      const d = new Date(currentEndDateIso);
      if (duration === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (duration === 'annual') d.setFullYear(d.getFullYear() + 1);
      return d.toISOString();
    },
    []
  );

  const isExpiringSoon = useCallback((endDateIso: string) => {
    const end = new Date(endDateIso);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }, []);

  const isExpired = useCallback((endDateIso: string) => {
    return new Date(endDateIso) < new Date();
  }, []);

  const getStatusBadge = useCallback((status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activa</Badge>;
      case 'expired':
        return <Badge variant="error">Vencida</Badge>;
      default:
        return <Badge variant="gray">Desconocido</Badge>;
    }
  }, []);

  const getPlanBadge = useCallback(
    (planName: string) => {
      const plan = subscriptionPlans.find(p => p.slug === planName);
      const displayName = plan?.name || planName.toUpperCase();

      const variant =
        planName === 'free'
          ? 'gray'
          : planName === 'basic'
            ? 'info'
            : planName === 'pro'
              ? 'success'
              : 'error';

      return <Badge variant={variant}>{displayName}</Badge>;
    },
    [subscriptionPlans]
  );

  const restaurantsById = useMemo(() => {
    const map = new Map<string, Restaurant>();
    for (const r of restaurants) map.set(r.id, r);
    return map;
  }, [restaurants]);

  const getRestaurant = useCallback(
    (restaurantId: string) => restaurantsById.get(restaurantId),
    [restaurantsById]
  );

  // Cargar combos (restaurants + plans) una sola vez
  const loadLookupData = useCallback(async () => {
    try {
      // Restaurantes: solo campos que usas en UI/búsqueda
      const restaurantsReq = supabase
        .from('restaurants')
        .select('id,name,email,created_at')
        .order('created_at', { ascending: false });

      const plansReq = supabase
        .from('subscription_plans')
        .select('id,slug,name,price,billing_period,display_order,max_products,features,is_active')
        .eq('is_active', true)
        .order('display_order');

      const [{ data: restaurantData, error: restaurantsError }, { data: plansData, error: plansError }] =
        await Promise.all([restaurantsReq, plansReq]);

      if (restaurantsError) throw restaurantsError;
      if (plansError) throw plansError;

      setRestaurants((restaurantData as Restaurant[]) || []);
      setSubscriptionPlans((plansData as SubscriptionPlan[]) || []);
    } catch (err) {
      console.error('SubscriptionsManagement - Error loading lookup data:', err);
      showToast('Error al cargar restaurantes/planes', 'error');
    }
  }, [showToast]);

  // Construye query de subscriptions aplicando filtros en BD
  const buildSubscriptionsQuery = useCallback(() => {
    // OJO: traemos solo columnas necesarias para tabla/modales
    let q = supabase
      .from('subscriptions')
      .select(
        'id,restaurant_id,plan_name,duration,start_date,end_date,status,auto_renew,created_at,monthly_price,max_products,features',
        { count: 'exact' }
      );

    // Filtros base
    if (filterPlan !== 'all') q = q.eq('plan_name', filterPlan);
    if (filterStatus !== 'all') q = q.eq('status', filterStatus);

    // Fecha de vencimiento (end_date)
    if (startDate) {
      // desde 00:00:00
      q = q.gte('end_date', new Date(startDate + 'T00:00:00.000Z').toISOString());
    }
    if (endDate) {
      // hasta 23:59:59
      q = q.lte('end_date', new Date(endDate + 'T23:59:59.999Z').toISOString());
    }

    // Orden
    if (sortBy === 'newest') q = q.order('end_date', { ascending: false });
    else if (sortBy === 'oldest') q = q.order('end_date', { ascending: true });
    else q = q.order('end_date', { ascending: true }); // expiring

    return q;
  }, [filterPlan, filterStatus, startDate, endDate, sortBy]);

  // Búsqueda GLOBAL por restaurante:
  // 1) busca IDs de restaurantes que matcheen (name/email) en TODA la colección
  // 2) filtra subscriptions por restaurant_id IN (ids)
  const findRestaurantIdsForSearch = useCallback(
    async (term: string): Promise<string[] | null> => {
      const cleaned = term.trim();
      if (!cleaned) return null;

      const escaped = cleaned.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const pattern = `%${escaped}%`;

      // Busca por name o email en restaurants (global)
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .or(`name.ilike.${pattern},email.ilike.${pattern}`);

      if (error) {
        console.error('SubscriptionsManagement - Error searching restaurants:', error);
        throw error;
      }

      const ids = (data || []).map(r => r.id).filter(Boolean);
      return ids;
    },
    []
  );

  const loadSubscriptionsPage = useCallback(async () => {
    try {
      setLoading(true);

      let q = buildSubscriptionsQuery();

      // Búsqueda global: convertimos término -> ids globales -> IN
      if (searchTerm) {
        const ids = await findRestaurantIdsForSearch(searchTerm);
        if (!ids || ids.length === 0) {
          setSubscriptions([]);
          setTotalCount(0);
          return;
        }

        // Si hay demasiados IDs, "in" puede ser pesado. Para la mayoría de casos está ok.
        // Si tienes miles de matches, conviene un RPC/VIEW con join.
        q = q.in('restaurant_id', ids);
      }

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await q.range(from, to);

      if (error) {
        console.error('SubscriptionsManagement - Error loading subscriptions:', error);
        throw error;
      }

      setSubscriptions((data as Subscription[]) || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      showToast('Error al cargar las suscripciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    buildSubscriptionsQuery,
    currentPage,
    searchTerm,
    findRestaurantIdsForSearch,
    showToast,
  ]);

  // Stats globales reales (no dependen de la paginación)
  const loadGlobalStats = useCallback(async () => {
    try {
      setLoadingStats(true);

      const now = new Date();
      const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const activeReq = supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      const expiredReq = supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'expired');

      const expiringReq = supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('end_date', now.toISOString())
        .lte('end_date', in7.toISOString());

      const freeReq = supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('plan_name', 'free');

      const [activeRes, expiredRes, expiringRes, freeRes] = await Promise.all([
        activeReq,
        expiredReq,
        expiringReq,
        freeReq,
      ]);

      setGlobalStats({
        active: activeRes.count || 0,
        expired: expiredRes.count || 0,
        expiringSoon: expiringRes.count || 0,
        free: freeRes.count || 0,
      });
    } catch (err) {
      console.error('SubscriptionsManagement - Error loading global stats:', err);
      // No bloqueo UI, solo aviso suave
      showToast('No se pudieron cargar las estadísticas globales', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  // Carga inicial
  useEffect(() => {
    (async () => {
      await loadLookupData();
      await loadGlobalStats();
      await loadSubscriptionsPage();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarga de página cuando cambian filtros/búsqueda/página
  useEffect(() => {
    loadSubscriptionsPage();
  }, [loadSubscriptionsPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  }, [totalCount]);

  const updateSubscriptionStatus = useCallback(
    async (subscriptionId: string, newStatus: Subscription['status']) => {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: newStatus })
          .eq('id', subscriptionId);

        if (error) throw error;

        setSubscriptions(prev =>
          prev.map(sub => (sub.id === subscriptionId ? { ...sub, status: newStatus } : sub))
        );

        showToast('Estado de suscripción actualizado', 'success');

        // Refresh: lista actual + stats globales (sin timeout)
        await Promise.all([loadSubscriptionsPage(), loadGlobalStats()]);
      } catch (error: any) {
        console.error('Error updating subscription status:', error);
        showToast(error?.message || 'Error al actualizar el estado', 'error');
      }
    },
    [loadGlobalStats, loadSubscriptionsPage, showToast]
  );

  const handleEditSubscription = useCallback(
    (subscription: Subscription) => {
      setEditingSubscription(subscription);

      const formatDate = (iso: string) => {
        try {
          return new Date(iso).toISOString().split('T')[0];
        } catch {
          return new Date().toISOString().split('T')[0];
        }
      };

      setFormData({
        plan_name: subscription.plan_name,
        duration: subscription.duration,
        start_date: formatDate(subscription.start_date),
        end_date: formatDate(subscription.end_date),
        status: subscription.status,
        auto_renew: subscription.auto_renew,
      });

      setShowEditModal(true);
    },
    []
  );

  const handleSaveSubscription = useCallback(async () => {
    if (!editingSubscription) return;

    try {
      const selectedPlan = subscriptionPlans.find(p => p.slug === formData.plan_name);

      if (!selectedPlan) {
        showToast('Plan no encontrado', 'error');
        return;
      }
      if (!formData.start_date || !formData.end_date) {
        showToast('Las fechas son requeridas', 'error');
        return;
      }

      const updateData = {
        plan_name: formData.plan_name,
        duration: formData.duration,
        start_date: new Date(formData.start_date + 'T00:00:00.000Z').toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59.999Z').toISOString(),
        status: formData.status,
        auto_renew: formData.auto_renew,
        monthly_price: selectedPlan.price,
        max_products: selectedPlan.max_products,
        features: selectedPlan.features,
      };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', editingSubscription.id);

      if (error) throw error;

      setSubscriptions(prev =>
        prev.map(sub => (sub.id === editingSubscription.id ? { ...sub, ...updateData } : sub))
      );

      showToast('Suscripción actualizada exitosamente', 'success');

      setShowEditModal(false);
      setEditingSubscription(null);

      await Promise.all([loadSubscriptionsPage(), loadGlobalStats()]);
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      showToast(error?.message || 'Error al actualizar la suscripción', 'error');
    }
  }, [
    editingSubscription,
    formData.auto_renew,
    formData.duration,
    formData.end_date,
    formData.plan_name,
    formData.start_date,
    formData.status,
    loadGlobalStats,
    loadSubscriptionsPage,
    showToast,
    subscriptionPlans,
  ]);

  const extendSubscription = useCallback(
    async (subscriptionId: string, months: number) => {
      try {
        const sub = subscriptions.find(s => s.id === subscriptionId);
        if (!sub) {
          showToast('Suscripción no encontrada', 'error');
          return;
        }

        const currentEndDate = new Date(sub.end_date);

        // Si ya expiró y está activa, simulamos auto-renew en UI para extender desde su end_date real
        // (Sin tocar start_date aquí para no romper lógica existente)
        const newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + months);

        const { error } = await supabase
          .from('subscriptions')
          .update({ end_date: newEndDate.toISOString() })
          .eq('id', subscriptionId);

        if (error) throw error;

        setSubscriptions(prev =>
          prev.map(s => (s.id === subscriptionId ? { ...s, end_date: newEndDate.toISOString() } : s))
        );

        showToast(`Suscripción extendida por ${months} mes(es)`, 'success');

        setShowModal(false);
        setSelectedSubscription(null);

        await Promise.all([loadSubscriptionsPage(), loadGlobalStats()]);
      } catch (error: any) {
        console.error('Error extending subscription:', error);
        showToast(error?.message || 'Error al extender la suscripción', 'error');
      }
    },
    [loadGlobalStats, loadSubscriptionsPage, showToast, subscriptions]
  );

  const clearFilters = useCallback(() => {
    setFilterPlan('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
    setSearchInput('');
    setSearchTerm('');
  }, []);

  const shouldShowClear =
    filterPlan !== 'all' ||
    filterStatus !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    sortBy !== 'newest' ||
    Boolean(searchInput) ||
    Boolean(searchTerm);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Suscripciones</h1>
      </div>

      {/* Stats Cards (globales reales) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '—' : globalStats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '—' : globalStats.expired}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Por Vencer (7 días)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '—' : globalStats.expiringSoon}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Plan Gratis</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loadingStats ? '—' : globalStats.free}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <Input
              placeholder="Buscar por restaurante..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los planes</option>
                {subscriptionPlans.map(plan => (
                  <option key={plan.id} value={plan.slug}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activa</option>
                <option value="expired">Vencida</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento (desde)
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento (hasta)
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'expiring')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Más reciente</option>
                <option value="oldest">Más antiguo</option>
                <option value="expiring">Próximo a expirar</option>
              </select>
            </div>

            {shouldShowClear && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando suscripciones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => {
                  const restaurant = getRestaurant(subscription.restaurant_id);
                  const expiringSoon = isExpiringSoon(subscription.end_date);
                  const expired = isExpired(subscription.end_date);

                  return (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {restaurant?.name || 'Restaurante no encontrado'}
                        </div>
                        <div className="text-sm text-gray-500">{restaurant?.email}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPlanBadge(subscription.plan_name)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(subscription.status)}
                          {expiringSoon && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                          {expired && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.duration === 'monthly' && 'Mensual'}
                        {subscription.duration === 'annual' && 'Anual'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(subscription.end_date).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => handleEditSubscription(subscription)}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowModal(true);
                            }}
                          >
                            Ver
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => extendSubscription(subscription.id, 1)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Extender
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!subscriptions.length && (
                  <tr>
                    <td className="px-6 py-10 text-center text-sm text-gray-500" colSpan={6}>
                      No hay suscripciones para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Mostrando{' '}
          <span className="font-medium">
            {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
          </span>{' '}
          –{' '}
          <span className="font-medium">
            {Math.min(currentPage * PAGE_SIZE, totalCount)}
          </span>{' '}
          de <span className="font-medium">{totalCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || loading}
          >
            Anterior
          </Button>

          <div className="text-sm text-gray-700">
            Página <span className="font-medium">{currentPage}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Subscription Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedSubscription(null);
        }}
        title="Detalles de Suscripción"
        size="lg"
      >
        {selectedSubscription && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurante</label>
                <p className="text-sm text-gray-900">
                  {getRestaurant(selectedSubscription.restaurant_id)?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                {getPlanBadge(selectedSubscription.plan_name)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                {getStatusBadge(selectedSubscription.status)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duración</label>
                <p className="text-sm text-gray-900">
                  {selectedSubscription.duration === 'monthly' && 'Mensual'}
                  {selectedSubscription.duration === 'annual' && 'Anual'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedSubscription.start_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedSubscription.end_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Renovación Automática</label>
                <Badge variant={selectedSubscription.auto_renew ? 'success' : 'gray'}>
                  {selectedSubscription.auto_renew ? 'Habilitada' : 'Deshabilitada'}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedSubscription.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button onClick={() => extendSubscription(selectedSubscription.id, 1)} variant="outline">
                Extender 1 mes
              </Button>
              <Button onClick={() => extendSubscription(selectedSubscription.id, 3)} variant="outline">
                Extender 3 meses
              </Button>
              <Button onClick={() => extendSubscription(selectedSubscription.id, 12)} variant="primary">
                Extender 1 año
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Subscription Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSubscription(null);
        }}
        title="Editar Suscripción"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Plan</label>
              <select
                value={formData.plan_name}
                onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {subscriptionPlans.map(plan => (
                  <option key={plan.id} value={plan.slug}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duración</label>
              <select
                value={formData.duration}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, duration: e.target.value as Subscription['duration'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="monthly">Mensual</option>
                <option value="annual">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, status: e.target.value as Subscription['status'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Activa</option>
                <option value="expired">Vencida</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.auto_renew}
                onChange={(e) => setFormData(prev => ({ ...prev, auto_renew: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Renovación Automática</label>
            </div>

            <Input
              label="Fecha de Inicio"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />

            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                setEditingSubscription(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveSubscription}>Guardar Cambios</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
