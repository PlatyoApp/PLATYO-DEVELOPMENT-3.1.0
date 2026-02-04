import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Store, CreditCard, TrendingUp, RefreshCw, DollarSign, Activity, Clock } from 'lucide-react';
import { Restaurant, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const SuperAdminDashboard: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar en paralelo + pedir solo columnas usadas
      const [restaurantsRes, subscriptionsRes] = await Promise.all([
        supabase
          .from('restaurants')
          .select('id, name, email, created_at, logo_url') // añade más campos solo si los necesitas
          .order('created_at', { ascending: false }),

        supabase
          .from('subscriptions')
          .select('id, restaurant_id, status, plan_name') // solo lo usado en stats/badges
      ]);

      if (restaurantsRes.error) {
        console.error('Error loading restaurants:', restaurantsRes.error);
        throw restaurantsRes.error;
      }
      if (subscriptionsRes.error) {
        console.error('Error loading subscriptions:', subscriptionsRes.error);
        throw subscriptionsRes.error;
      }

      setRestaurants(restaurantsRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Evita recrear función y asegura carga inicial rápida
    loadData();
  }, [loadData]);

  // Map para encontrar suscripción por restaurant_id en O(1) (evita .find() en bucles)
  const subscriptionByRestaurantId = useMemo(() => {
    const map = new Map<string, Subscription>();
    for (const s of subscriptions) {
      if (s.restaurant_id) map.set(s.restaurant_id, s);
    }
    return map;
  }, [subscriptions]);

  const getRestaurantSubscription = useCallback(
    (restaurantId: string) => subscriptionByRestaurantId.get(restaurantId),
    [subscriptionByRestaurantId]
  );

  const isRestaurantActive = useCallback(
    (restaurantId: string) => getRestaurantSubscription(restaurantId)?.status === 'active',
    [getRestaurantSubscription]
  );

  const stats = useMemo(() => {
    let activeRestaurants = 0;
    let inactiveRestaurants = 0;

    for (const r of restaurants) {
      if (isRestaurantActive(r.id)) activeRestaurants++;
      else inactiveRestaurants++;
    }

    let freePlan = 0;
    let basicPlan = 0;
    let proPlan = 0;
    let businessPlan = 0;
    let activeSubscriptions = 0;
    let expiredSubscriptions = 0;

    for (const s of subscriptions) {
      if (s.status === 'active') activeSubscriptions++;
      if (s.status === 'expired') expiredSubscriptions++;

      switch (s.plan_name) {
        case 'free':
          freePlan++;
          break;
        case 'basic':
          basicPlan++;
          break;
        case 'pro':
          proPlan++;
          break;
        case 'business':
          businessPlan++;
          break;
      }
    }

    return {
      totalRestaurants: restaurants.length,
      activeRestaurants,
      inactiveRestaurants,
      freePlan,
      basicPlan,
      proPlan,
      businessPlan,
      activeSubscriptions,
      expiredSubscriptions,
    };
  }, [restaurants, subscriptions, isRestaurantActive]);

  const getRestaurantStatusBadge = useCallback(
    (restaurantId: string) => {
      const subscription = getRestaurantSubscription(restaurantId);
      if (!subscription) return <Badge variant="gray">Sin suscripción</Badge>;
      return subscription.status === 'active'
        ? <Badge variant="success">Activo</Badge>
        : <Badge variant="error">Inactivo</Badge>;
    },
    [getRestaurantSubscription]
  );

  const getSubscriptionBadge = useCallback((subscription: Subscription | undefined) => {
    if (!subscription) return <Badge variant="gray">Sin suscripción</Badge>;

    const planName =
      subscription.plan_name === 'free' ? 'FREE' :
      subscription.plan_name === 'basic' ? 'Basic' :
      subscription.plan_name === 'pro' ? 'Pro' :
      subscription.plan_name === 'business' ? 'Business' :
      (subscription.plan_name || '').toUpperCase();

    const variant =
      subscription.plan_name === 'free' ? 'gray' :
      subscription.plan_name === 'basic' ? 'info' :
      subscription.plan_name === 'pro' ? 'success' :
      subscription.plan_name === 'business' ? 'warning' :
      'default';

    return <Badge variant={variant}>{planName}</Badge>;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Dashboard Principal</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Vista general del sistema Platyo
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadData}
            className="shadow-sm"
            disabled={loading}
            loading={loading}
          >
            Actualizar Datos
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
              <Store className="h-6 w-6 text-white" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Total Restaurantes</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{stats.totalRestaurants}</p>
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
              {stats.activeRestaurants} activos
            </span>
            <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
              {stats.inactiveRestaurants} inactivos
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-md">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Plan Gratis</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{stats.freePlan}</p>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-600 font-medium">Sin costo mensual</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Plan Basic</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{stats.basicPlan}</p>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
              $15/mes
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Plan Pro</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{stats.proPlan}</p>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
              $35/mes
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Plan Business</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{stats.businessPlan}</p>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">
              $75/mes
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Suscripciones Activas</p>
          <p className="text-3xl font-bold text-slate-900 mb-3">{stats.activeSubscriptions}</p>
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
              {stats.expiredSubscriptions} vencidas
            </span>
          </div>
        </div>
      </div>

      {/* Eliminado: Restaurantes Recientes (tal como pediste) */}

      {/* Si en el futuro quieres un listado completo paginado, lo ideal es:
          - usar range() para paginar
          - traer solo columnas necesarias
          - y hacer joins o vistas para evitar múltiples queries */}
    </div>
  );
};
