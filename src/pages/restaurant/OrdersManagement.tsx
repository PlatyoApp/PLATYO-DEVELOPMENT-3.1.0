import React, { useState, useEffect } from 'react';
import { Eye, Pencil as Edit, Trash2, Clock, Phone, MapPin, User, Filter, Search, CheckCircle, XCircle, AlertCircle, Package, Plus, MessageSquare, Printer, DollarSign, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
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
import { formatCurrency, getCurrencySymbol } from '../../utils/currencyUtils';

export const OrdersManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const currency = restaurant?.settings?.currency || 'USD';
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState({
    customer: { name: '', phone: '+57 ', email: '', address: '', delivery_instructions: '' },
    order_type: 'pickup' as Order['order_type'],
    status: 'pending' as Order['status'],
    delivery_address: '',
    table_number: '',
    special_instructions: '',
  });
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
  const [filter, setFilter] = useState('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<Order['items']>([]);

  useEffect(() => {
    if (restaurant) {
      loadOrders();
      loadProductsAndCategories();
    }
  }, [restaurant]);

  useEffect(() => {
    calculateStats();
  }, [orders]);

  const loadOrders = async () => {
    if (!restaurant?.id) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
      showToast('error', 'Error', 'No se pudieron cargar las órdenes');
      return;
    }

    const mappedOrders = (data || []).map((order: any) => {
      const items = order.items || [];
      const mappedItems = items.map((item: any, index: number) => ({
        id: item.id || `${order.id}-${index}`,
        product_id: item.product_id,
        product: {
          id: item.product_id,
          name: item.product_name || 'Producto'
        },
        variation: {
          id: item.variation_id,
          name: item.variation_name || 'Variación',
          price: item.unit_price || 0
        },
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        price: item.unit_price || 0,
        total_price: item.total_price || (item.unit_price * item.quantity) || 0,
        special_notes: item.special_notes || '',
        selected_ingredients: item.selected_ingredients || []
      }));

      return {
        ...order,
        items: mappedItems,
        total: order.total || order.total_amount || 0,
        subtotal: order.subtotal || 0,
        delivery_cost: order.delivery_cost || 0,
        customer: {
          name: order.customer_name || '',
          phone: order.customer_phone || '',
          email: order.customer_email || '',
          address: order.customer_address || '',
          delivery_instructions: '',
        }
      };
    });

    setOrders(mappedOrders);
  };

  const loadProductsAndCategories = async () => {
    if (!restaurant?.id) return;

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true);

    setCategories(categoriesData || []);
    setProducts(productsData || []);
  };

  const calculateStats = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order =>
      new Date(order.created_at).toDateString() === today
    );
    const completedOrders = orders.filter(order => order.status === 'delivered');
    const todayRevenue = todayOrders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || order.total_amount || 0), 0);
    const averageOrderValue = completedOrders.length > 0
      ?
      completedOrders.reduce((sum, order) => sum + (order.total || order.total_amount || 0), 0) / completedOrders.length
      : 0;
    const completionRate = orders.length > 0
      ?
      (completedOrders.length / orders.length) * 100
      : 0;
    setOrderStats({
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      todayRevenue,
      todayOrders: todayOrders.length,
      averageOrderValue,
      completionRate
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();

      const statusMessages = {
        confirmed: t('orderConfirmedMsg'),
        preparing: t('orderInPreparationMsg'),
        ready: t('orderReadyForDeliveryMsg'),
        delivered: t('orderDeliveredMsg'),
        cancelled: t('orderCancelledMsg')
      };
      showToast(
        'success',
        t('statusUpdatedTitle'),
        statusMessages[newStatus] || t('orderStatusUpdated'),
        3000
      );
    } catch (error: any) {
      console.error('Error updating order status:', error);
      showToast('error', 'Error', 'No se pudo actualizar el estado de la orden');
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const statusFlow: Record<Order['status'], Order['status'] | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivered',
      delivered: null,
      cancelled: null,
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
      cancelled: t('cancelled'),
    };
    return labels[nextStatus];
  };

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

    await loadOrders();
    
    showToast(
      'success',
      t('statusUpdatedTitle'),
      t('orderStatusMarkedSuccess'),
      3000
    );
  };

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
  const getOrderTypeBadge = (orderType: string, tableNumber?: string) => {
    switch (orderType) {
      case 'delivery':
        return <Badge variant="info">{t('deliveryOrderType')}</Badge>;
      case 'pickup':
        return <Badge variant="gray">{t('pickup')}</Badge>;
      case 'dine-in':
        return <Badge variant="warning">{t('tableOrderType')} {tableNumber}</Badge>;
      default:
        return <Badge variant="gray">{orderType}</Badge>;
    }
  };
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.phone || '').includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.order_type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at);
    
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          matchesDate = 
          orderDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = orderDate >= monthAgo;
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = orderDate >= start && orderDate <= end;
          }
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'total':
        comparison = a.total - b.total;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

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

    await loadOrders();
    setSelectedOrders([]);
    setBulkAction('');
    setShowBulkActions(false);
    
    showToast(
      'success',
      t('bulkActionCompleteTitle'),
      `${selectedOrders.length} ${t('ordersUpdatedCount')}`,
      3000
    );
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
  };
  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const printContent = `
      <html>
        <head>
          <title>${t('orderLabel')} ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif;
              margin: 20px; }
            .header { text-align: center; margin-bottom: 20px;
            }
            .order-info { margin-bottom: 20px;
            }
            .items { margin-bottom: 20px;
            }
            .total { font-weight: bold; font-size: 18px;
            }
            table { width: 100%; border-collapse: collapse;
            }
            th, td { padding: 8px; text-align: left;
              border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restaurant?.name}</h1>
            <h2>${t('orderNumberLabel')}${order.order_number}</h2>
          </div>
          
          <div class="order-info">
            <p><strong>${t('customerLabel')}:</strong> ${order.customer.name}</p>
            <p><strong>${t('phone_label')}:</strong> ${order.customer.phone}</p>
            <p><strong>${t('orderType')}:</strong> ${order.order_type}</p>
            ${order.delivery_address ?
            `<p><strong>${t('addressLabel')}:</strong> ${order.delivery_address}</p>` : ''}
            ${order.table_number ?
            `<p><strong>${t('tableLabel')}:</strong> ${order.table_number}</p>` : ''}
            <p><strong>${t('dateLabel')}:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          </div>
          
          <div class="items">
            <h3>${t('productsSectionTitle')}:</h3>
            <table>
              <thead>
                <tr>
                  <th>${t('productHeader')}</th>
                  <th>${t('variationLabel')}</th>
                  <th>${t('quantityHeader')}</th>
                  <th>${t('priceHeader')}</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.variation.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.variation.price * item.quantity, currency)}</td>
                  </tr>
                  ${item.special_notes ? `<tr><td colspan="4"><em>${t('noteLabel')}: ${item.special_notes}</em></td></tr>` : ''}
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <p>${t('subtotalLabel')}: ${formatCurrency(order.subtotal, currency)}</p>
            ${order.delivery_cost ?
            `<p>${t('deliveryLabel')}: ${formatCurrency(order.delivery_cost, currency)}</p>` : ''}
            <p>${t('totalLabel')}: ${formatCurrency(order.total, currency)}</p>
          </div>
          
          ${order.special_instructions ?
          `<p><strong>${t('specialInstructionsTitle')}:</strong> ${order.special_instructions}</p>` : ''}
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateOrderNumber = async () => {
    if (!restaurant) return '#RES-1001';

    // Query all orders from the restaurant to ensure consistent numbering
    const { data: allOrders } = await supabase
      .from('orders')
      .select('order_number')
      .eq('restaurant_id', restaurant.id);

    let maxNumber = 1000;
    if (allOrders && allOrders.length > 0) {
      allOrders.forEach((order) => {
        // Extract number from formats #RES-XXXX or RES-XXXX for backwards compatibility
        if (order.order_number && typeof order.order_number === 'string') {
          const match = order.order_number.match(/#?RES-(\d+)/);
          if (match) {
            const orderNum = parseInt(match[1]);
            if (!isNaN(orderNum) && orderNum > maxNumber) {
              maxNumber = orderNum;
            }
          }
        }
      });
    }

    // Return next consecutive number
    return `#RES-${maxNumber + 1}`;
  };
  const generateWhatsAppMessage = (order: Order) => {
    const restaurantName = restaurant?.name || t('restaurantDefaultName');
    const orderNumber = order.order_number;
    const orderDate = new Date(order.created_at).toLocaleString();
    
    let message = `*${t('newOrderTitle')} - ${restaurantName}*\n`;
    message += `*${t('dateLabel')}:* ${orderDate}\n`;
    message += `*${t('orderNumberLabel')}:* ${orderNumber}\n\n`;
    
    message += `*${t('customerSectionTitle')}:*\n`;
    message += `- *${t('nameLabel')}:* ${order.customer.name}\n`;
    message += `- *${t('phone_label')}:* ${order.customer.phone}\n`;
    if (order.customer.email) {
      message += `- *${t('emailLabel')}:* ${order.customer.email}\n`;
    }
    message += `\n`;
    
    message += `*${t('orderTypeTitle')}:* ${order.order_type === 'delivery' ? t('deliveryOrderType') : order.order_type === 'dine-in' ? t('tableOrderType') : t('pickupAtRestaurant')}\n`;
    if (order.order_type === 'delivery' && order.delivery_address) {
      message += `*${t('addressLabel')}:* ${order.delivery_address}\n`;
      if (order.customer.delivery_instructions) {
        message += `*${t('deliveryReferencesLabel')}:* ${order.customer.delivery_instructions}\n`;
      }
    } else if (order.order_type === 'dine-in' && order.table_number) {
      message += `*${t('tableLabel')}:* ${order.table_number}\n`;
    }
    message += `\n`;
    
    message += `*${t('productsSectionTitle')}:*\n`;
    order.items.forEach((item, index) => {
      const itemTotal = formatCurrency(item.total_price || (item.unit_price * item.quantity), currency);
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   - *${t('variationLabel')}:* ${item.variation.name}\n`;
      message += `   - *${t('quantityLabel')}:* ${item.quantity}\n`;
      message += `   - *${t('priceLabel')}:* ${itemTotal}\n`;
      if (item.special_notes) {
        message += `   - *${t('noteLabel')}:* ${item.special_notes}\n`;
      }

      message += `\n`;
    });
    
    message += `*${t('orderSummaryTitle')}:*\n`;
    message += `- *${t('subtotalLabel')}:* ${formatCurrency(order.subtotal, currency)}\n`;
    if (order.delivery_cost && order.delivery_cost > 0) {
      message += `- *${t('deliveryLabel')}:* ${formatCurrency(order.delivery_cost, currency)}\n`;
    }
    message += `- *${t('totalLabel')}:* ${formatCurrency(order.total, currency)}\n\n`;
    
    message += `*${t('estimatedTimeLabel')}:* ${restaurant?.settings?.preparation_time || t('defaultPreparationTime')}\n\n`;
    message += `*${t('thankYouForOrder')}*`;

    return encodeURIComponent(message);
  };

  const generateStatusUpdateMessage = (order: Order): string => {
    const restaurantName = restaurant?.name ||
    t('restaurantDefaultName');
    const orderNumber = order.order_number;

    const statusMessages: { [key in Order['status']]: string } = {
      'pending': t('statusPendingMessage'),
      'confirmed': t('statusConfirmedMessage'),
      'preparing': t('statusPreparingMessage'),
      'ready': t('statusReadyMessage'),
      'delivered': t('statusDeliveredMessage'),
      'cancelled': t('statusCancelledMessage')
    };
    let message = `*${t('orderUpdateTitle')} - ${restaurantName}*\n\n`;
    message += `*${t('orderNumberLabel')}:* ${orderNumber}\n`;
    message += `*${t('status')}:* ${t('yourOrder')} ${statusMessages[order.status]}\n\n`;

    if (order.status === 'ready') {
      if (order.order_type === 'pickup') {
        message += `${t('readyForPickup')}
        ${t('weAreWaitingForYou')}\n\n`;
      } else if (order.order_type === 'delivery') {
        message += `${t('readyForDelivery')}\n\n`;
      }
    } else if (order.status === 'preparing') {
      message += `${t('preparingWithCare')}\n`;
      message += `*${t('estimatedTimeLabel')}:* ${order.estimated_time || t('defaultPreparationTime')}\n\n`;
    }

    message += `*${t('thankYouForPreference')}*`;

    return encodeURIComponent(message);
  };

  const sendWhatsAppMessage = async (order: Order) => {
    if (!order.customer?.phone || order.customer.phone.trim() === '') {
      showToast('error', t('errorTitle'), t('noPhoneError'), 4000);
      return;
    }

    const whatsappNumber = order.customer.phone.replace(/[^\d]/g, '');
    if (!whatsappNumber || whatsappNumber.length < 10) {
      showToast('error', t('errorTitle'), t('invalidPhoneError'), 4000);
      return;
    }

    let whatsappMessage: string;

    if (!order.whatsapp_sent) {
      whatsappMessage = generateWhatsAppMessage(order);

      const { error } = await supabase
        .from('orders')
        .update({ whatsapp_sent: true })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating whatsapp_sent:', error);
      }

      await loadOrders();
    } else {
      whatsappMessage = generateStatusUpdateMessage(order);
    }

    try {
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        showToast('warning', t('warningTitle'), t('popupWarning'), 5000);
      } else {
        showToast('success', t('successTitle'), t('openingWhatsapp'), 2000);
      }
    } catch (error) {
      showToast('error', t('errorTitle'), t('whatsappOpenError'), 4000);
    }
  };

  const printTicket = (order: Order) => {
    if (!restaurant) return;

    const billing = restaurant.settings?.billing;
    const subtotal = order.subtotal;
    const iva = billing?.responsableIVA ? subtotal * 0.19 : 0;
    const ipc = billing?.aplicaIPC ? subtotal * ((billing?.porcentajeIPC || 8) / 100) : 0;
    const propina = billing?.aplicaPropina ?
    subtotal * 0.10 : 0;
    const total = order.total;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
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
            ${billing?.mostrarLogoEnTicket && billing?.logoTicket ?
            `
              <img src="${billing.logoTicket}" alt="Logo" class="logo">
            ` : ''}

            <div class="restaurant-name">${billing?.nombreComercial ||
            restaurant.name}</div>
            ${billing?.razonSocial ?
            `<div class="info-line">${billing.razonSocial}</div>` : ''}
            ${billing?.nit ?
            `<div class="info-line">NIT: ${billing.nit}</div>` : ''}
            ${billing?.direccion ?
            `<div class="info-line">${billing.direccion}</div>` : ''}
            ${billing?.ciudad && billing?.departamento ?
            `<div class="info-line">${billing.ciudad}, ${billing.departamento}</div>` : billing?.ciudad ? `<div class="info-line">${billing.ciudad}</div>` : ''}
            ${billing?.telefono ?
            `<div class="info-line">${t('phone_label')}: ${billing.telefono}</div>` : ''}
            ${billing?.correo ?
            `<div class="info-line">${t('emailLabel')}: ${billing.correo}</div>` : ''}

            ${billing?.tieneResolucionDIAN && billing?.numeroResolucionDIAN ?
            `
              <div class="dian-info">
                ${t('dianResolutionNumber')} ${billing.numeroResolucionDIAN}<br>
                ${t('dateLabel')}: ${billing.fechaResolucion ?
                new Date(billing.fechaResolucion).toLocaleDateString('es-CO') : ''}<br>
                ${t('rangeLabel')}: ${billing.rangoNumeracionDesde ||
                ''} - ${billing.rangoNumeracionHasta || ''}
              </div>
            ` : ''}

            ${billing?.regimenTributario ?
            `
              <div class="info-line">
                ${billing.regimenTributario === 'simple' ?
                t('taxRegimeSimple') :
                  billing.regimenTributario === 'comun' ?
                t('taxRegimeCommon') :
                t('taxRegimeNoIva')}
              </div>
            ` : ''}
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
                order.order_type === 'delivery' ?
                t('deliveryOrderType') :
                order.order_type === 'pickup' ?
                t('pickupOrderType') :
                `${t('tableOrderType')} ${order.table_number ||
                ''}`
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
            ${order.delivery_address ?
            `
              <div class="order-info-line">
                <span><strong>${t('addressLabel')}:</strong></span>
                <span>${order.delivery_address}</span>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">${t('productsSectionTitle')}</div>
            <div class="items-table">
              ${order.items.map(item => {
                const unitPrice = item.total_price / item.quantity;
                return `
                <div class="item-row">
                  <div class="item-name">
                    ${item.product.name}<br>
                    <small style="font-size: 9px; color: #666;">${item.variation.name}</small>
                    ${item.selected_ingredients && item.selected_ingredients.length > 0 ? `<br><small style="font-size: 9px; color: #0066cc;">+ ${item.selected_ingredients.map(ing => typeof ing === 'object' ? ing.name : ing).join(', ')}</small>` : ''}
                    ${item.special_notes ? `<br><small style="font-size: 9px; color: #666;">${t('noteLabel')}: ${item.special_notes}</small>` : ''}
                  </div>
                  <div class="item-qty">${item.quantity}</div>
                  <div class="item-price">${formatCurrency(unitPrice, currency)}</div>
                  <div class="item-total">${formatCurrency(item.total_price, currency)}</div>
                </div>
              `;
              }).join('')}
            </div>
          </div>

          <div class="totals">
            <div class="total-row">
              <span>${t('subtotalLabel')}:</span> <span>${formatCurrency(subtotal, currency)}</span>
            </div>
            ${order.delivery_cost && order.delivery_cost > 0 ?
            `
              <div class="total-row">
                <span>${t('deliveryLabel')}:</span> <span>${formatCurrency(order.delivery_cost, currency)}</span>
              </div>
            ` : ''}
            ${billing?.responsableIVA ?
            `
              <div class="total-row">
                <span>${t('ivaLabel')}:</span> <span>${formatCurrency(iva, currency)}</span>
              </div>
            ` : ''}
            ${billing?.aplicaIPC ?
            `
              <div class="total-row">
                <span>IPC (${billing?.porcentajeIPC || 8}%):</span> <span>${formatCurrency(ipc, currency)}</span>
              </div>
            ` : ''}
            ${billing?.aplicaPropina ?
            `
              <div class="total-row">
                <span>${t('suggestedTipLabel')}:</span> <span>${formatCurrency(propina, currency)}</span>
              </div>
            ` : ''}
            <div class="total-row final">
              <span>${t('totalLabel')}:</span> <span>${formatCurrency(total, currency)}</span>
            </div>
            ${billing?.aplicaPropina ?
            `
              <div class="total-row" style="font-size: 10px; color: #666; margin-top: 3px;">
                <span>${t('totalWithTipLabel')}:</span> <span>${formatCurrency(total + propina, currency)}</span>
              </div>
            ` : ''}
          </div>

          ${billing?.mensajeFinalTicket ?
          `
            <div class="message">
              ${billing.mensajeFinalTicket}
            </div>
          ` : ''}
          <div class="footer">
            <div>${t('thankYouForPurchase')}</div>
            <div style="margin-top: 5px;">${new Date().toLocaleString('es-CO')}</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 250); };
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setOrderForm({
      customer: order.customer,
      order_type: order.order_type,
      status: order.status,
      delivery_address: order.delivery_address || '',
      table_number: order.table_number || '',
      special_instructions: order.special_instructions || '',
    });
    setOrderItems(order.items || []);
    setShowEditOrderModal(true);
  };
  const resetOrderForm = () => {
    setOrderForm({
      customer: { name: '', phone: '+57 ', email: '', address: '', delivery_instructions: '' },
      order_type: 'pickup',
      status: 'pending',
      delivery_address: '',
      table_number: '',
      special_instructions: '',
    });
    setOrderItems([]);
  };

  const addItemToOrder = (product: Product, variationId: string, quantity: number, ingredientIds?: string[], specialNotes?: string) => {
    const variation = product.variations.find(v => v.id === variationId);
    if (!variation) return;

    // Get selected ingredients
    const selectedIngredients = ingredientIds
      ? product.ingredients?.filter(ing => ingredientIds.includes(ing.id)) || []
      : [];

    // Calculate extra cost from ingredients
    const ingredientsExtraCost = selectedIngredients.reduce((sum, ing) => sum + (ing.extra_cost || 0), 0);
    const totalPrice = (variation.price + ingredientsExtraCost) * quantity;

    const newItem = {
      id: `${Date.now()}-${Math.random()}`,
      product_id: product.id,
      product: product,
      variation: { id: variation.id, name: variation.name, price: variation.price },
      quantity,
      unit_price: variation.price + ingredientsExtraCost,
      total_price: totalPrice,
      selected_ingredients: selectedIngredients,
      special_notes: specialNotes || '',
    };
    setOrderItems(prev => [...prev, newItem]);
  };

  const removeItemFromOrder = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItemFromOrder(itemId);
      return;
    }
    setOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newTotal = item.unit_price * quantity;
        return { ...item, quantity, total_price: newTotal };
      }
      return item;
    }));
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
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

    await loadOrders();
    setShowDeleteModal(false);
    setOrderToDelete(null);

    showToast(
      'success',
      t('orderDeletedTitle'),
      t('orderDeleteSuccess'),
      4000
    );
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    if (!orderForm.customer.name.trim() || !orderForm.customer.phone.trim()) {
      showToast('error', t('errorTitle'), t('namePhoneRequiredError'), 4000);
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(orderForm.customer.name.trim())) {
      showToast('error', t('errorTitle'), t('nameLettersOnlyError'), 4000);
      return;
    }
    if (!/^[\d+\s()-]+$/.test(orderForm.customer.phone.trim())) {
      showToast('error', t('errorTitle'), t('phoneInvalidError'), 4000);
      return;
    }
    if (orderForm.customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.customer.email.trim())) {
      showToast('error', t('errorTitle'), t('invalidEmailError'), 4000);
      return;
    }
    if (orderItems.length === 0) {
      showToast('error', t('errorTitle'), 'Debes agregar al menos un producto al pedido', 4000);
      return;
    }

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant?.id)
      .eq('phone', orderForm.customer.phone.trim())
      .maybeSingle();

    if (!existingCustomer) {
      await supabase
        .from('customers')
        .insert({
          restaurant_id: restaurant?.id,
          name: orderForm.customer.name.trim(),
          phone: orderForm.customer.phone.trim(),
          email: orderForm.customer.email?.trim() || null,
          address: orderForm.delivery_address?.trim() || orderForm.customer.address?.trim() || null,
          delivery_instructions: orderForm.customer.delivery_instructions?.trim() || '',
          is_vip: false,
        });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const deliveryCost = orderForm.order_type === 'delivery' ?
    (restaurant?.settings?.delivery?.zones[0]?.cost || 0) : 0;
    const total = subtotal + deliveryCost;

    const updatedOrder = {
      customer_name: orderForm.customer.name,
      customer_phone: orderForm.customer.phone,
      customer_email: orderForm.customer.email || null,
      customer_address: orderForm.customer.address || null,
      items: orderItems,
      order_type: orderForm.order_type,
      status: orderForm.status,
      delivery_address: orderForm.delivery_address || null,
      table_number: orderForm.table_number || null,
      delivery_cost: deliveryCost,
      subtotal: subtotal,
      total: total,
      total_amount: total,
      special_instructions: orderForm.special_instructions || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('orders')
      .update(updatedOrder)
      .eq('id', editingOrder.id);

    if (error) {
      console.error('Error updating order:', error);
      showToast('error', t('errorTitle'), 'No se pudo actualizar el pedido', 4000);
      return;
    }

    await loadOrders();
    setShowEditOrderModal(false);
    setEditingOrder(null);
    resetOrderForm();
    showToast(
      'success',
      t('orderUpdatedTitle'),
      t('orderUpdateSuccess'),
      4000
    );
  };

  const handleCreateOrder = async () => {
    if (!restaurant) return;
    if (!orderForm.customer.name.trim() || !orderForm.customer.phone.trim()) {
      showToast('error', t('errorTitle'), t('namePhoneRequiredError'), 4000);
      return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(orderForm.customer.name.trim())) {
      showToast('error', t('errorTitle'), t('nameLettersOnlyError'), 4000);
      return;
    }
    if (!/^[\d+\s()-]+$/.test(orderForm.customer.phone.trim())) {
      showToast('error', t('errorTitle'), t('phoneInvalidError'), 4000);
      return;
    }
    if (orderForm.customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderForm.customer.email.trim())) {
      showToast('error', t('errorTitle'), t('invalidEmailError'), 4000);
      return;
    }
    if (orderItems.length === 0) {
      showToast('error', t('errorTitle'), 'Debes agregar al menos un producto al pedido', 4000);
      return;
    }

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('phone', orderForm.customer.phone.trim())
      .maybeSingle();

    if (!existingCustomer) {
      await supabase
        .from('customers')
        .insert({
          restaurant_id: restaurant.id,
          name: orderForm.customer.name.trim(),
          phone: orderForm.customer.phone.trim(),
          email: orderForm.customer.email?.trim() || null,
          address: orderForm.delivery_address?.trim() || orderForm.customer.address?.trim() || null,
          delivery_instructions: orderForm.customer.delivery_instructions?.trim() || '',
          is_vip: false,
        });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const deliveryCost = orderForm.order_type === 'delivery' ?
      (restaurant.settings?.delivery?.zones[0]?.cost || 0) : 0;
    const total = subtotal + deliveryCost;

    const newOrder = {
      restaurant_id: restaurant.id,
      order_number: await generateOrderNumber(),
      status: 'pending',
      order_type: orderForm.order_type,
      customer_name: orderForm.customer.name,
      customer_phone: orderForm.customer.phone,
      customer_email: orderForm.customer.email || null,
      customer_address: orderForm.customer.address || null,
      items: orderItems,
      subtotal: subtotal,
      delivery_cost: deliveryCost,
      total: total,
      total_amount: total,
      delivery_address: orderForm.delivery_address || null,
      table_number: orderForm.table_number || null,
      special_instructions: orderForm.special_instructions || '',
      whatsapp_sent: false,
    };

    const { error } = await supabase
      .from('orders')
      .insert([newOrder]);

    if (error) {
      console.error('Error creating order:', error);
      showToast('error', t('errorTitle'), 'No se pudo crear el pedido', 4000);
      return;
    }

    await loadOrders();
    setShowCreateOrderModal(false);
    resetOrderForm();
    showToast(
      'success',
      t('orderCreatedTitle'),
      t('orderCreateSuccess'),
      4000
    );
  };

  return (
    <div className="p-6">
    {/* Header and Controls */}
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      {/* Título */}
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">
        {t('orderManagement')}
      </h1>
    
      {/* Controles */}
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
          <div className="flex items-center justify-between pt-3 
          border-t border-blue-200">
            <span className="text-xs text-blue-700 font-medium">{t('dailySales')}</span>
            <span className="text-sm font-bold text-green-700">
              {formatCurrency(orderStats.todayRevenue, currency)}
            </span>
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
              <p className="text-3xl font-bold text-green-900">
                {formatCurrency(orderStats.averageOrderValue, currency)}
              </p>
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
              <p className="text-3xl font-bold text-purple-900">
                {orderStats.completionRate.toFixed(1)}%
              </p>
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
          {/* Search */}
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
        
          {/* Bulk Actions Menu */}
          {showBulkActions && (
            <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow border w-full md:w-auto">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {t('bulkActionLabel')}:
              </span>
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
              <Button
                size="sm"
                onClick={handleBulkAction}
                disabled={!bulkAction}
              >
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
          </div>
        </div>
      )}

      {/* Order List */}
      {paginatedOrders.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {orders.length === 0 ? t('noOrdersRegistered') : t('noOrdersFound')}
          </h3>
          <p className="text-gray-600">
            {orders.length === 0 ? t('noOrdersMessage')
            : t('adjustFiltersMessage') }
          </p>
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
                        checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
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
                    <th className="px-6 py-3 text-left text-xs font-medium 
                    text-gray-500 uppercase tracking-wider">
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
                  {paginatedOrders.map((order) => (
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
                            onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title={t('view')}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => handleEditOrder(order)}
                            className="text-amber-600 hover:text-amber-900"
                            title={t('edit')}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteOrder(order)}
                            className="text-red-600 hover:text-red-900"
                            title={t('delete')}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={MessageSquare}
                            onClick={() => sendWhatsAppMessage(order)}
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
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('next')}
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex 
              sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t('showing')}{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {' '}
                    {t('to')}{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, sortedOrders.length)}
                    </span>
                    {' '}
                    {t('of')}{' '}
                    <span className="font-medium">{sortedOrders.length}</span>
                    {' '}
                    {t('results')}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="rounded-l-md"
                    >
                      {t('previous')}
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`z-10 ${currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      return null;
                    })}
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

      {/* View Order Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedOrder ? `${t('orderLabel')} ${selectedOrder.order_number}` : ''}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{t('orderInfoTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('orderType')}</p>
                  <div className="mt-1">
                    {getOrderTypeBadge(selectedOrder.order_type, selectedOrder.table_number)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('status')}</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('date')}</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
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

            {/* Order Items */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">{t('productsSectionTitle')}</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">{item.variation.name}</p>
                      {item.selected_ingredients && item.selected_ingredients.length > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          + {item.selected_ingredients.map(ing => typeof ing === 'object' ? ing.name : ing).join(', ')}
                        </p>
                      )}
                      {item.special_notes && (
                        <p className="text-sm text-blue-600 mt-1">
                          <em>{t('noteLabel')}: {item.special_notes}</em>
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">
                        {item.quantity} x {formatCurrency(item.variation.price, currency)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.variation.price * item.quantity, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t('subtotalLabel')}:</span>
                  <span>{formatCurrency(selectedOrder.subtotal, currency)}</span>
                </div>
                {selectedOrder.delivery_cost && selectedOrder.delivery_cost > 0 && (
                  <div className="flex justify-between">
                    <span>{t('deliveryLabel')}:</span>
                    <span>{formatCurrency(selectedOrder.delivery_cost, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('total')}:</span>
                  <span>{formatCurrency(selectedOrder.total, currency)}</span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {selectedOrder.special_instructions && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{t('specialInstructionsTitle')}</h3>
                <p className="text-gray-800">{selectedOrder.special_instructions}</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  printTicket(selectedOrder);
                }}
                icon={Printer}
              >
                {t('printTicket')}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  handleEditOrder(selectedOrder);
                }}
                icon={Edit}
              >
                {t('edit')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Create Order Modal */}
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
          {/* Customer Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">{t('customerInfoTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('nameRequiredLabel')}
                value={orderForm.customer.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
                    setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, name: value } }));
                  }
                }}
                placeholder={t('customerNamePlaceholder')}
              />
              <Input
                label={t('phoneRequiredLabel')}
                value={orderForm.customer.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[\d+\s()-]*$/.test(value)) {
                    setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, phone: value } }));
                  }
                }}
                placeholder={t('customerPhonePlaceholder')}
              />
              <Input
                label={t('email')}
                value={orderForm.customer.email}
                onChange={(e) => setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
                placeholder={t('customerEmailPlaceholder')}
              />
              <Input
                label={t('address')}
                value={orderForm.customer.address}
                onChange={(e) => setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))}
                placeholder={t('customerAddressPlaceholder')}
              />
            </div>
          </div>

          {/* Order Type */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">{t('orderTypeTitle')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={orderForm.order_type === 'pickup'}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value as Order['order_type'] }))}
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
                  onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value as Order['order_type'] }))}
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
                  onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value as Order['order_type'] }))}
                  className="mr-2"
                />
                <span>{t('tableOrderType')}</span>
              </label>
            </div>
          </div>

          {/* Conditional Fields */}
          {orderForm.order_type 
          === 'delivery' && (
            <div className="space-y-4">
              <Input
                label={t('deliveryAddressLabel')}
                value={orderForm.delivery_address}
                onChange={(e) => setOrderForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                placeholder={t('deliveryAddressPlaceholder')}
              />
              <Input
                label={t('deliveryReferencesLabel')}
                value={orderForm.customer.delivery_instructions}
                onChange={(e) => setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, delivery_instructions: e.target.value } }))}
                placeholder={t('deliveryReferencesPlaceholder')}
              />
            </div>
          )}
          {orderForm.order_type === 'dine-in' && (
            <Input
              label={t('tableNumberLabel')}
              value={orderForm.table_number}
              onChange={(e) => setOrderForm(prev => ({ ...prev, table_number: e.target.value }))}
              placeholder={t('tableNumberPlaceholder')}
            />
          )}

          {/* Products Selection */}
          <OrderProductSelector
            products={products}
            orderItems={orderItems}
            onAddItem={addItemToOrder}
            onRemoveItem={removeItemFromOrder}
            onUpdateQuantity={updateItemQuantity}
            onShowToast={showToast}
            currency={currency}
          />

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('specialInstructionsLabel')}</label>
            <textarea
              value={orderForm.special_instructions}
              onChange={(e) => setOrderForm(prev => ({ ...prev, special_instructions: e.target.value }))}
              placeholder={t('specialInstructionsPlaceholder')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
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
            <Button
              onClick={handleCreateOrder}
              className="flex-1"
            >
              {t('saveOrder')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={`${t('delete')} ${t('orderLabel')}`}
        size="sm"
      >
        {orderToDelete && (
          <div>
            <p className="text-gray-700 mb-4">
              {t('confirmDeleteOrder')} **{orderToDelete.order_number}**?
            </p>
            <p className="text-sm text-red-600 font-medium">
              {t('irreversibleAction')}
            </p>
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
              <Button
                variant="danger"
                onClick={confirmDeleteOrder}
                icon={Trash2}
              >
                {t('deleteOrder')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={showEditOrderModal}
        onClose={() => {
          setShowEditOrderModal(false);
          setEditingOrder(null);
          resetOrderForm();
        }}
        title={editingOrder ? `${t('edit')} ${t('orderLabel')} ${editingOrder.order_number}` : ''}
        size="lg"
      >
        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">{t('customerInfoTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('nameRequiredLabel')}
                value={orderForm.customer.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
                    setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, name: value } }));
                  }
                }}
                placeholder={t('customerNamePlaceholder')}
              />
              <Input
                label={t('phoneRequiredLabel')}
                value={orderForm.customer.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[\d+\s()-]*$/.test(value)) {
                    setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, phone: value } }));
                  }
                }}
                placeholder={t('customerPhonePlaceholder')}
              />
              <Input
                label={t('email')}
                value={orderForm.customer.email}
                onChange={(e) => setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
                placeholder={t('customerEmailPlaceholder')}
              />
              <Input
                label={t('address')}
                value={orderForm.customer.address}
                onChange={(e) => setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, address: e.target.value } }))}
                placeholder={t('customerAddressPlaceholder')}
              />
            </div>
          </div>

          {/* Order Type */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">{t('orderTypeTitle')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={orderForm.order_type === 'pickup'}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value as Order['order_type'] }))}
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
                  onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value as Order['order_type'] }))}
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
                  onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value as Order['order_type'] }))}
                  className="mr-2"
                />
                <span>{t('tableOrderType')}</span>
              </label>
            </div>
          </div>

          {/* Conditional Fields */}
          {orderForm.order_type === 'delivery' && (
            <div className="space-y-4">
              <Input
                label={t('deliveryAddressLabel')}
                value={orderForm.delivery_address}
                onChange={(e) => setOrderForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                placeholder={t('deliveryAddressPlaceholder')}
              />
              <Input
                label={t('deliveryReferencesLabel')}
                value={orderForm.customer.delivery_instructions}
                onChange={(e) => setOrderForm(prev => ({ ...prev, customer: { ...prev.customer, delivery_instructions: e.target.value } }))}
                placeholder={t('deliveryReferencesPlaceholder')}
              />
            </div>
          )}
          {orderForm.order_type === 'dine-in' && (
            <Input
              label={t('tableNumberLabel')}
              value={orderForm.table_number}
              onChange={(e) => setOrderForm(prev => ({ ...prev, table_number: e.target.value }))}
              placeholder={t('tableNumberPlaceholder')}
            />
          )}

          {/* Products Selection */}
          <OrderProductSelector
            products={products}
            orderItems={orderItems}
            onAddItem={addItemToOrder}
            onRemoveItem={removeItemFromOrder}
            onUpdateQuantity={updateItemQuantity}
            onShowToast={showToast}
            currency={currency}
          />

          {/* Order Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('status')}</label>
            <select
              value={orderForm.status}
              onChange={(e) => setOrderForm(prev => ({ ...prev, status: e.target.value as Order['status'] }))}
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

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('specialInstructionsLabel')}</label>
            <textarea
              value={orderForm.special_instructions}
              onChange={(e) => setOrderForm(prev => ({ ...prev, special_instructions: e.target.value }))}
              placeholder={t('specialInstructionsPlaceholder')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
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
            <Button
              onClick={handleUpdateOrder}
              className="flex-1"
            >
              {t('updateOrder')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};