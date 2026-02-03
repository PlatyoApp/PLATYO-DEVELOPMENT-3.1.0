import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, ShoppingBag, Menu, Eye, TrendingUp, HelpCircle } from 'lucide-react';
import { Product, Order, Category, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { availablePlans } from '../../lib/plans';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/currencyUtils';
import { TutorialModal } from '../../components/restaurant/TutorialModal';

type RecentOrderRow = Pick<Order, 'id' | 'created_at' | 'status' | 'total'> & {
  customer_name?: string | null;
};

export const RestaurantDashboard: React.FC = () => {
  const { restaurant } = useAuth();
  const { t } = useLanguage();

  // Antes cargabas arrays completos. Ahora guardamos contadores / mínimos.
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);

  const [totalOrders, setTotalOrders] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);

  const [categoriesCount, setCategoriesCount] = useState(0);

  const [currentMonthRevenue, setCurrentMonthRevenue] = useState(0);

  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);

  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!restaurant?.id) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  const loadAll = async () => {
    if (!restaurant?.id) return;

    try {
      // Fechas para filtros
      const now = new Date();

      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Estados que cuentan para revenue (los que ya tenías en tu función)
      const revenueStatuses: Order['status'][] = ['delivered', 'ready', 'confirmed'];

      // Ejecutar todo en paralelo y con selects mínimos
      const [
        subscriptionRes,

        // Productos: solo status para contar (sin traer payload)
        productsRes,

        // Órdenes: total count (sin traer filas)
        ordersCountRes,

        // Órdenes de hoy: count con rango por created_at
        todayOrdersCountRes,

        // Revenue mes: traer SOLO totals del mes (y solo estados válidos) y sumar en cliente
        monthOrdersTotalsRes,

        // Recent: solo 5 filas mínimas
        recentOrdersRes,

        // Categorías: count de activas (sin traer filas)
        categoriesCountRes,
      ] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'active')
          .maybeSingle(),

        supabase
          .from('products')
          .select('id,status')
          .eq('restaurant_id', restaurant.id),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .gte('created_at', startOfToday.toISOString())
          .lte('created_at', endOfToday.toISOString()),

        supabase
          .from('orders')
          .select('total,created_at,status')
          .eq('restaurant_id', restaurant.id)
          .in('status', revenueStatuses as any)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString()),

        supabase
          .from('orders')
          .select('id,created_at,status,total,customer_name')
          .eq('restaurant_id', restaurant.id)
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('categories')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true),
      ]);

      // Subscription
      if (subscriptionRes.error) {
        console.error('[Dashboard] Error loading subscription:', subscriptionRes.error);
      } else {
        setCurrentSubscription(subscriptionRes.data ?? null);
      }

      // Productos
      if (productsRes.error) {
        console.error('[Dashboard] Error loading products:', productsRes.error);
      } else {
        const rows = productsRes.data ?? [];
        setTotalProducts(rows.length);
        setActiveProducts(rows.reduce((acc, p: any) => acc + (p.status === 'active' ? 1 : 0), 0));
      }

      // Órdenes total
      if (ordersCountRes.error) {
        console.error('[Dashboard] Error loading orders count:', ordersCountRes.error);
      } else {
        setTotalOrders(ordersCountRes.count ?? 0);
      }

      // Órdenes hoy
      if (todayOrdersCountRes.error) {
        console.error('[Dashboard] Error loading today orders count:', todayOrdersCountRes.error);
      } else {
        setTodayOrders(todayOrdersCountRes.count ?? 0);
      }

      // Revenue mes (sum en cliente, pero dataset ya está acotado al mes + estados)
      if (monthOrdersTotalsRes.error) {
        console.error('[Dashboard] Error loading month totals:', monthOrdersTotalsRes.error);
      } else {
        const totals = monthOrdersTotalsRes.data ?? [];
        const sum = totals.reduce((acc: number, o: any) => acc + (Number(o.total) || 0), 0);
        setCurrentMonthRevenue(sum);
      }

      // Recent orders
      if (recentOrdersRes.error) {
        console.error('[Dashboard] Error loading recent orders:', recentOrdersRes.error);
      } else {
        setRecentOrders((recentOrdersRes.data ?? []) as any);
      }

      // Categorías count
      if (categoriesCountRes.error) {
        console.error('[Dashboard] Error loading categories count:', categoriesCountRes.error);
      } else {
        setCategoriesCount(categoriesCountRes.count ?? 0);
      }
    } catch (err) {
      console.error('[Dashboard] Exception loading dashboard data:', err);
    }
  };

  const getCurrentPlanName = () => {
    if (!currentSubscription) return t('noSubscription');
    const plan = availablePlans.find(p => p.id === currentSubscription.plan_name);
    return plan ? plan.name : currentSubscription.plan_name.toUpperCase();
  };

  const stats = useMemo(() => {
    return {
      totalProducts,
      activeProducts,
      totalOrders,
      todayOrders,
      currentMonthRevenue,
      categories: categoriesCount,
    };
  }, [totalProducts, activeProducts, totalOrders, todayOrders, currentMonthRevenue, categoriesCount]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('pending')}</Badge>;
      case 'confirmed':
        return <Badge variant="info">{t('confirmed')}</Badge>;
      case 'preparing':
        return <Badge variant="info">{t('preparing')}</Badge>;
      case 'ready':
        return <Badge variant="success">{t('ready')}</Badge>;
      case 'delivered':
        return <Badge variant="success">{t('delivered')}</Badge>;
      case 'cancelled':
        return <Badge variant="error">{t('cancelled')}</Badge>;
      default:
        return <Badge variant="gray">{t('orderStatusUnknown')}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">{restaurant?.name}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 bg-gray-50 px-3 md:px-4 py-2 rounded-lg border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">{t('lastUpdate')}: {new Date().toLocaleString()}</span>
            <span className="sm:hidden">{new Date().toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm md:text-base"
          >
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
            {t('btnTutorial')}
          </button>
        </div>
      </div>

      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-blue-700">{t('totalProducts')}</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-900 mt-1 md:mt-2">{stats.totalProducts}</p>
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-blue-200">
                <span className="text-xs md:text-sm text-blue-700 font-medium">
                  {stats.activeProducts} {t('activeProducts')}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Menu className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-green-700">{t('todayOrders')}</p>
              <p className="text-2xl md:text-3xl font-bold text-green-900 mt-1 md:mt-2">{stats.todayOrders}</p>
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-green-200">
                <span className="text-xs md:text-sm text-green-700 font-medium">
                  {stats.totalOrders} {t('statTotalSubtitle')}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <ShoppingBag className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-cyan-100 p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-teal-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-teal-700">{t('totalSales')}</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-teal-900 mt-1 md:mt-2">
                {formatCurrency(stats.currentMonthRevenue, restaurant?.settings?.currency || 'USD')}
              </p>
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-teal-200">
                <span className="text-xs md:text-sm text-teal-700 font-medium">
                  {t('statCurrentMonthSubtitle')}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm border border-orange-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-orange-700">{t('categories')}</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-900 mt-1 md:mt-2">{stats.categories}</p>
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-orange-200">
                <span className="text-xs md:text-sm text-orange-700 font-medium">
                  {t('active')}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <BarChart3 className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Status */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-all">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          {t('restaurantStatus')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{t('status')}</p>
            <Badge variant={restaurant?.is_active ? 'success' : 'warning'}>
              {restaurant?.is_active ? t('active') : t('inactive')}
            </Badge>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{t('statusMenuUrl')}</p>
            <a
              href={`/${restaurant?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium break-all"
            >
              /{restaurant?.slug}
              <Eye className="w-4 h-4 flex-shrink-0" />
            </a>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{t('Delivery')}</p>
            <Badge variant={restaurant?.settings?.delivery?.enabled ? 'success' : 'gray'}>
              {restaurant?.settings?.delivery?.enabled ? t('enabled') : t('disabled')}
            </Badge>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{t('statusSubscription')}</p>
            <Badge variant={currentSubscription?.status === 'active' ? 'success' : 'warning'}>
              {getCurrentPlanName()}
            </Badge>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{t('statusTableService')}</p>
            <Badge variant={restaurant?.settings?.table_orders?.enabled ? 'success' : 'gray'}>
              {restaurant?.settings?.table_orders?.enabled ? t('enabled') : t('disabled')}
            </Badge>
          </div>

          {/* ✅ Extra: lista de órdenes recientes (ya viene limitada a 5) */}
          {recentOrders.length > 0 && (
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {t('recentOrders') ?? 'Órdenes recientes'}
              </p>
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {o.customer_name ? o.customer_name : `${t('order') ?? 'Orden'} #${String(o.id).slice(0, 6)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(o.status)}
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(o.total) || 0, restaurant?.settings?.currency || 'USD')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
