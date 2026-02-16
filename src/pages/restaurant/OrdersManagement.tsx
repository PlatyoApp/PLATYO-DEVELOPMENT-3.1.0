import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  Pencil as Edit,
  Trash2,
  Clock,
  Filter,
  Search,
  Plus,
  MessageSquare,
  Printer,
  DollarSign,
  TrendingUp,
  Calendar,
  ShoppingBag
} from 'lucide-react';

import { Order, Product, Category } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { OrderProductSelector } from '../../components/restaurant/OrderProductSelector';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * Item ligero para listar en tabla (SIN items)
 */
type OrderListItem = {
  id: string;
  restaurant_id: string;
  order_number: string;
  status: Order['status'];
  order_type: Order['order_type'];
  total: number;
  created_at: string;
  table_number: string | null;
  delivery_address: string | null;
  whatsapp_sent?: boolean | null;
  customer: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    delivery_instructions?: string | null;
  };
};

export const OrdersManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const currency = restaurant?.settings?.currency || 'USD';

  // ===== Pagination/List =====
  const ITEMS_PER_PAGE = 10;
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalOrders / ITEMS_PER_PAGE));
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ===== Detail lazy =====
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ===== Filters/Search/Sort =====
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ===== Bulk =====
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // ===== Create/Edit/Delete =====
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // ===== Products/Categories (for create/edit) with caching =====
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoadedAt, setCatalogLoadedAt] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<Order['items']>([]);

  // ===== Form =====
  const [orderForm, setOrderForm] = useState({
    customer: { name: '', phone: '+57 ', email: '', address: '', delivery_instructions: '' },
    order_type: 'pickup' as Order['order_type'],
    status: 'pending' as Order['status'],
    delivery_address: '',
    table_number: '',
    special_instructions: ''
  });

  // ===== Stats =====
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
    todayRevenue: 0,
    todayOrders: 0,
    averageOrderValue: 0,
    completionRate: 0
  });

  // ===== Helpers =====
  const escapeLike = (s: string) => s.replace(/[%_]/g, (m) => `\\${m}`);

  const getTodayRangeISO = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  };

  // Reset page on filters/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, dateFilter, startDate, endDate, sortBy, sortOrder]);

  // Load list page (server-side)
  useEffect(() => {
    if (!restaurant?.id) return;
    loadOrdersPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    restaurant?.id,
    currentPage,
    searchTerm,
    statusFilter,
    typeFilter,
    dateFilter,
    startDate,
    endDate,
    sortBy,
    sortOrder
  ]);

  // Load stats initially (and refresh via events)
  useEffect(() => {
    if (!restaurant?.id) return;
    loadOrderStatsAccurate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  // Load products/categories on demand (open create/edit)
  useEffect(() => {
    if (!restaurant?.id) return;
    if (!showCreateOrderModal && !showEditOrderModal) return;
    loadProductsAndCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id, showCreateOrderModal, showEditOrderModal]);

  // =============================
  // 1) LIST (fast)
  // =============================
  const loadOrdersPage = async () => {
    if (!restaurant?.id) return;

    setLoadingOrders(true);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('orders')
      .select(
        `
        id,
        restaurant_id,
        order_number,
        status,
        order_type,
        total,
        total_amount,
        created_at,
        table_number,
        delivery_address,
        whatsapp_sent,
        customer_name,
        customer_phone,
        customer_email,
        customer_address
      `,
        { count: 'exact' }
      )
      .eq('restaurant_id', restaurant.id);

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (typeFilter !== 'all') query = query.eq('order_type', typeFilter);

    if (dateFilter !== 'all') {
      const today = new Date();
      const start = new Date(today);
      const end = new Date(today);

      if (dateFilter === 'today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      } else if (dateFilter === 'yesterday') {
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      } else if (dateFilter === 'custom') {
        if (startDate && endDate) {
          const s = new Date(startDate);
          const e = new Date(endDate);
          s.setHours(0, 0, 0, 0);
          e.setHours(23, 59, 59, 999);
          query = query.gte('created_at', s.toISOString()).lte('created_at', e.toISOString());
        }
      }
    }

    if (searchTerm.trim()) {
      const s = escapeLike(searchTerm.trim());
      query = query.or(
        `order_number.ilike.%${s}%,customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%`
      );
    }

    if (sortBy === 'date') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'status') {
      query = query.order('status', { ascending: sortOrder === 'asc' }).order('created_at', { ascending: false });
    } else if (sortBy === 'total') {
      query = query.order('total', { ascending: sortOrder === 'asc', nullsFirst: false }).order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    setLoadingOrders(false);

    if (error) {
      console.error('Error loading orders page:', error);
      showToast('error', 'Error', 'No se pudieron cargar los pedidos');
      return;
    }

    setTotalOrders(count ?? 0);

    const mapped: OrderListItem[] = (data ?? []).map((o: any) => ({
      id: o.id,
      restaurant_id: o.restaurant_id,
      order_number: o.order_number,
      status: o.status,
      order_type: o.order_type,
      total: o.total ?? o.total_amount ?? 0,
      created_at: o.created_at,
      table_number: o.table_number ?? null,
      delivery_address: o.delivery_address ?? null,
      whatsapp_sent: o.whatsapp_sent ?? false,
      customer: {
        name: o.customer_name ?? '',
        phone: o.customer_phone ?? '',
        email: o.customer_email ?? null,
        address: o.customer_address ?? null,
        delivery_instructions: null
      }
    }));

    setOrders(mapped);
    setSelectedOrders([]);
  };

  // =============================
  // 2) STATS (accurate, fast)
  // =============================
  const loadOrderStatsAccurate = async () => {
    if (!restaurant?.id) return;

    try {
      const { startISO, endISO } = getTodayRangeISO();

      // OPTIMIZED: Single query instead of 9+ queries
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('status, total, total_amount, created_at')
        .eq('restaurant_id', restaurant.id);

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      const orders = allOrders || [];

      // Calculate all stats in memory (much faster than 9+ database queries)
      const total = orders.length;
      const counts: Record<string, number> = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        delivered: 0,
        cancelled: 0
      };

      let todayOrdersCount = 0;
      let todayRevenue = 0;
      let deliveredSum = 0;
      let deliveredCount = 0;

      orders.forEach(order => {
        // Count by status
        if (order.status && counts.hasOwnProperty(order.status)) {
          counts[order.status]++;
        }

        // Today's orders
        if (order.created_at >= startISO && order.created_at <= endISO) {
          todayOrdersCount++;
          if (order.status === 'delivered') {
            const amount = order.total ?? order.total_amount ?? 0;
            todayRevenue += amount;
          }
        }

        // All delivered orders for average
        if (order.status === 'delivered') {
          deliveredCount++;
          deliveredSum += (order.total ?? order.total_amount ?? 0);
        }
      });

      const averageOrderValue = deliveredCount > 0 ? deliveredSum / deliveredCount : 0;
      const completionRate = total ? ((counts.delivered ?? 0) / total) * 100 : 0;

      setOrderStats({
        total,
        pending: counts.pending ?? 0,
        confirmed: counts.confirmed ?? 0,
        preparing: counts.preparing ?? 0,
        ready: counts.ready ?? 0,
        delivered: counts.delivered ?? 0,
        cancelled: counts.cancelled ?? 0,
        todayRevenue,
        todayOrders: todayOrdersCount,
        averageOrderValue,
        completionRate
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // =============================
  // 3) Products/Categories - OPTIMIZED with caching
  // =============================
  const loadProductsAndCategories = async () => {
    if (!restaurant?.id) return;

    // OPTIMIZED: Cache catalog for 5 minutes to avoid repeated loads
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    if (catalogLoadedAt && (now - catalogLoadedAt < CACHE_DURATION)) {
      // Catalog is still fresh, skip reload
      return;
    }

    const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, description, display_order, is_active, restaurant_id')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true),
      supabase
        .from('products')
        .select('id, name, description, price, image_url, images, variations, ingredients, is_available, status, restaurant_id')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('name', { ascending: true })
    ]);

    setCategories(categoriesData || []);
    setProducts(productsData || []);
    setCatalogLoadedAt(now);
  };

  // =============================
  // 4) ORDER DETAIL (lazy) + FIX product names - OPTIMIZED
  // =============================
  const enrichItemsWithCatalog = (items: any[]): any[] => {
    if (!items || items.length === 0) return [];

    // OPTIMIZED: Build lookup Map once instead of using array.find() for each item
    // This changes complexity from O(n*m) to O(n+m)
    const productsMap = new Map();
    products.forEach(product => {
      productsMap.set(product.id, product);
    });

    return items.map((item: any, index: number) => {
      const productFromCatalog = productsMap.get(item.product_id);

      const productName =
        item.product_name ||
        item?.product?.name ||
        productFromCatalog?.name ||
        'Producto';

      const variationFromCatalog = productFromCatalog?.variations?.find((v: any) => v.id === item.variation_id);

      const variationName =
        item.variation_name ||
        item?.variation?.name ||
        variationFromCatalog?.name ||
        'Variación';

      const variationPrice =
        item.unit_price ||
        item?.variation?.price ||
        variationFromCatalog?.price ||
        0;

      return {
        id: item.id || `${item.order_id || 'order'}-${index}`,
        product_id: item.product_id,
        product: productFromCatalog
          ? productFromCatalog
          : { id: item.product_id, name: productName },
        variation: {
          id: item.variation_id,
          name: variationName,
          price: variationPrice
        },
        quantity: item.quantity || 1,
        unit_price: item.unit_price || variationPrice || 0,
        total_price:
          item.total_price ||
          (item.unit_price || variationPrice || 0) * (item.quantity || 1),
        special_notes: item.special_notes || '',
        selected_ingredients: item.selected_ingredients || []
      };
    });
  };

  const fetchOrderById = async (orderId: string): Promise<Order | null> => {
    if (!restaurant?.id) return null;

    // Trae el pedido completo (incluye items JSON)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('restaurant_id', restaurant.id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      showToast('error', 'Error', 'No se pudo cargar el pedido');
      return null;
    }

    const rawItems = data.items || [];
    const mappedItems = enrichItemsWithCatalog(rawItems);

    const full: Order = {
      ...data,
      items: mappedItems,
      total: data.total || data.total_amount || 0,
      subtotal: data.subtotal || 0,
      delivery_cost: data.delivery_cost || 0,
      customer: {
        name: data.customer_name || '',
        phone: data.customer_phone || '',
        email: data.customer_email || '',
        address: data.customer_address || '',
        delivery_instructions: data.delivery_instructions || ''
      }
    };

    return full;
  };

  const ensureCatalogLoaded = async () => {
    // Si no hay catálogo cargado, lo cargamos (solo cuando haga falta para ver/editar)
    if (!restaurant?.id) return;
    if (products.length > 0 && categories.length > 0) return;
    await loadProductsAndCategories();
  };

  const handleViewOrder = async (orderId: string) => {
    setShowModal(true);
    setSelectedOrder(null);
    setLoadingOrderDetail(true);
  
    const full = await fetchOrderById(orderId); // sin catálogo
  
    setLoadingOrderDetail(false);
    if (full) setSelectedOrder(full);
  };


const handleEditOrderById = async (orderId: string) => {
  setShowEditOrderModal(true);
  setEditingOrder(null);
  setLoadingOrderDetail(true);

  try {
    // Corre en paralelo: catálogo (si hace falta) + pedido
    const catalogPromise =
      products.length > 0 ? Promise.resolve() : ensureCatalogLoaded();

    const [_, full] = await Promise.all([
      catalogPromise,
      fetchOrderById(orderId) // trae items y datos del pedido
    ]);

    if (!full) {
      setShowEditOrderModal(false);
      return;
    }

    setEditingOrder(full);
    setOrderForm({
      customer: full.customer,
      order_type: full.order_type,
      status: full.status,
      delivery_address: full.delivery_address || '',
      table_number: full.table_number || '',
      special_instructions: full.special_instructions || ''
    });
    setOrderItems(full.items || []);
  } finally {
    setLoadingOrderDetail(false);
  }
};


  // =============================
  // 5) Badges / Status
  // =============================
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
        return <Badge variant="gray">{t('unknown')}</Badge>;
    }
  };

  const getOrderTypeBadge = (orderType: string, tableNumber?: string | null) => {
    switch (orderType) {
      case 'delivery':
        return <Badge variant="info">{t('deliveryOrderType')}</Badge>;
      case 'pickup':
        return <Badge variant="gray">{t('pickup')}</Badge>;
      case 'dine-in':
        return <Badge variant="warning">{t('tableOrderType')} {tableNumber || ''}</Badge>;
      default:
        return <Badge variant="gray">{orderType}</Badge>;
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const statusFlow: Record<Order['status'], Order['status'] | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivered',
      delivered: null,
      cancelled: null
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus: Order['status']): string => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return '';

    const labels: Record<Order['status'], string> = {
      pending: t('statusPending'),
      confirmed: t('actionConfirm'),
      preparing: t('actionPrepare'),
      ready: t('actionMarkReady'),
      delivered: t('actionDeliver'),
      cancelled: t('cancelled')
    };
    return labels[nextStatus];
  };

  // =============================
  // 6) Quick / Bulk updates + refresh stats correctly
  // =============================
  const handleQuickStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      showToast('error', t('errorTitle'), 'No se pudo actualizar el estado', 4000);
      return;
    }

    // Optimistic local update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    // Refresh stats (fix #2)
    loadOrderStatsAccurate();

    showToast('success', t('statusUpdatedTitle'), t('orderStatusMarkedSuccess'), 3000);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: bulkAction as Order['status'], updated_at: new Date().toISOString() })
      .in('id', selectedOrders);

    if (error) {
      console.error('Error updating orders:', error);
      showToast('error', t('errorTitle'), 'No se pudieron actualizar los pedidos', 4000);
      return;
    }

    showToast('success', t('bulkActionCompleteTitle'), `${selectedOrders.length} ${t('ordersUpdatedCount')}`, 3000);

    setSelectedOrders([]);
    setBulkAction('');
    setShowBulkActions(false);

    await loadOrdersPage();
    loadOrderStatsAccurate(); // fix #2
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === orders.length && orders.length > 0) setSelectedOrders([]);
    else setSelectedOrders(orders.map((o) => o.id));
  };

  // =============================
  // 7) WhatsApp: mensajes por estado (según estado del pedido)
  // =============================
  const buildWhatsappStatusMessage = (order: Order) => {
    const restaurantName = restaurant?.name || t('restaurantDefaultName');
    const customerName = order.customer?.name || '';
    const orderNumber = order.order_number || '';

    // Sin iconos/emojis. Usamos negrilla con *texto*.
    switch (order.status) {
      case 'pending':
        return `Hola *${customerName}*.

¡Gracias por tu pedido! Ya lo recibimos y lo estamos revisando para confirmarlo.

Pedido: *${orderNumber}*
Restaurante: *${restaurantName}*

En breve te actualizaremos sobre el estado de tu pedido`;

      case 'confirmed':
        return `¡Tu pedido fue *confirmado!* Ya lo tenemos en marcha.

Te avisaremos cuando esté en preparación y se encuentre listo.`;

      case 'preparing':
        return `Ya estamos *preparando* tu pedido.

Te informaremos en cuanto esté listo.`;

      case 'ready':
        return `Buenas noticias *${customerName}*.

¡Tu pedido ya se encuentra *listo*!`;

      case 'delivered':
        return `¡Pedido *entregado* con éxito!

Gracias por elegir *${restaurantName}*. Estaremos encantados de atenderte nuevamente.`;

      case 'cancelled':
        return `Hola *${customerName}*.

Tu pedido fue *cancelado*.

Si quieres, podemos ayudarte a crearlo de nuevo o revisarlo contigo.`;

      default:
        return `Hola *${customerName}*.

Tu pedido está en estado: *${order.status}*.`;
    }
  };


  const generateWhatsAppMessage = (order: Order) => {
    const message = buildWhatsappStatusMessage(order);
    return encodeURIComponent(message);
  };

  const sendWhatsAppMessageById = async (orderId: string) => {
    // No necesitamos items para estos mensajes por estado, pero reutilizamos tu fetch actual.
    const full = await fetchOrderById(orderId);
    if (!full) return;

    if (!full.customer?.phone || full.customer.phone.trim() === '') {
      showToast('error', t('errorTitle'), t('noPhoneError'), 4000);
      return;
    }

    const whatsappNumber = full.customer.phone.replace(/[^\d]/g, '');
    if (!whatsappNumber || whatsappNumber.length < 10) {
      showToast('error', t('errorTitle'), t('invalidPhoneError'), 4000);
      return;
    }

    const msg = generateWhatsAppMessage(full);
    const url = `https://wa.me/${whatsappNumber}?text=${msg}`;
    const newWindow = window.open(url, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      showToast('warning', t('warningTitle'), t('popupWarning'), 5000);
      return;
    }

    // (opcional) marcar como enviado
    try {
      await supabase
        .from('orders')
        .update({ whatsapp_sent: true, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, whatsapp_sent: true } : o)));
    } catch (e) {
      // No bloquea el envío
      console.warn('No se pudo marcar whatsapp_sent:', e);
    }

    showToast('success', t('successTitle'), t('openingWhatsapp'), 2000);
  };

  // =============================
  // 8) PRINT TICKET (keep EXACT design)  ✅ FIX #1
  // =============================
  const printTicket = (order: Order) => {
    if (!restaurant) return;

    const billing = restaurant.settings?.billing;
    const subtotal = order.subtotal;
    const iva = billing?.responsableIVA ? subtotal * 0.19 : 0;
    const ipc = billing?.aplicaIPC ? subtotal * ((billing?.porcentajeIPC || 8) / 100) : 0;
    const propina = billing?.aplicaPropina ? subtotal * 0.10 : 0;
    const total = order.total;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // === TU DISEÑO ORIGINAL (sin cambios) ===
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${t('ticketTitle')} - ${order.order_number}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }

            html, body {
              width: 80mm;
              margin: 0;
              padding: 0;
              background: white;
            }

            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 10px;
              box-sizing: border-box;
            }

            .ticket-header {
              text-align: center;
              border-bottom: 2px dashed #333;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }

            .logo {
              max-width: 120px;
              max-height: 80px;
              margin: 0 auto 10px;
            }

            .restaurant-name {
              font-size: 16px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 5px;
            }

            .info-line {
              font-size: 10px;
              margin: 2px 0;
            }

            .section {
              margin: 10px 0;
              padding: 5px 0;
            }

            .section-title {
              font-weight: bold;
              text-transform: uppercase;
              border-bottom: 1px solid #333;
              margin-bottom: 5px;
            }

            .order-info {
              margin: 10px 0;
            }

            .order-info-line {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 11px;
            }

            .items-table {
              width: 100%;
              margin: 10px 0;
            }

            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 11px;
            }

            .item-name {
              flex: 1;
              padding-right: 10px;
            }

            .item-qty {
              width: 30px;
              text-align: center;
            }

            .item-price {
              width: 70px;
              text-align: right;
            }

            .item-total {
              width: 80px;
              text-align: right;
              font-weight: bold;
            }

            .totals {
              border-top: 1px solid #333;
              margin-top: 10px;
              padding-top: 5px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
              font-size: 11px;
            }

            .total-row.final {
              font-size: 14px;
              font-weight: bold;
              border-top: 2px solid #333;
              padding-top: 5px;
              margin-top: 5px;
            }

            .footer {
              text-align: center;
              border-top: 2px dashed #333;
              padding-top: 10px;
              margin-top: 10px;
              font-size: 10px;
            }

            .dian-info {
              font-size: 9px;
              text-align: center;
              margin: 5px 0;
            }

            .message {
              font-size: 11px;
              font-style: italic;
              margin: 10px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="ticket-header">
            ${billing?.mostrarLogoEnTicket && billing?.logoTicket ? `<img src="${billing.logoTicket}" alt="Logo" class="logo">` : ''}

            <div class="restaurant-name">${billing?.nombreComercial || restaurant.name}</div>
            ${billing?.razonSocial ? `<div class="info-line">${billing.razonSocial}</div>` : ''}
            ${billing?.nit ? `<div class="info-line">NIT: ${billing.nit}</div>` : ''}
            ${billing?.direccion ? `<div class="info-line">${billing.direccion}</div>` : ''}
            ${
              billing?.ciudad && billing?.departamento
                ? `<div class="info-line">${billing.ciudad}, ${billing.departamento}</div>`
                : billing?.ciudad
                  ? `<div class="info-line">${billing.ciudad}</div>`
                  : ''
            }
            ${billing?.telefono ? `<div class="info-line">${t('phone_label')}: ${billing.telefono}</div>` : ''}
            ${billing?.correo ? `<div class="info-line">${t('emailLabel')}: ${billing.correo}</div>` : ''}

            ${
              billing?.tieneResolucionDIAN && billing?.numeroResolucionDIAN
                ? `
                  <div class="dian-info">
                    ${t('dianResolutionNumber')} ${billing.numeroResolucionDIAN}<br>
                    ${t('dateLabel')}: ${billing.fechaResolucion ? new Date(billing.fechaResolucion).toLocaleDateString('es-CO') : ''}<br>
                    ${t('rangeLabel')}: ${billing.rangoNumeracionDesde || ''} - ${billing.rangoNumeracionHasta || ''}
                  </div>
                `
                : ''
            }

            ${
              billing?.regimenTributario
                ? `
                  <div class="info-line">
                    ${
                      billing.regimenTributario === 'simple'
                        ? t('taxRegimeSimple')
                        : billing.regimenTributario === 'comun'
                          ? t('taxRegimeCommon')
                          : t('taxRegimeNoIva')
                    }
                  </div>
                `
                : ''
            }
          </div>

          <div class="order-info">
            <div class="order-info-line">
              <span><strong>${t('orderLabel')}:</strong></span>
              <span>${order.order_number}</span>
            </div>
            <div class="order-info-line">
              <span><strong>${t('dateLabel')}:</strong></span>
              <span>${new Date(order.created_at).toLocaleString('es-CO')}</span>
            </div>
            <div class="order-info-line">
              <span><strong>${t('orderType')}:</strong></span>
              <span>${
                order.order_type === 'delivery'
                  ? t('deliveryOrderType')
                  : order.order_type === 'pickup'
                    ? t('pickupOrderType')
                    : `${t('tableOrderType')} ${order.table_number || ''}`
              }</span>
            </div>
            <div class="order-info-line">
              <span><strong>${t('customerLabel')}:</strong></span>
              <span>${order.customer.name}</span>
            </div>
            <div class="order-info-line">
              <span><strong>${t('phone_label')}:</strong></span>
              <span>${order.customer.phone}</span>
            </div>
            ${
              order.delivery_address
                ? `
                  <div class="order-info-line">
                    <span><strong>${t('addressLabel')}:</strong></span>
                    <span>${order.delivery_address}</span>
                  </div>
                `
                : ''
            }
          </div>

          <div class="section">
            <div class="section-title">${t('productsSectionTitle')}</div>
            <div class="items-table">
              ${order.items.map(item => {
                const unitPrice = (item.total_price || 0) / (item.quantity || 1);
                return `
                <div class="item-row">
                  <div class="item-name">
                    ${item.product.name}<br>
                    <small style="font-size: 9px; color: #666;">${item.variation.name}</small>
                    ${
                      item.selected_ingredients && item.selected_ingredients.length > 0
                        ? item.selected_ingredients
                            .filter((ing: any) => ing.optional === true)
                            .map((ing: any) => {
                              const ingName = typeof ing === 'object' ? ing.name : ing;
                              const ingCost = ing.extra_cost > 0 ? ` (+${formatCurrency(ing.extra_cost, currency)})` : '';
                              return `<br><small style="font-size: 9px; color: #0066cc;">+ ${ingName}${ingCost}</small>`;
                            })
                            .join('')
                        : ''
                    }
                    ${item.special_notes ? `<br><small style="font-size: 9px; color: #666;">${t('noteLabel')}: ${item.special_notes}</small>` : ''}
                  </div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-price">${formatCurrency(unitPrice, currency)}</div>
                  <div class="item-total">${formatCurrency(item.total_price || 0, currency)}</div>
                </div>
              `;
              }).join('')}
            </div>
          </div>

          <div class="totals">
            <div class="total-row">
              <span>${t('subtotalLabel')}:</span> <span>${formatCurrency(subtotal, currency)}</span>
            </div>
            ${
              order.delivery_cost && order.delivery_cost > 0
                ? `<div class="total-row"><span>${t('deliveryLabel')}:</span> <span>${formatCurrency(order.delivery_cost, currency)}</span></div>`
                : ''
            }
            ${
              billing?.responsableIVA
                ? `<div class="total-row"><span>${t('ivaLabel')}:</span> <span>${formatCurrency(iva, currency)}</span></div>`
                : ''
            }
            ${
              billing?.aplicaIPC
                ? `<div class="total-row"><span>IPC (${billing?.porcentajeIPC || 8}%):</span> <span>${formatCurrency(ipc, currency)}</span></div>`
                : ''
            }
            ${
              billing?.aplicaPropina
                ? `<div class="total-row"><span>${t('suggestedTipLabel')}:</span> <span>${formatCurrency(propina, currency)}</span></div>`
                : ''
            }
            <div class="total-row final">
              <span>${t('totalLabel')}:</span> <span>${formatCurrency(total, currency)}</span>
            </div>
            ${
              billing?.aplicaPropina
                ? `<div class="total-row" style="font-size: 10px; color: #666; margin-top: 3px;">
                    <span>${t('totalWithTipLabel')}:</span> <span>${formatCurrency(total + propina, currency)}</span>
                  </div>`
                : ''
            }
          </div>

          ${
            billing?.mensajeFinalTicket
              ? `<div class="message">${billing.mensajeFinalTicket}</div>`
              : ''
          }

          <div class="footer">
            <div>${t('thankYouForPurchase')}</div>
            <div style="margin-top: 5px;">${new Date().toLocaleString('es-CO')}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  // =============================
  // 9) Delete
  // =============================
  const handleDeleteOrder = async (orderId: string) => {
    // OPTIMIZED: No need to load catalog just to show delete confirmation
    const full = await fetchOrderById(orderId);
    if (!full) return;
    setOrderToDelete(full);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderToDelete.id);

    if (error) {
      console.error('Error deleting order:', error);
      showToast('error', t('errorTitle'), 'No se pudo eliminar el pedido', 4000);
      return;
    }

    setShowDeleteModal(false);
    setOrderToDelete(null);

    showToast('success', t('orderDeletedTitle'), t('orderDeleteSuccess'), 4000);

    const afterTotal = Math.max(0, totalOrders - 1);
    const afterPages = Math.max(1, Math.ceil(afterTotal / ITEMS_PER_PAGE));
    setCurrentPage((p) => Math.min(p, afterPages));

    // OPTIMIZED: Only reload the orders list, not the stats
    await loadOrdersPage();
  };

  // =============================
  // 10) Create/Edit helpers
  // =============================
  const resetOrderForm = () => {
    setOrderForm({
      customer: { name: '', phone: '+57 ', email: '', address: '', delivery_instructions: '' },
      order_type: 'pickup',
      status: 'pending',
      delivery_address: '',
      table_number: '',
      special_instructions: ''
    });
    setOrderItems([]);
  };

  const addItemToOrder = (
    product: Product,
    variationId: string,
    quantity: number,
    ingredientIds?: string[],
    specialNotes?: string
  ) => {
    const variation = product.variations.find((v) => v.id === variationId);
    if (!variation) return;

    const selectedIngredients = ingredientIds
      ? product.ingredients?.filter((ing) => ingredientIds.includes(ing.id)) || []
      : [];

    const ingredientsExtraCost = selectedIngredients.reduce((sum, ing) => sum + (ing.extra_cost || 0), 0);
    const totalPrice = (variation.price + ingredientsExtraCost) * quantity;

    const newItem = {
      id: `${Date.now()}-${Math.random()}`,
      product_id: product.id,
      product, // <-- importante para mostrar nombre
      variation: { id: variation.id, name: variation.name, price: variation.price },
      quantity,
      unit_price: variation.price + ingredientsExtraCost,
      total_price: totalPrice,
      selected_ingredients: selectedIngredients,
      special_notes: specialNotes || ''
    };

    setOrderItems((prev) => [...prev, newItem]);
  };

  const removeItemFromOrder = (itemId: string) =>
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return removeItemFromOrder(itemId);

    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) return { ...item, quantity, total_price: item.unit_price * quantity };
        return item;
      })
    );
  };

  const generateOrderNumber = async () => {
    if (!restaurant) return '#RES-1001';

    const { data: allOrders } = await supabase
      .from('orders')
      .select('order_number')
      .eq('restaurant_id', restaurant.id);

    let maxNumber = 1000;
    (allOrders || []).forEach((o: any) => {
      const match = (o.order_number || '').match(/#?RES-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNumber) maxNumber = n;
      }
    });

    return `#RES-${maxNumber + 1}`;
  };

  const handleCreateOrder = async () => {
    if (!restaurant) return;

    if (!orderForm.customer.name.trim() || !orderForm.customer.phone.trim()) {
      showToast('error', t('errorTitle'), t('namePhoneRequiredError'), 4000);
      return;
    }
    if (orderItems.length === 0) {
      showToast('error', t('errorTitle'), 'Debes agregar al menos un producto al pedido', 4000);
      return;
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const deliveryCost =
      orderForm.order_type === 'delivery' ? restaurant.settings?.delivery?.zones?.[0]?.cost || 0 : 0;
    const total = subtotal + deliveryCost;

    // Para que "ver" siempre tenga nombres, guardamos también nombres en items (si aún no lo haces)
    const itemsToStore = orderItems.map((it: any) => ({
      ...it,
      product_name: it.product?.name,
      variation_name: it.variation?.name,
      variation_id: it.variation?.id,
      unit_price: it.unit_price,
      quantity: it.quantity,
      total_price: it.total_price
    }));

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('phone', orderForm.customer.phone)
      .maybeSingle();

    if (!existingCustomer) {
      await supabase.from('customers').insert({
        restaurant_id: restaurant.id,
        name: orderForm.customer.name,
        phone: orderForm.customer.phone,
        email: orderForm.customer.email || null,
        address: orderForm.customer.address || null,
        delivery_instructions: orderForm.customer.delivery_instructions || null
      });
    }

    const newOrder = {
      restaurant_id: restaurant.id,
      order_number: await generateOrderNumber(),
      status: 'pending',
      order_type: orderForm.order_type,
      customer_name: orderForm.customer.name,
      customer_phone: orderForm.customer.phone,
      customer_email: orderForm.customer.email || null,
      customer_address: orderForm.customer.address || null,
      items: itemsToStore,
      subtotal,
      delivery_cost: deliveryCost,
      total,
      total_amount: total,
      delivery_address: orderForm.delivery_address || null,
      table_number: orderForm.table_number || null,
      special_instructions: orderForm.special_instructions || '',
      whatsapp_sent: false
    };

    const { error } = await supabase.from('orders').insert([newOrder]);

    if (error) {
      console.error('Error creating order:', error);
      showToast('error', t('errorTitle'), 'No se pudo crear el pedido', 4000);
      return;
    }

    setShowCreateOrderModal(false);
    resetOrderForm();
    showToast('success', t('orderCreatedTitle'), t('orderCreateSuccess'), 4000);

    // OPTIMIZED: Only reload the orders list, not the stats
    await loadOrdersPage();
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder || !restaurant) return;

    if (!orderForm.customer.name.trim() || !orderForm.customer.phone.trim()) {
      showToast('error', t('errorTitle'), t('namePhoneRequiredError'), 4000);
      return;
    }
    if (orderItems.length === 0) {
      showToast('error', t('errorTitle'), 'Debes agregar al menos un producto al pedido', 4000);
      return;
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const deliveryCost =
      orderForm.order_type === 'delivery' ? restaurant?.settings?.delivery?.zones?.[0]?.cost || 0 : 0;
    const total = subtotal + deliveryCost;

    const itemsToStore = orderItems.map((it: any) => ({
      ...it,
      product_name: it.product?.name,
      variation_name: it.variation?.name,
      variation_id: it.variation?.id,
      unit_price: it.unit_price,
      quantity: it.quantity,
      total_price: it.total_price
    }));

    // Crear cliente si no existe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('phone', orderForm.customer.phone)
      .maybeSingle();

    if (!existingCustomer) {
      await supabase.from('customers').insert({
        restaurant_id: restaurant.id,
        name: orderForm.customer.name,
        phone: orderForm.customer.phone,
        email: orderForm.customer.email || null,
        address: orderForm.customer.address || null,
        delivery_instructions: orderForm.customer.delivery_instructions || null
      });
    }

    const payload = {
      customer_name: orderForm.customer.name,
      customer_phone: orderForm.customer.phone,
      customer_email: orderForm.customer.email || null,
      customer_address: orderForm.customer.address || null,
      items: itemsToStore,
      order_type: orderForm.order_type,
      status: orderForm.status,
      delivery_address: orderForm.delivery_address || null,
      table_number: orderForm.table_number || null,
      delivery_cost: deliveryCost,
      subtotal,
      total,
      total_amount: total,
      special_instructions: orderForm.special_instructions || '',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('orders').update(payload).eq('id', editingOrder.id);

    if (error) {
      console.error('Error updating order:', error);
      showToast('error', t('errorTitle'), 'No se pudo actualizar el pedido', 4000);
      return;
    }

    setShowEditOrderModal(false);
    setEditingOrder(null);
    resetOrderForm();

    showToast('success', t('orderUpdatedTitle'), t('orderUpdateSuccess'), 4000);

    // OPTIMIZED: Only reload the orders list, not the stats
    // Stats will refresh automatically on next page load or status change
    await loadOrdersPage();
  };

  // =============================
  // UI
  // =============================
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('orderManagement')}</h1>

        <div className="flex flex-wrap justify-start md:justify-end items-center gap-2 w-full md:w-auto">
          <Button icon={Plus} onClick={() => setShowCreateOrderModal(true)}>
            {t('createOrder')}
          </Button>

          {selectedOrders.length > 0 && (
            <Button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md hover:opacity-90 transition"
            >
              {t('bulkActions')} ({selectedOrders.length})
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={Filter}
            className="bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            {t('filtersTitle')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-900 mb-1">{t('ordersToday')}</p>
              <p className="text-3xl font-bold text-blue-900">{orderStats.todayOrders}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-blue-200">
            <span className="text-xs text-blue-700 font-medium">{t('dailySales')}</span>
            <span className="text-sm font-bold text-green-700">{formatCurrency(orderStats.todayRevenue, currency)}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-md border border-amber-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-amber-600 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-amber-900 mb-1">{t('inProcess')}</p>
              <p className="text-3xl font-bold text-amber-900">
                {orderStats.pending + orderStats.confirmed + orderStats.preparing + orderStats.ready}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-amber-200">
            <span className="text-xs text-amber-700 font-medium">{t('pendingPlural')}</span>
            <span className="text-sm font-bold text-amber-800">{orderStats.pending}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-900 mb-1">{t('averageValue')}</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(orderStats.averageOrderValue, currency)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-green-200">
            <span className="text-xs text-green-700 font-medium">{t('deliveredPlural')}</span>
            <span className="text-sm font-bold text-green-800">{orderStats.delivered}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border border-purple-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-purple-900 mb-1">{t('completionRate')}</p>
              <p className="text-3xl font-bold text-purple-900">{orderStats.completionRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-purple-200">
            <span className="text-xs text-purple-700 font-medium">{t('totalOrders')}</span>
            <span className="text-sm font-bold text-purple-800">{orderStats.total}</span>
          </div>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="relative w-full max-w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {showBulkActions && (
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow border w-full md:w-auto">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('bulkActionLabel')}:</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm flex-shrink-0"
            >
              <option value="">{t('selectActionPlaceholder')}</option>
              <option value="confirmed">{t('markAsConfirmed')}</option>
              <option value="preparing">{t('markAsPreparing')}</option>
              <option value="ready">{t('markAsReady')}</option>
              <option value="delivered">{t('markAsDelivered')}</option>
              <option value="cancelled">{t('cancel')}</option>
            </select>
            <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction}>
              {t('apply')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedOrders([]);
                setShowBulkActions(false);
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('allStatuses')}</option>
                <option value="pending">{t('pendingPlural')}</option>
                <option value="confirmed">{t('confirmedPlural')}</option>
                <option value="preparing">{t('preparingPlural')}</option>
                <option value="ready">{t('readyPlural')}</option>
                <option value="delivered">{t('deliveredPlural')}</option>
                <option value="cancelled">{t('cancelledPlural')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('orderType')}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('allTypes')}</option>
                <option value="pickup">{t('pickup')}</option>
                <option value="delivery">{t('deliveryOrderType')}</option>
                <option value="dine-in">{t('tableOrderType')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('allDates')}</option>
                <option value="today">{t('today')}</option>
                <option value="yesterday">{t('yesterday')}</option>
                <option value="week">{t('lastWeek')}</option>
                <option value="month">{t('lastMonth')}</option>
                <option value="custom">{t('customRange')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('sortByLabel')}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'total')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">{t('date')}</option>
                <option value="status">{t('status')}</option>
                <option value="total">{t('total')}</option>
              </select>
            </div>

            {dateFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('startDate')}</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('endDate')}</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Order List */}
      {loadingOrders ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">{t('loading')}...</div>
      ) : orders.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noOrdersFound')}</h3>
          <p className="text-gray-600">{t('adjustFiltersMessage')}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={selectAllOrders}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orderNumberLabel')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('customerLabel')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orderType')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('total')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.order_number}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getOrderTypeBadge(order.order_type, order.table_number)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.total, currency)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleViewOrder(order.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title={t('view')}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => handleEditOrderById(order.id)}
                            className="text-amber-600 hover:text-amber-900"
                            title={t('edit')}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                            title={t('delete')}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={MessageSquare}
                            onClick={() => sendWhatsAppMessageById(order.id)}
                            className="text-green-600 hover:text-green-700"
                            title={t('sendByWhatsappTitle')}
                          />

                          {getNextStatus(order.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickStatusUpdate(order.id, getNextStatus(order.status)!)}
                              className="text-blue-600 hover:text-blue-700 text-xs px-2"
                              title={`${t('changeToTitle')} ${getNextStatusLabel(order.status)}`}
                            >
                              {getNextStatusLabel(order.status)}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('next')}
                </Button>
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t('showing')}{' '}
                    <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>{' '}
                    {t('to')}{' '}
                    <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)}</span>{' '}
                    {t('of')}{' '}
                    <span className="font-medium">{totalOrders}</span>{' '}
                    {t('results')}
                  </p>
                </div>

                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-l-md"
                    >
                      {t('previous')}
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`z-10 ${
                            currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-r-md"
                    >
                      {t('next')}
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedOrder ? `${t('orderLabel')} ${selectedOrder.order_number}` : t('orderLabel')}
        size="lg"
      >
        {loadingOrderDetail ? (
          <div className="p-6 text-sm text-gray-600">Cargando pedido...</div>
        ) : selectedOrder ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{t('orderInfoTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('orderType')}</p>
                  <div className="mt-1">{getOrderTypeBadge(selectedOrder.order_type, selectedOrder.table_number)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('status')}</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('date')}</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">{t('customerInfoTitle')}</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>{t('name')}:</strong> {selectedOrder.customer.name}</p>
                <p><strong>{t('phone')}:</strong> {selectedOrder.customer.phone}</p>
                {selectedOrder.customer.email && <p><strong>{t('email')}:</strong> {selectedOrder.customer.email}</p>}
                {selectedOrder.order_type === 'delivery' && (
                  <>
                    <p><strong>{t('address')}:</strong> {selectedOrder.delivery_address}</p>
                    {selectedOrder.customer.delivery_instructions && (
                      <p><strong>{t('deliveryReferencesLabel')}:</strong> {selectedOrder.customer.delivery_instructions}</p>
                    )}
                  </>
                )}
                {selectedOrder.order_type === 'dine-in' && selectedOrder.table_number && (
                  <p><strong>{t('tableNumberLabel')}:</strong> {selectedOrder.table_number}</p>
                )}
              </div>
            </div>

            {/* FIX #3: ahora items se muestran bien */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">{t('productsSectionTitle')}</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product?.name || 'Producto'}</h4>
                      <p className="text-sm text-gray-600">{item.variation?.name || 'Variación'}</p>

                      {item.selected_ingredients && item.selected_ingredients.length > 0 && (
                        <div className="text-sm text-blue-600 mt-1">
                          {item.selected_ingredients
                            .filter((ing: any) => ing.optional === true)
                            .map((ing: any, idx: number) => (
                              <div key={idx}>
                                + {typeof ing === 'object' ? ing.name : ing}
                                {ing.extra_cost > 0 && ` (+${formatCurrency(ing.extra_cost, currency)})`}
                              </div>
                            ))}
                        </div>
                      )}

                      {item.special_notes && (
                        <p className="text-sm text-blue-600 mt-1">
                          <em>{t('noteLabel')}: {item.special_notes}</em>
                        </p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <p className="font-medium">
                        {item.quantity} x {formatCurrency(item.unit_price || item.variation?.price || 0, currency)}
                      </p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.total_price || 0, currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
<div className="space-y-2">
  <div className="flex justify-between">
    <span>{t('subtotalLabel')}:</span>
    <span>{formatCurrency(selectedOrder.subtotal, currency)}</span>
  </div>

  {selectedOrder.delivery_cost != null && (
    <div className="flex justify-between">
      <span>{t('deliveryLabel')}:</span>
      <span>
      {selectedOrder.delivery_cost > 0
        ? formatCurrency(selectedOrder.delivery_cost, currency)
        : formatCurrency(0, currency)}
      </span>
    </div>
  )}

  <div className="flex justify-between font-bold text-lg border-t pt-2">
    <span>{t('total')}:</span>
    <span>{formatCurrency(selectedOrder.total, currency)}</span>
  </div>
</div>
            </div>

            {selectedOrder.special_instructions && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{t('specialInstructionsTitle')}</h3>
                <p className="text-gray-800">{selectedOrder.special_instructions}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  printTicket(selectedOrder); // ✅ mantiene diseño
                }}
                icon={Printer}
              >
                {t('printTicket')}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  handleEditOrderById(selectedOrder.id);
                }}
                icon={Edit}
              >
                {t('edit')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-600">No se pudo cargar el pedido.</div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateOrderModal}
        onClose={() => {
          setShowCreateOrderModal(false);
          resetOrderForm();
        }}
        title={t('createOrder')}
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-4">{t('customerInfoTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('nameRequiredLabel')}
                value={orderForm.customer.name}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
                placeholder={t('customerNamePlaceholder')}
              />
              <Input
                label={t('phoneRequiredLabel')}
                value={orderForm.customer.phone}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))}
                placeholder={t('customerPhonePlaceholder')}
              />
              <Input
                label={t('email')}
                value={orderForm.customer.email}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
                placeholder={t('customerEmailPlaceholder')}
              />
              <Input
                label={t('address')}
                value={orderForm.customer.address}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))}
                placeholder={t('customerAddressPlaceholder')}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">{t('orderTypeTitle')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={orderForm.order_type === 'pickup'}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, order_type: e.target.value as any }))}
                  className="mr-2"
                />
                <span>{t('pickup')}</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="orderType"
                  value="delivery"
                  checked={orderForm.order_type === 'delivery'}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, order_type: e.target.value as any }))}
                  className="mr-2"
                />
                <span>{t('deliveryOrderType')}</span>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="orderType"
                  value="dine-in"
                  checked={orderForm.order_type === 'dine-in'}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, order_type: e.target.value as any }))}
                  className="mr-2"
                />
                <span>{t('tableOrderType')}</span>
              </label>
            </div>
          </div>

          {orderForm.order_type === 'delivery' && (
            <div className="space-y-4">
              <Input
                label={t('deliveryAddressLabel')}
                value={orderForm.delivery_address}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, delivery_address: e.target.value }))}
                placeholder={t('deliveryAddressPlaceholder')}
              />
              <Input
                label={t('deliveryReferencesLabel')}
                value={orderForm.customer.delivery_instructions}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, delivery_instructions: e.target.value } }))}
                placeholder={t('deliveryReferencesPlaceholder')}
              />
            </div>
          )}

          {orderForm.order_type === 'dine-in' && (
            <Input
              label={t('tableNumberLabel')}
              value={orderForm.table_number}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, table_number: e.target.value }))}
              placeholder={t('tableNumberPlaceholder')}
            />
          )}

          <OrderProductSelector
            products={products}
            orderItems={orderItems}
            onAddItem={addItemToOrder}
            onRemoveItem={removeItemFromOrder}
            onUpdateQuantity={updateItemQuantity}
            onShowToast={showToast}
            currency={currency}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('specialInstructionsLabel')}</label>
            <textarea
              value={orderForm.special_instructions}
              onChange={(e) => setOrderForm((prev) => ({ ...prev, special_instructions: e.target.value }))}
              placeholder={t('specialInstructionsPlaceholder')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateOrderModal(false);
                resetOrderForm();
              }}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateOrder} className="flex-1">
              {t('saveOrder')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={`${t('delete')} ${t('orderLabel')}`}
        size="sm"
      >
        {orderToDelete && (
          <div>
            <p className="text-gray-700 mb-4">
              {t('confirmDeleteOrder')} <strong>{orderToDelete.order_number}</strong>?
            </p>
            <p className="text-sm text-red-600 font-medium">{t('irreversibleAction')}</p>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrderToDelete(null);
                }}
              >
                {t('cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDeleteOrder} icon={Trash2}>
                {t('deleteOrder')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditOrderModal}
        onClose={() => {
          setShowEditOrderModal(false);
          setEditingOrder(null);
          resetOrderForm();
        }}
        title={editingOrder ? `${t('edit')} ${t('orderLabel')} ${editingOrder.order_number}` : t('edit')}
        size="lg"
      >
        {loadingOrderDetail ? (
          <div className="p-6 text-sm text-gray-600">Cargando pedido...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">{t('customerInfoTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('nameRequiredLabel')}
                  value={orderForm.customer.name}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
                  placeholder={t('customerNamePlaceholder')}
                />
                <Input
                  label={t('phoneRequiredLabel')}
                  value={orderForm.customer.phone}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))}
                  placeholder={t('customerPhonePlaceholder')}
                />
                <Input
                  label={t('email')}
                  value={orderForm.customer.email}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
                  placeholder={t('customerEmailPlaceholder')}
                />
                <Input
                  label={t('address')}
                  value={orderForm.customer.address}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))}
                  placeholder={t('customerAddressPlaceholder')}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-4">{t('orderTypeTitle')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="orderTypeEdit"
                    value="pickup"
                    checked={orderForm.order_type === 'pickup'}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, order_type: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span>{t('pickup')}</span>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="orderTypeEdit"
                    value="delivery"
                    checked={orderForm.order_type === 'delivery'}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, order_type: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span>{t('deliveryOrderType')}</span>
                </label>

                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="orderTypeEdit"
                    value="dine-in"
                    checked={orderForm.order_type === 'dine-in'}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, order_type: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span>{t('tableOrderType')}</span>
                </label>
              </div>
            </div>

            {orderForm.order_type === 'delivery' && (
              <div className="space-y-4">
                <Input
                  label={t('deliveryAddressLabel')}
                  value={orderForm.delivery_address}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, delivery_address: e.target.value }))}
                  placeholder={t('deliveryAddressPlaceholder')}
                />
                <Input
                  label={t('deliveryReferencesLabel')}
                  value={orderForm.customer.delivery_instructions}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, customer: { ...prev.customer, delivery_instructions: e.target.value } }))}
                  placeholder={t('deliveryReferencesPlaceholder')}
                />
              </div>
            )}

            {orderForm.order_type === 'dine-in' && (
              <Input
                label={t('tableNumberLabel')}
                value={orderForm.table_number}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, table_number: e.target.value }))}
                placeholder={t('tableNumberPlaceholder')}
              />
            )}

            {/* FIX #4: ahora OrderProductSelector recibe items con product completo */}
            <OrderProductSelector
              products={products}
              orderItems={orderItems}
              onAddItem={addItemToOrder}
              onRemoveItem={removeItemFromOrder}
              onUpdateQuantity={updateItemQuantity}
              onShowToast={showToast}
              currency={currency}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('status')}</label>
              <select
                value={orderForm.status}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">{t('pending')}</option>
                <option value="confirmed">{t('confirmed')}</option>
                <option value="preparing">{t('preparing')}</option>
                <option value="ready">{t('ready')}</option>
                <option value="delivered">{t('delivered')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('specialInstructionsLabel')}</label>
              <textarea
                value={orderForm.special_instructions}
                onChange={(e) => setOrderForm((prev) => ({ ...prev, special_instructions: e.target.value }))}
                placeholder={t('specialInstructionsPlaceholder')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditOrderModal(false);
                  setEditingOrder(null);
                  resetOrderForm();
                }}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleUpdateOrder} className="flex-1">
                {t('updateOrder')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
