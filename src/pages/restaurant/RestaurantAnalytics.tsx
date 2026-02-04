import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Calendar, Users, Filter, Download, X, Search } from 'lucide-react';
import { Product, Order, Category } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/currencyUtils';

export const RestaurantAnalytics: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const currency = restaurant?.settings?.currency || 'USD';

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [loading, setLoading] = useState(false);

  // 1) Por defecto: HOY
  useEffect(() => {
    if (!restaurant) return;
    const todayStr = new Date().toISOString().split('T')[0];
    setStartDate(todayStr);
    setEndDate(todayStr);
  }, [restaurant]);

  const loadAnalyticsData = useCallback(async () => {
    if (!restaurant?.id) {
      console.log('[Analytics] No restaurant ID available');
      return;
    }

    // Evita cargar pedidos hasta tener rango
    if (!startDate || !endDate) return;

    setLoading(true);

    try {
      const startIso = new Date(startDate).toISOString();
      const endIso = new Date(endDate + 'T23:59:59').toISOString();

      const [
        { data: productsData, error: productsError },
        { data: ordersData, error: ordersError },
        { data: categoriesData, error: categoriesError },
      ] = await Promise.all([
        // Productos: columnas mínimas (si necesitas más, amplía)
        supabase
          .from('products')
          .select('id,name,status,category_id')
          .eq('restaurant_id', restaurant.id),

        // ✅ Órdenes: SOLO del rango seleccionado (por defecto HOY)
        // Mantengo columnas necesarias para tus métricas + CSV (incluye items/customer)
        supabase
          .from('orders')
          .select('id,restaurant_id,created_at,status,order_type,total,subtotal,delivery_cost,order_number,special_instructions,customer,items')
          .eq('restaurant_id', restaurant.id)
          .gte('created_at', startIso)
          .lte('created_at', endIso),

        supabase
          .from('categories')
          .select('id,name,is_active')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true),
      ]);

      if (productsError) console.error('[Analytics] Error loading products:', productsError);
      else setProducts((productsData as any) || []);

      if (ordersError) console.error('[Analytics] Error loading orders:', ordersError);
      else setOrders((ordersData as any) || []);

      if (categoriesError) console.error('[Analytics] Error loading categories:', categoriesError);
      else setCategories((categoriesData as any) || []);
    } catch (err) {
      console.error('[Analytics] Exception loading analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurant?.id, startDate, endDate]);

  // 2) Cargar cuando cambie el rango (hoy por defecto)
  useEffect(() => {
    if (!restaurant) return;
    if (!startDate || !endDate) return;
    loadAnalyticsData();
  }, [restaurant, startDate, endDate, loadAnalyticsData]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Categoría
      if (selectedCategory !== 'all') {
        const hasProductInCategory = order.items?.some((item: any) =>
          item?.product?.category_id === selectedCategory
        );
        if (!hasProductInCategory) return false;
      }

      // Tipo pedido (normaliza “table” vs “dine-in”)
      if (selectedOrderType !== 'all') {
        const normalized =
          selectedOrderType === 'table' ? ['table', 'dine-in'] : [selectedOrderType];
        if (!normalized.includes(order.order_type)) return false;
      }

      // Estado
      if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;

      return true;
    });
  }, [orders, selectedCategory, selectedOrderType, selectedStatus]);

  // Métricas: 1 sola pasada
  const analytics = useMemo(() => {
    let totalOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;

    const ordersByStatus: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };

    const ordersByType = {
      pickup: 0,
      delivery: 0,
      table: 0,
    };

    const monthlyData: Record<string, number> = {};
    const productSales: Record<string, { product: Product; quantity: number; revenue: number }> = {};

    for (const order of filteredOrders) {
      totalOrders++;

      if (order.status && order.status in ordersByStatus) {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      }

      if (order.order_type === 'pickup') ordersByType.pickup++;
      else if (order.order_type === 'delivery') ordersByType.delivery++;
      else if (order.order_type === 'dine-in' || order.order_type === 'table') ordersByType.table++;

      const d = new Date(order.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;

      if (order.status === 'delivered') {
        completedOrders++;
        totalRevenue += (order.total || 0);

        for (const item of (order.items || []) as any[]) {
          const pid = item?.product?.id;
          if (!pid) continue;

          if (!productSales[pid]) {
            productSales[pid] = { product: item.product, quantity: 0, revenue: 0 };
          }

          productSales[pid].quantity += item.quantity || 0;
          productSales[pid].revenue += (item.variation?.price || 0) * (item.quantity || 0);
        }
      }
    }

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    const monthlyOrders = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByType,
      monthlyOrders,
      topProducts,
    };
  }, [filteredOrders]);

  const activeProductsCount = useMemo(
    () => products.filter((p: any) => p.status === 'active').length,
    [products]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    // (Aquí ya no contamos fecha como filtro “extra” porque siempre hay rango por defecto)
    if (selectedCategory !== 'all') count++;
    if (selectedOrderType !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    return count;
  }, [selectedCategory, selectedOrderType, selectedStatus]);

  const clearAllFilters = useCallback(() => {
    // Resetea filtros “no fecha”
    setSelectedCategory('all');
    setSelectedOrderType('all');
    setSelectedStatus('all');
  }, []);

  const generateFileName = useCallback(() => {
    const restaurantName = restaurant?.name || t('fileNameRestaurantDefault');
    const dateRange = startDate && endDate ? `_${startDate}_${endDate}` : '';
    const timestamp = new Date().toISOString().split('T')[0];
    return `${restaurantName}_estadisticas${dateRange}_${timestamp}.csv`;
  }, [restaurant?.name, t, startDate, endDate]);

  const generateCSVContent = useCallback(() => {
    const csvData: any[] = [];

    csvData.push([t('csvReportTitle')]);
    csvData.push([t('csvRestaurantLabel'), restaurant?.name || '']);
    csvData.push([t('csvGenerationDate'), new Date().toLocaleString()]);
    csvData.push([t('csvPeriodLabel'), startDate && endDate ? `${startDate} a ${endDate}` : t('csvAllPeriods')]);
    csvData.push([]);

    csvData.push([t('csvExecutiveSummary')]);
    csvData.push([t('csvTotalOrders'), analytics.totalOrders]);
    csvData.push([t('csvCompletedOrders'), analytics.completedOrders]);
    csvData.push([t('csvCancelledOrders'), analytics.ordersByStatus.cancelled || 0]);
    csvData.push([t('csvCompletionRate'), `${analytics.totalOrders > 0 ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1) : 0}%`]);
    csvData.push([t('csvTotalRevenue'), formatCurrency(analytics.totalRevenue, currency)]);
    csvData.push([t('csvAverageTicket'), formatCurrency(analytics.averageOrderValue, currency)]);
    csvData.push([]);

    csvData.push([t('csvOrderTypeDistribution')]);
    const totalTypeOrders = Object.values(analytics.ordersByType).reduce((s, n) => s + n, 0);
    csvData.push([t('orderTypePickup'), analytics.ordersByType.pickup, `${totalTypeOrders > 0 ? ((analytics.ordersByType.pickup / totalTypeOrders) * 100).toFixed(1) : 0}%`]);
    csvData.push([t('orderTypeDelivery'), analytics.ordersByType.delivery, `${totalTypeOrders > 0 ? ((analytics.ordersByType.delivery / totalTypeOrders) * 100).toFixed(1) : 0}%`]);
    csvData.push([t('orderTypeTable'), analytics.ordersByType.table, `${totalTypeOrders > 0 ? ((analytics.ordersByType.table / totalTypeOrders) * 100).toFixed(1) : 0}%`]);
    csvData.push([]);

    csvData.push([t('csvOrderStatusDistribution')]);
    csvData.push([t('orderStatusPendingPlural'), analytics.ordersByStatus.pending || 0]);
    csvData.push([t('orderStatusConfirmedPlural'), analytics.ordersByStatus.confirmed || 0]);
    csvData.push([t('orderStatusPreparing'), analytics.ordersByStatus.preparing || 0]);
    csvData.push([t('orderStatusReadyPlural'), analytics.ordersByStatus.ready || 0]);
    csvData.push([t('orderStatusDeliveredPlural'), analytics.ordersByStatus.delivered || 0]);
    csvData.push([t('orderStatusCancelledPlural'), analytics.ordersByStatus.cancelled || 0]);
    csvData.push([]);

    csvData.push([t('csvTopSellingProducts')]);
    csvData.push([t('csvPosition'), t('csvProduct'), t('csvQuantitySold'), t('csvRevenue')]);
    analytics.topProducts.forEach((item, index) => {
      csvData.push([`#${index + 1}`, item.product.name, item.quantity, formatCurrency(item.revenue, currency)]);
    });
    csvData.push([]);

    // (Mantenemos el resto de detalles tal cual tu CSV original)
    const csvContent = csvData
      .map(row => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return '\ufeff' + csvContent;
  }, [t, restaurant?.name, startDate, endDate, analytics, currency]);

  const exportToCSV = useCallback(() => {
    if (filteredOrders.length === 0) {
      showToast('warning', 'Sin datos', t('analyticsToastNoData'));
      return;
    }

    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = generateFileName();
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(link);

    showToast('success', 'Exportado', t('analyticsToastExportSuccess'));
  }, [filteredOrders.length, generateCSVContent, generateFileName, showToast, t]);

  const getStatusBadge = useCallback((status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('orderStatusPending')}</Badge>;
      case 'confirmed':
        return <Badge variant="info">{t('orderStatusConfirmed')}</Badge>;
      case 'preparing':
        return <Badge variant="info">{t('orderStatusPreparing')}</Badge>;
      case 'ready':
        return <Badge variant="success">{t('orderStatusReady')}</Badge>;
      case 'delivered':
        return <Badge variant="success">{t('orderStatusDelivered')}</Badge>;
      case 'cancelled':
        return <Badge variant="error">{t('orderStatusCancelled')}</Badge>;
      default:
        return <Badge variant="gray">{t('orderStatusUnknown')}</Badge>;
    }
  }, [t]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          {t('analyticsPageTitle')}
        </h1>

        <div className="flex flex-wrap justify-start md:justify-end items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={exportToCSV}
            className="bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            {t('btnExportCSV')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
            className="
              bg-gray-600 text-white border-gray-600
              hover:bg-gray-600 hover:text-white hover:border-gray-600
              active:bg-gray-600 active:text-white active:border-gray-600
            "
          >
            {t('btnAdvancedFilters')}
            {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          {t('loading')}...
        </div>
      )}

      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('btnAdvancedFilters')}</h3>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('filterDateRange')}</label>
              <Input
                type="date"
                placeholder={t('filterDateStart')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
              <Input
                type="date"
                placeholder={t('filterDateUntil')}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterCategory')}</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('filterAllCategories')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterOrderType')}</label>
              <select
                value={selectedOrderType}
                onChange={(e) => setSelectedOrderType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('filterAllTypes')}</option>
                <option value="pickup">{t('orderTypePickup')}</option>
                <option value="delivery">{t('orderTypeDelivery')}</option>
                <option value="table">{t('orderTypeTable')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('filterStatus')}</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('filterAllStatuses')}</option>
                <option value="pending">{t('orderStatusPending')}</option>
                <option value="confirmed">{t('orderStatusConfirmed')}</option>
                <option value="preparing">{t('orderStatusPreparing')}</option>
                <option value="ready">{t('orderStatusReady')}</option>
                <option value="delivered">{t('orderStatusDelivered')}</option>
                <option value="cancelled">{t('orderStatusCancelled')}</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            📊 {t('filterSummaryShowing')} <strong>{filteredOrders.length}</strong>{' '}
            {filteredOrders.length !== 1 ? t('filterSummaryOrderPlural') : t('filterSummaryOrderSingular')}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {t('analyticsLastUpdated')}: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('statTotalOrders')}</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('statTotalRevenue')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(analytics.totalRevenue, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-teal-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('statAverageTicket')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(analytics.averageOrderValue, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('statActiveProducts')}</p>
              <p className="text-2xl font-semibold text-gray-900">{activeProductsCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            {t('chartOrdersByType')}
          </h3>

          <div className="space-y-3">
            {(() => {
              const totalTypeOrders = Object.values(analytics.ordersByType).reduce((sum, count) => sum + count, 0);

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('orderTypePickup')}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-gray-500 h-2 rounded-full"
                          style={{ width: `${totalTypeOrders > 0 ? (analytics.ordersByType.pickup / totalTypeOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{analytics.ordersByType.pickup}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('orderTypeDelivery')}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${totalTypeOrders > 0 ? (analytics.ordersByType.delivery / totalTypeOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{analytics.ordersByType.delivery}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('orderTypeTable')}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${totalTypeOrders > 0 ? (analytics.ordersByType.table / totalTypeOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{analytics.ordersByType.table}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {t('chartOrdersByMonth')}
          </h3>

          <div className="space-y-3">
            {analytics.monthlyOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">{t('chartNoData')}</p>
            ) : (
              analytics.monthlyOrders.map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / Math.max(...analytics.monthlyOrders.map(([, c]) => c))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
