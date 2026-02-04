import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Store, Calendar, DollarSign, Filter, Download, FileText, RefreshCw, Clock } from 'lucide-react';
import { Restaurant, Subscription, User, SubscriptionPlan } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';

export const SuperAdminAnalytics: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const calculateNewEndDate = (currentEndDate: string, duration: Subscription['duration']): string => {
    const endDate = new Date(currentEndDate);

    if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (duration === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return endDate.toISOString();
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [restaurantsRes, subscriptionsRes, usersRes, plansRes] = await Promise.all([
        supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_plans').select('*').order('display_order', { ascending: true })
      ]);

      if (restaurantsRes.error) throw restaurantsRes.error;
      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (plansRes.error) throw plansRes.error;

      const now = new Date();
      const updatedSubscriptions = (subscriptionsRes.data || []).map((sub: any) => {
        const endDate = new Date(sub.end_date);

        if (endDate < now && sub.status === 'active') {
          if (sub.auto_renew) {
            return {
              ...sub,
              start_date: sub.end_date,
              end_date: calculateNewEndDate(sub.end_date, sub.duration),
              status: 'active' as const
            };
          } else {
            return { ...sub, status: 'expired' as const };
          }
        }
        return sub;
      });

      setRestaurants(restaurantsRes.data || []);
      setSubscriptions(updatedSubscriptions);
      setUsers(usersRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSubscriptions = () => {
    let filtered = [...subscriptions];

    if (selectedPlanFilter !== 'all') {
      filtered = filtered.filter(s => s.plan_type === selectedPlanFilter);
    }

    if (selectedPeriodFilter !== 'all' && !startDate && !endDate) {
      const now = new Date();
      const periodStartDate = new Date();

      switch (selectedPeriodFilter) {
        case 'today':
          periodStartDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          periodStartDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStartDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          periodStartDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(s => new Date(s.created_at) >= periodStartDate);
    }

    if (startDate || endDate) {
      filtered = filtered.filter(s => {
        const subDate = new Date(s.created_at);
        if (startDate && subDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (subDate > end) return false;
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredSubscriptions = getFilteredSubscriptions();

  const totalRestaurants = restaurants.length;
  const activeRestaurants = subscriptions.filter(s => s.status === 'active').length;
  const expiredRestaurants = subscriptions.filter(s => s.status === 'expired').length;
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.email_verified).length;
  const restaurantOwners = users.filter(u => u.role === 'restaurant_owner').length;
  const superAdmins = users.filter(u => u.role === 'superadmin').length;

  const activeSubscriptions = filteredSubscriptions.filter(s => s.status === 'active').length;
  const expiredSubscriptions = filteredSubscriptions.filter(s => s.status === 'expired').length;
  const totalFilteredSubscriptions = filteredSubscriptions.length;

  const getMonthlyRegistrations = () => {
    const monthlyData: { [key: string]: number } = {};

    restaurants.forEach(restaurant => {
      const date = new Date(restaurant.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  };

  const monthlyRegistrations = getMonthlyRegistrations();

  const planDistribution = {
    free: filteredSubscriptions.filter(s => s.plan_name === 'free').length,
    basic: filteredSubscriptions.filter(s => s.plan_name === 'basic').length,
    pro: filteredSubscriptions.filter(s => s.plan_name === 'pro').length,
    business: filteredSubscriptions.filter(s => s.plan_name === 'business').length,
  };

  const durationDistribution = {
    monthly: filteredSubscriptions.filter(s => s.duration === 'monthly').length,
    annual: filteredSubscriptions.filter(s => s.duration === 'annual').length,
  };

  const getPlanPrice = (planName: string): number => {
    const plan = plans.find(p => p.slug === planName || p.name.toLowerCase() === planName.toLowerCase());
    if (!plan) return 0;
    return plan.billing_period === 'monthly' ? Number(plan.price) : Number(plan.price) / 12;
  };

  const durationMultipliers: Record<string, number> = {
    monthly: 1,
    annual: 12,
  };

  const calculateRevenue = (subs: Subscription[]) => {
    return subs.reduce((total, sub) => {
      const monthlyPrice = sub.monthly_price || getPlanPrice(sub.plan_name);
      const multiplier = durationMultipliers[sub.duration] || 1;
      return total + (monthlyPrice * multiplier);
    }, 0);
  };

  const totalRevenue = calculateRevenue(filteredSubscriptions.filter(s => s.status === 'active'));
  const potentialRevenue = calculateRevenue(filteredSubscriptions);

  const calculateMRR = () => {
    return subscriptions
      .filter(s => s.status === 'active')
      .reduce((total, sub) => {
        const monthlyPrice = sub.monthly_price || getPlanPrice(sub.plan_name);
        return total + monthlyPrice;
      }, 0);
  };

  const mrr = calculateMRR();

  const calculateARR = () => {
    return mrr * 12;
  };

  const arr = calculateARR();

  const revenueByPlan = {
    free: calculateRevenue(filteredSubscriptions.filter(s => s.plan_name === 'free')),
    basic: calculateRevenue(filteredSubscriptions.filter(s => s.plan_name === 'basic')),
    pro: calculateRevenue(filteredSubscriptions.filter(s => s.plan_name === 'pro')),
    business: calculateRevenue(filteredSubscriptions.filter(s => s.plan_name === 'business')),
  };

  const expiringSoon = subscriptions.filter(sub => {
    const endDate = new Date(sub.end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  const calculateChurnRate = () => {
    const totalSubs = subscriptions.length;
    const expired = subscriptions.filter(s => s.status === 'expired').length;
    return totalSubs > 0 ? ((expired / totalSubs) * 100).toFixed(1) : '0.0';
  };

  const calculateConversionRate = () => {
    const paidPlans = subscriptions.filter(s => s.plan_name !== 'free').length;
    const totalSubs = subscriptions.length;
    return totalSubs > 0 ? ((paidPlans / totalSubs) * 100).toFixed(1) : '0.0';
  };

  const calculateAveragePlanValue = () => {
    const paidSubs = subscriptions.filter(s => s.plan_name !== 'free' && s.status === 'active');
    if (paidSubs.length === 0) return 0;

    const totalValue = paidSubs.reduce((sum, sub) => {
      const monthlyPrice = sub.monthly_price || getPlanPrice(sub.plan_name);
      return sum + monthlyPrice;
    }, 0);

    return (totalValue / paidSubs.length);
  };

  const exportToCSV = () => {
    const csvData = [];

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

    csvData.push(['MÉTRICAS FINANCIERAS']);
    csvData.push(['MRR (Ingreso Recurrente Mensual)', `$${mrr}`]);
    csvData.push(['ARR (Ingreso Recurrente Anual)', `$${arr}`]);
    csvData.push(['Ingresos Totales Activos', `$${totalRevenue}`]);
    csvData.push(['Potencial de Ingresos', `$${potentialRevenue}`]);
    csvData.push(['Valor Promedio por Plan', `$${calculateAveragePlanValue()}`]);
    csvData.push([]);

    csvData.push(['SUSCRIPCIONES']);
    csvData.push(['Total Suscripciones', totalFilteredSubscriptions]);
    csvData.push(['Suscripciones Activas', activeSubscriptions]);
    csvData.push(['Suscripciones Expiradas', expiredSubscriptions]);
    csvData.push(['Tasa de Abandono (Churn)', `${calculateChurnRate()}%`]);
    csvData.push(['Tasa de Conversión', `${calculateConversionRate()}%`]);
    csvData.push([]);

    csvData.push(['DISTRIBUCIÓN POR PLAN']);
    csvData.push(['Plan FREE', planDistribution.free, `$${revenueByPlan.free}`]);
    csvData.push(['Plan Basic', planDistribution.basic, `$${revenueByPlan.basic}`]);
    csvData.push(['Plan Pro', planDistribution.pro, `$${revenueByPlan.pro}`]);
    csvData.push(['Plan Business', planDistribution.business, `$${revenueByPlan.business}`]);
    csvData.push([]);

    csvData.push(['DISTRIBUCIÓN POR DURACIÓN']);
    csvData.push(['Mensual', durationDistribution.monthly]);
    csvData.push(['Anual', durationDistribution.annual]);
    csvData.push([]);

    csvData.push(['DETALLE DE RESTAURANTES']);
    csvData.push(['Nombre', 'Email', 'Plan', 'Estado', 'Fecha de Creación']);
    restaurants.forEach(restaurant => {
      const subscription = subscriptions.find(s => s.restaurant_id === restaurant.id);
      csvData.push([
        restaurant.name,
        restaurant.email,
        subscription?.plan_type || 'N/A',
        subscription?.status || 'N/A',
        new Date(restaurant.created_at).toLocaleDateString()
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `estadisticas_sistema_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadData}
            icon={RefreshCw}
            variant="ghost"
            size="sm"
          >
            Actualizar
          </Button>
          <div className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleString()}
          </div>
          <Button
            onClick={exportToCSV}
            icon={Download}
            variant="primary"
          >
            Exportar CSV
          </Button>
        </div>
      </div>

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
                onChange={(e) => setSelectedPeriodFilter(e.target.value)}
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
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
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

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-sm border border-green-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-600" />
          Estadísticas Económicas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">MRR</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${mrr}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ingreso Recurrente Mensual</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">ARR</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              ${arr}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ingreso Recurrente Anual</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${totalRevenue}
            </p>
            <p className="text-xs text-gray-500 mt-1">Suscripciones activas</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              ${calculateAveragePlanValue().toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Por suscripción de pago</p>
          </div>
        </div>

        <div className="mt-6 bg-white p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Ingresos por Plan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Gratis</p>
              <p className="text-lg font-bold text-gray-900">${revenueByPlan.free}</p>
              <p className="text-xs text-gray-500 mt-1">{planDistribution.free} suscripciones</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Basic</p>
              <p className="text-lg font-bold text-blue-900">${revenueByPlan.basic}</p>
              <p className="text-xs text-blue-600 mt-1">{planDistributiVon.basic} suscripciones</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">Pro</p>
              <p className="text-lg font-bold text-purple-900">${revenueByPlan.pro}</p>
              <p className="text-xs text-purple-600 mt-1">{planDistribution.pro} suscripciones</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-600 mb-1">Business</p>
              <p className="text-lg font-bold text-orange-900">${revenueByPlan.business}</p>
              <p className="text-xs text-orange-600 mt-1">{planDistribution.business} suscripciones</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Store className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Restaurantes</p>
              <p className="text-2xl font-semibold text-gray-900">{totalRestaurants}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600 font-medium">
              {activeRestaurants} activos
            </span>
            <span className="text-sm text-gray-400 mx-1">•</span>
            <span className="text-sm text-red-600 font-medium">
              {expiredRestaurants} expirados
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{totalUsers}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600 font-medium">
              {verifiedUsers} verificados
            </span>
            <span className="text-sm text-gray-400 mx-1">•</span>
            <span className="text-sm text-blue-600 font-medium">
              {restaurantOwners} propietarios
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suscripciones</p>
              <p className="text-2xl font-semibold text-gray-900">{totalFilteredSubscriptions}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600 font-medium">
              {activeSubscriptions} activas
            </span>
            <span className="text-sm text-gray-400 mx-1">•</span>
            <span className="text-sm text-red-600 font-medium">
              {expiredSubscriptions} vencidas
            </span>
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
            <span className="text-sm text-purple-600 font-medium">
              Este mes
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasa de Abandono</p>
            <RefreshCw className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{calculateChurnRate()}%</p>
          <p className="text-xs text-gray-500 mt-1">Churn rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{calculateConversionRate()}%</p>
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
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...monthlyRegistrations.map(([, c]) => c))) * 100}%` }}
                    />
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gratis</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${totalFilteredSubscriptions > 0 ? (planDistribution.free / totalFilteredSubscriptions) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{planDistribution.free}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Basic</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${totalFilteredSubscriptions > 0 ? (planDistribution.basic / totalFilteredSubscriptions) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{planDistribution.basic}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pro</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${totalFilteredSubscriptions > 0 ? (planDistribution.pro / totalFilteredSubscriptions) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{planDistribution.pro}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Business</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${totalFilteredSubscriptions > 0 ? (planDistribution.business / totalFilteredSubscriptions) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{planDistribution.business}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Rendimiento por Plan</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Plan Gratis</span>
                  <Badge variant="default">{planDistribution.free} suscripciones</Badge>
                </div>
                <div className="text-xs text-gray-600">
                  Ingreso: $0.00/mes
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Plan Basic</span>
                  <Badge variant="info">{planDistribution.basic} suscripciones</Badge>
                </div>
                <div className="text-xs text-blue-600">
                  Ingreso: ${(planDistribution.basic * getPlanPrice('basic'))}/mes
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">Plan Pro</span>
                  <Badge variant="success">{planDistribution.pro} suscripciones</Badge>
                </div>
                <div className="text-xs text-green-600">
                  Ingreso: ${(planDistribution.pro * getPlanPrice('pro'))}/mes
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-orange-700">Plan Business</span>
                  <Badge variant="warning">{planDistribution.business} suscripciones</Badge>
                </div>
                <div className="text-xs text-orange-600">
                  Ingreso: ${(planDistribution.business * getPlanPrice('business'))}/mes
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Suscripciones por Vencer</h3>
          </div>
          <div className="p-6">
            {expiringSoon.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay suscripciones próximas a vencer
              </p>
            ) : (
              <div className="space-y-4">
                {expiringSoon.slice(0, 5).map(subscription => {
                  const restaurant = restaurants.find(r => r.id === subscription.restaurant_id);
                  const daysLeft = Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={subscription.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{restaurant?.name}</p>
                        <p className="text-xs text-gray-500">
                          Vence en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="warning">
                        {subscription.plan_type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
