import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Store,
  Calendar,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Restaurant, Subscription, User, SubscriptionPlan } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year';

const PLAN_MONTHLY_COP: Record<string, number> = {
  free: 0,
  basic: 49900,
  pro: 99900,
  business: 199900,
};

const durationMultiplier: Record<string, number> = {
  monthly: 1,
  annual: 12,
};

const isoStartUTC = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T00:00:00.000Z`).toISOString();
const isoEndUTC = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T23:59:59.999Z`).toISOString();

const normalizePlanSlug = (sub: any): 'free' | 'basic' | 'pro' | 'business' | 'unknown' => {
  const raw =
    sub?.plan_name ??
    sub?.plan_type ??
    sub?.plan ??
    sub?.plan_slug ??
    sub?.subscription_plan ??
    '';

  const v = String(raw).toLowerCase().trim();

  if (v.includes('business')) return 'business';
  if (v === 'pro' || v.includes(' pro')) return 'pro';
  if (v === 'basic' || v.includes('basic')) return 'basic';
  if (v === 'free' || v.includes('gratis') || v.includes('free')) return 'free';

  return 'unknown';
};

const normalizeDuration = (sub: any): 'monthly' | 'annual' | 'unknown' => {
  const v = String(sub?.duration || '').toLowerCase();
  if (v === 'monthly') return 'monthly';
  if (v === 'annual' || v === 'yearly') return 'annual';
  return 'unknown';
};

const normalizeStatus = (sub: any): 'active' | 'expired' | 'unknown' => {
  const v = String(sub?.status || '').toLowerCase();
  if (v === 'active') return 'active';
  if (v === 'expired') return 'expired';
  // compat: algunos esquemas usan cancelled/canceled/ended
  if (v === 'cancelled' || v === 'canceled' || v === 'cancelled') return 'expired';
  return 'unknown';
};

export const SuperAdminAnalytics: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<PeriodFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [csvLoading, setCsvLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
  const [loadError, setLoadError] = useState<string>('');

  const getPlanMonthlyPriceCOP = useCallback((sub: any) => {
    const mp = Number(sub?.monthly_price);
    if (!Number.isNaN(mp) && mp > 0) return mp;

    const slug = normalizePlanSlug(sub);
    return PLAN_MONTHLY_COP[slug] ?? 0;
  }, []);

  const getPeriodStartIso = useCallback(() => {
    if (startDate) return isoStartUTC(startDate);
    if (selectedPeriodFilter === 'all') return null;

    const now = new Date();
    const d = new Date(now);

    if (selectedPeriodFilter === 'today') d.setHours(0, 0, 0, 0);
    if (selectedPeriodFilter === 'week') d.setDate(now.getDate() - 7);
    if (selectedPeriodFilter === 'month') d.setMonth(now.getMonth() - 1);
    if (selectedPeriodFilter === 'year') d.setFullYear(now.getFullYear() - 1);

    return d.toISOString();
  }, [selectedPeriodFilter, startDate]);

  const getPeriodEndIso = useCallback(() => {
    if (endDate) return isoEndUTC(endDate);
    return null;
  }, [endDate]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');

      // IMPORTANTE: columnas mínimas, pero incluyendo variantes para no quedar en 0
      const restaurantsReq = supabase
        .from('restaurants')
        .select('id,name,email,created_at')
        .order('created_at', { ascending: false });

      const subscriptionsReq = supabase
        .from('subscriptions')
        .select('id,restaurant_id,plan_name,plan_type,plan,plan_slug,duration,status,created_at,end_date,monthly_price')
        .order('created_at', { ascending: false });

      // users: algunos esquemas no tienen email_verified, por eso pedimos ambos
      const usersReq = supabase
        .from('users')
        .select('id,role,created_at,email_verified,email_confirmed_at')
        .order('created_at', { ascending: false });

      const plansReq = supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order', { ascending: true });

      const [restaurantsRes, subscriptionsRes, usersRes, plansRes] = await Promise.all([
        restaurantsReq,
        subscriptionsReq,
        usersReq,
        plansReq,
      ]);

      if (restaurantsRes.error) throw restaurantsRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (plansRes.error) throw plansRes.error;

      setRestaurants(restaurantsRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
      setUsers(usersRes.data || []);
      setPlans(plansRes.data || []);

      setLastUpdatedAt(new Date().toLocaleString());
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      setLoadError(error?.message || 'Error cargando estadísticas (revisa permisos/RLS y columnas).');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    if (selectedPlanFilter !== 'all') {
      filtered = filtered.filter((s: any) => normalizePlanSlug(s) === selectedPlanFilter);
    }

    const startIso = getPeriodStartIso();
    const endIso = getPeriodEndIso();

    if (startIso || endIso) {
      const start = startIso ? new Date(startIso).getTime() : -Infinity;
      const end = endIso ? new Date(endIso).getTime() : Infinity;

      filtered = filtered.filter((s: any) => {
        const t = new Date(s.created_at).getTime();
        return t >= start && t <= end;
      });
    }

    return filtered;
  }, [subscriptions, selectedPlanFilter, getPeriodStartIso, getPeriodEndIso]);

  const totals = useMemo(() => {
    const totalRestaurants = restaurants.length;

    const activeRestaurants = subscriptions.filter((s: any) => normalizeStatus(s) === 'active').length;
    const expiredRestaurants = subscriptions.filter((s: any) => normalizeStatus(s) === 'expired').length;

    const totalUsers = users.length;

    const verifiedUsers = users.filter((u: any) => {
      // compat: email_verified boolean o email_confirmed_at timestamp
      if (typeof u.email_verified === 'boolean') return u.email_verified;
      return Boolean(u.email_confirmed_at);
    }).length;

    const restaurantOwners = users.filter((u: any) => u.role === 'restaurant_owner').length;
    const superAdmins = users.filter((u: any) => u.role === 'superadmin').length;

    const totalFilteredSubscriptions = filteredSubscriptions.length;
    const activeSubscriptions = filteredSubscriptions.filter((s: any) => normalizeStatus(s) === 'active').length;
    const expiredSubscriptions = filteredSubscriptions.filter((s: any) => normalizeStatus(s) === 'expired').length;

    return {
      totalRestaurants,
      activeRestaurants,
      expiredRestaurants,
      totalUsers,
      verifiedUsers,
      restaurantOwners,
      superAdmins,
      totalFilteredSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
    };
  }, [restaurants, subscriptions, users, filteredSubscriptions]);

  const monthlyRegistrations = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    for (const r of restaurants) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    }
    return Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [restaurants]);

  const planDistribution = useMemo(() => {
    return {
      free: filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'free').length,
      basic: filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'basic').length,
      pro: filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'pro').length,
      business: filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'business').length,
    };
  }, [filteredSubscriptions]);

  const durationDistribution = useMemo(() => {
    return {
      monthly: filteredSubscriptions.filter((s: any) => normalizeDuration(s) === 'monthly').length,
      annual: filteredSubscriptions.filter((s: any) => normalizeDuration(s) === 'annual').length,
    };
  }, [filteredSubscriptions]);

  const financials = useMemo(() => {
    const calcRevenue = (subs: any[]) =>
      subs.reduce((sum, s) => sum + getPlanMonthlyPriceCOP(s) * (durationMultiplier[normalizeDuration(s)] || 1), 0);

    const activeFiltered = filteredSubscriptions.filter((s: any) => normalizeStatus(s) === 'active');
    const totalRevenue = calcRevenue(activeFiltered);
    const potentialRevenue = calcRevenue(filteredSubscriptions);

    const mrr = subscriptions
      .filter((s: any) => normalizeStatus(s) === 'active')
      .reduce((acc, s) => acc + getPlanMonthlyPriceCOP(s), 0);

    const arr = mrr * 12;

    const paidActive = subscriptions.filter((s: any) => normalizePlanSlug(s) !== 'free' && normalizeStatus(s) === 'active');
    const avgPlanValue =
      paidActive.length === 0
        ? '0.00'
        : (paidActive.reduce((sum, s) => sum + getPlanMonthlyPriceCOP(s), 0) / paidActive.length).toFixed(2);

    const revenueByPlan = {
      free: calcRevenue(filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'free')),
      basic: calcRevenue(filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'basic')),
      pro: calcRevenue(filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'pro')),
      business: calcRevenue(filteredSubscriptions.filter((s: any) => normalizePlanSlug(s) === 'business')),
    };

    return { totalRevenue, potentialRevenue, mrr, arr, avgPlanValue, revenueByPlan };
  }, [filteredSubscriptions, subscriptions, getPlanMonthlyPriceCOP]);

  const churnRate = useMemo(() => {
    const totalSubs = subscriptions.length;
    const expired = subscriptions.filter((s: any) => normalizeStatus(s) === 'expired').length;
    return totalSubs > 0 ? ((expired / totalSubs) * 100).toFixed(1) : '0.0';
  }, [subscriptions]);

  const conversionRate = useMemo(() => {
    const totalSubs = subscriptions.length;
    const paid = subscriptions.filter((s: any) => normalizePlanSlug(s) !== 'free').length;
    return totalSubs > 0 ? ((paid / totalSubs) * 100).toFixed(1) : '0.0';
  }, [subscriptions]);

  const expiringSoon = useMemo(() => {
    const now = new Date();
    return subscriptions.filter((sub: any) => {
      const endDate = new Date(sub.end_date);
      const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 7 && days > 0;
    });
  }, [subscriptions]);

  // CSV ON-DEMAND (consulta solo al click)
  const exportToCSV = useCallback(async () => {
    try {
      setCsvLoading(true);

      const [restaurantsRes, subscriptionsRes, usersRes] = await Promise.all([
        supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
      ]);

      if (restaurantsRes.error) throw restaurantsRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (usersRes.error) throw usersRes.error;

      const restaurantsFull = restaurantsRes.data || [];
      const subscriptionsFull = subscriptionsRes.data || [];
      const usersFull = usersRes.data || [];

      // Filtrado para CSV (mismos filtros actuales)
      const filteredSubsForCsv = (() => {
        let filtered = [...subscriptionsFull];

        if (selectedPlanFilter !== 'all') {
          filtered = filtered.filter(s => normalizePlanSlug(s) === selectedPlanFilter);
        }

        if (startDate || endDate) {
          const start = startDate ? new Date(isoStartUTC(startDate)).getTime() : -Infinity;
          const end = endDate ? new Date(isoEndUTC(endDate)).getTime() : Infinity;
          filtered = filtered.filter(s => {
            const t = new Date(s.created_at).getTime();
            return t >= start && t <= end;
          });
        } else if (selectedPeriodFilter !== 'all') {
          const now = new Date();
          const p = new Date(now);
          if (selectedPeriodFilter === 'today') p.setHours(0, 0, 0, 0);
          if (selectedPeriodFilter === 'week') p.setDate(now.getDate() - 7);
          if (selectedPeriodFilter === 'month') p.setMonth(now.getMonth() - 1);
          if (selectedPeriodFilter === 'year') p.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(s => new Date(s.created_at) >= p);
        }

        return filtered;
      })();

      const getMonthlyCOP = (sub: any) => {
        const mp = Number(sub?.monthly_price);
        if (!Number.isNaN(mp) && mp > 0) return mp;
        return PLAN_MONTHLY_COP[normalizePlanSlug(sub)] ?? 0;
      };

      const calcRevenue = (subs: any[]) =>
        subs.reduce((sum, s) => sum + getMonthlyCOP(s) * (durationMultiplier[normalizeDuration(s)] || 1), 0);

      const totalRestaurants = restaurantsFull.length;
      const activeRestaurants = subscriptionsFull.filter((s: any) => normalizeStatus(s) === 'active').length;
      const expiredRestaurants = subscriptionsFull.filter((s: any) => normalizeStatus(s) === 'expired').length;

      const totalUsers = usersFull.length;
      const verifiedUsers = usersFull.filter((u: any) => {
        if (typeof u.email_verified === 'boolean') return u.email_verified;
        return Boolean(u.email_confirmed_at);
      }).length;

      const restaurantOwners = usersFull.filter((u: any) => u.role === 'restaurant_owner').length;
      const superAdmins = usersFull.filter((u: any) => u.role === 'superadmin').length;

      const mrr = subscriptionsFull
        .filter((s: any) => normalizeStatus(s) === 'active')
        .reduce((sum, s) => sum + getMonthlyCOP(s), 0);

      const arr = mrr * 12;

      const churn = subscriptionsFull.length
        ? ((subscriptionsFull.filter((s: any) => normalizeStatus(s) === 'expired').length / subscriptionsFull.length) * 100).toFixed(1)
        : '0.0';

      const conversion = subscriptionsFull.length
        ? ((subscriptionsFull.filter((s: any) => normalizePlanSlug(s) !== 'free').length / subscriptionsFull.length) * 100).toFixed(1)
        : '0.0';

      const paidActive = subscriptionsFull.filter((s: any) => normalizePlanSlug(s) !== 'free' && normalizeStatus(s) === 'active');
      const avgPlanValue =
        paidActive.length === 0 ? '0.00' : (paidActive.reduce((sum, s) => sum + getMonthlyCOP(s), 0) / paidActive.length).toFixed(2);

      const activeSubs = filteredSubsForCsv.filter((s: any) => normalizeStatus(s) === 'active').length;
      const expiredSubs = filteredSubsForCsv.filter((s: any) => normalizeStatus(s) === 'expired').length;

      const planDist = {
        free: filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'free').length,
        basic: filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'basic').length,
        pro: filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'pro').length,
        business: filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'business').length,
      };

      const revByPlan = {
        free: calcRevenue(filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'free')),
        basic: calcRevenue(filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'basic')),
        pro: calcRevenue(filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'pro')),
        business: calcRevenue(filteredSubsForCsv.filter(s => normalizePlanSlug(s) === 'business')),
      };

      const durationDist = {
        monthly: filteredSubsForCsv.filter((s: any) => normalizeDuration(s) === 'monthly').length,
        annual: filteredSubsForCsv.filter((s: any) => normalizeDuration(s) === 'annual').length,
      };

      const csvData: any[] = [];
      csvData.push(['REPORTE DE ESTADÍSTICAS DEL SISTEMA']);
      csvData.push(['Fecha de generación:', new Date().toLocaleString()]);
      csvData.push([]);

      csvData.push(['MÉTRICAS GENERALES']);
      csvData.push(['Total Restaurantes', totalRestaurants]);
      csvData.push(['Restaurantes Activos', activeRestaurants]);
      csvData.push(['Restaurantes Expirados', expiredRestaurants]);
      csvData.push(['Total Usuarios', totalUsers]);
      csvData.push(['Usuarios Verificados', verifiedUsers]);
      csvData.push(['Propietarios de Restaurantes', restaurantOwners]);
      csvData.push(['Super Administradores', superAdmins]);
      csvData.push([]);

      csvData.push(['MÉTRICAS FINANCIERAS (COP)']);
      csvData.push(['MRR', `$${mrr.toFixed(0)}`]);
      csvData.push(['ARR', `$${arr.toFixed(0)}`]);
      csvData.push(['Ingresos Totales Activos (filtrados)', `$${calcRevenue(filteredSubsForCsv.filter((s: any) => normalizeStatus(s) === 'active')).toFixed(0)}`]);
      csvData.push(['Potencial de Ingresos (filtrados)', `$${calcRevenue(filteredSubsForCsv).toFixed(0)}`]);
      csvData.push(['Valor Promedio por Plan (activos pagos)', `$${avgPlanValue}`]);
      csvData.push([]);

      csvData.push(['SUSCRIPCIONES (filtradas)']);
      csvData.push(['Total Suscripciones', filteredSubsForCsv.length]);
      csvData.push(['Suscripciones Activas', activeSubs]);
      csvData.push(['Suscripciones Expiradas', expiredSubs]);
      csvData.push(['Tasa de Abandono (Churn)', `${churn}%`]);
      csvData.push(['Tasa de Conversión', `${conversion}%`]);
      csvData.push([]);

      csvData.push(['DISTRIBUCIÓN POR PLAN (filtrada)']);
      csvData.push(['Plan FREE', planDist.free, `$${revByPlan.free.toFixed(0)}`]);
      csvData.push(['Plan Basic', planDist.basic, `$${revByPlan.basic.toFixed(0)}`]);
      csvData.push(['Plan Pro', planDist.pro, `$${revByPlan.pro.toFixed(0)}`]);
      csvData.push(['Plan Business', planDist.business, `$${revByPlan.business.toFixed(0)}`]);
      csvData.push([]);

      csvData.push(['DISTRIBUCIÓN POR DURACIÓN (filtrada)']);
      csvData.push(['Mensual', durationDist.monthly]);
      csvData.push(['Anual', durationDist.annual]);
      csvData.push([]);

      csvData.push(['DETALLE DE RESTAURANTES']);
      csvData.push(['Nombre', 'Email', 'Plan', 'Estado', 'Fecha de Creación']);
      restaurantsFull.forEach((restaurant: any) => {
        const subscription = subscriptionsFull.find((s: any) => s.restaurant_id === restaurant.id);
        csvData.push([
          restaurant.name,
          restaurant.email,
          subscription?.plan_name || subscription?.plan_type || subscription?.plan || 'N/A',
          subscription?.status || 'N/A',
          new Date(restaurant.created_at).toLocaleDateString(),
        ]);
      });

      const csvContent = csvData.map(row => row.map(String).join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `estadisticas_sistema_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export error:', err);
    } finally {
      setCsvLoading(false);
    }
  }, [selectedPlanFilter, selectedPeriodFilter, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium">No se pudieron cargar estadísticas</p>
          <p className="text-sm text-red-700 mt-1">{loadError}</p>
          <div className="mt-3">
            <Button onClick={loadData} icon={RefreshCw} variant="primary">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const maxMonthlyReg = monthlyRegistrations.length ? Math.max(...monthlyRegistrations.map(([, c]) => c)) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h1>
        <div className="flex items-center gap-3">
          <Button onClick={loadData} icon={RefreshCw} variant="ghost" size="sm">
            Actualizar
          </Button>
          <div className="text-sm text-gray-500">Última actualización: {lastUpdatedAt || new Date().toLocaleString()}</div>
          <Button onClick={exportToCSV} icon={Download} variant="primary" disabled={csvLoading}>
            {csvLoading ? 'Generando CSV...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los planes</option>
                <option value="free">FREE</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={selectedPeriodFilter}
                onChange={(e) => setSelectedPeriodFilter(e.target.value as PeriodFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!!(startDate || endDate)}
              >
                <option value="all">Todo el tiempo</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {(selectedPlanFilter !== 'all' || selectedPeriodFilter !== 'all' || startDate || endDate) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPlanFilter('all');
                  setSelectedPeriodFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Económicas */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-sm border border-green-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-600" />
          Estadísticas Económicas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">MRR</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">${financials.mrr.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Ingreso Recurrente Mensual</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">ARR</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">${financials.arr.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Ingreso Recurrente Anual</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
            <p className="text-3xl font-bold text-green-600 mt-2">${financials.totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Suscripciones activas (filtradas)</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">${financials.avgPlanValue}</p>
            <p className="text-xs text-gray-500 mt-1">Por suscripción activa de pago</p>
          </div>
        </div>

        <div className="mt-6 bg-white p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Ingresos por Plan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Gratis</p>
              <p className="text-lg font-bold text-gray-900">${financials.revenueByPlan.free.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">{planDistribution.free} suscripciones</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Basic</p>
              <p className="text-lg font-bold text-blue-900">${financials.revenueByPlan.basic.toFixed(0)}</p>
              <p className="text-xs text-blue-600 mt-1">{planDistribution.basic} suscripciones</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">Pro</p>
              <p className="text-lg font-bold text-purple-900">${financials.revenueByPlan.pro.toFixed(0)}</p>
              <p className="text-xs text-purple-600 mt-1">{planDistribution.pro} suscripciones</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-600 mb-1">Business</p>
              <p className="text-lg font-bold text-orange-900">${financials.revenueByPlan.business.toFixed(0)}</p>
              <p className="text-xs text-orange-600 mt-1">{planDistribution.business} suscripciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Restaurantes</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalRestaurants}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600 font-medium">{totals.activeRestaurants} activos</span>
            <span className="text-sm text-gray-400 mx-1">•</span>
            <span className="text-sm text-red-600 font-medium">{totals.expiredRestaurants} expirados</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalUsers}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600 font-medium">{totals.verifiedUsers} verificados</span>
            <span className="text-sm text-gray-400 mx-1">•</span>
            <span className="text-sm text-blue-600 font-medium">{totals.restaurantOwners} propietarios</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suscripciones</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalFilteredSubscriptions}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600 font-medium">{totals.activeSubscriptions} activas</span>
            <span className="text-sm text-gray-400 mx-1">•</span>
            <span className="text-sm text-red-600 font-medium">{totals.expiredSubscriptions} vencidas</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Crecimiento</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monthlyRegistrations.length > 0 ? monthlyRegistrations[monthlyRegistrations.length - 1][1] : 0}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-purple-600 font-medium">Este mes</span>
          </div>
        </div>
      </div>

      {/* Tasas + Duración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasa de Abandono</p>
            <RefreshCw className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{churnRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Churn rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">A planes de pago</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Suscripciones Mensuales</p>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{durationDistribution.monthly}</p>
          <p className="text-xs text-gray-500 mt-1">Duración mensual</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Suscripciones Anuales</p>
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{durationDistribution.annual}</p>
          <p className="text-xs text-gray-500 mt-1">Duración anual</p>
        </div>
      </div>

      {/* Registros por mes + Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Registros por Mes
          </h3>
          <div className="space-y-3">
            {monthlyRegistrations.map(([month, count]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{month}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / maxMonthlyReg) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Distribución de Planes
          </h3>

          {(['free', 'basic', 'pro', 'business'] as const).map((p) => {
            const count = planDistribution[p];
            const pct = totals.totalFilteredSubscriptions > 0 ? (count / totals.totalFilteredSubscriptions) * 100 : 0;
            const color = p === 'free' ? 'bg-gray-500' : p === 'basic' ? 'bg-blue-500' : p === 'pro' ? 'bg-green-500' : 'bg-orange-500';
            const label = p === 'free' ? 'Gratis' : p.charAt(0).toUpperCase() + p.slice(1);

            return (
              <div key={p} className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Por vencer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Suscripciones por Vencer</h3>
        </div>
        <div className="p-6">
          {expiringSoon.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay suscripciones próximas a vencer</p>
          ) : (
            <div className="space-y-4">
              {expiringSoon.slice(0, 5).map((subscription: any) => {
                const restaurant = restaurants.find((r: any) => r.id === subscription.restaurant_id);
                const daysLeft = Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={subscription.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{restaurant?.name}</p>
                      <p className="text-xs text-gray-500">
                        Vence en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant="warning">{subscription.plan_name || subscription.plan_type || subscription.plan}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
