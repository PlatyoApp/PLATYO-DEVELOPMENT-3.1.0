import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  User, Phone, Mail, MapPin, Filter, Search, Star,
  Pencil as Edit, ArrowUpDown, Trash2, Info, Download,
  Users, DollarSign, UserCheck, UserPlus, Upload
} from 'lucide-react';
import { Customer } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SubscriptionBlocker } from '../../components/subscription/SubscriptionBlocker';
import { formatCurrency } from '../../utils/currencyUtils';

interface CustomerRow extends Customer {
  id: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orderTypes: string[];
  isVip: boolean;
}

const PAGE_SIZE = 10;

export const CustomersManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const currency = restaurant?.settings?.currency || 'USD';
  const { status } = useSubscriptionLimits(restaurant?.id);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filters/sort/search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'vip' | 'frequent' | 'regular' | 'new'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);

  // Data
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRow | null>(null);

  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditAction, setBulkEditAction] = useState<'vip' | 'remove_vip' | 'delete'>('vip');

  // Import CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    delivery_instructions: '',
    isVip: false,
  });

  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    delivery_instructions: '',
    isVip: false,
  });

  // Stats (correctas, no dependen del paginado)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    vipCustomers: 0,
    frequentCustomers: 0,
    regularCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    totalRevenue: 0,
    averageSpent: 0,
    topCustomerSpent: 0,
    totalOrders: 0,
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCustomersCount / PAGE_SIZE)),
    [totalCustomersCount]
  );

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortBy, sortDirection, filterBy, statusFilter]);

  useEffect(() => {
    if (!restaurant?.id) return;
    void loadCustomersPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id, page, searchTerm, sortBy, sortDirection, filterBy, statusFilter]);

  useEffect(() => {
    if (!restaurant?.id) return;
    void loadCustomerStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  // ---------------------------
  // Helpers
  // ---------------------------
  const last30DaysCutoffISO = () =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const safeAvg = (spent: number, orders: number) => (orders > 0 ? spent / orders : 0);

  const getOrderTypeBadge = (orderType: string) => {
    switch (orderType) {
      case 'delivery':
        return <Badge variant="info" size="sm">{t('Delivery')}</Badge>;
      case 'pickup':
        return <Badge variant="gray" size="sm">{t('pickup')}</Badge>;
      case 'table':
      case 'dine-in':
        return <Badge variant="warning" size="sm">{t('mesa')}</Badge>;
      default:
        return <Badge variant="gray" size="sm">{orderType}</Badge>;
    }
  };

  const getCustomerSegmentBadges = (totalOrders: number, isVip: boolean) => {
    const seg: React.ReactNode[] = [];
    if (isVip) seg.push(<Badge key="vip" variant="success">VIP</Badge>);

    if (totalOrders <= 1) seg.push(<Badge key="new" variant="info">{t('newCustomer')}</Badge>);
    else if (totalOrders >= 2 && totalOrders <= 4) seg.push(<Badge key="regular" variant="gray">{t('regular')}</Badge>);
    else if (totalOrders >= 5) seg.push(<Badge key="frequent" variant="warning">{t('frequent')}</Badge>);

    return <div className="flex flex-wrap gap-1">{seg}</div>;
  };

  // ---------------------------
  // LISTADO PAGINADO (server-side)
  // ---------------------------
  const loadCustomersPage = async () => {
    if (!restaurant?.id) return;

    setLoadingList(true);

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // 1) Query base customers (solo necesario para lista)
    let customersQuery = supabase
      .from('customers')
      .select('id, name, phone, email, address, is_vip, created_at', { count: 'exact' })
      .eq('restaurant_id', restaurant.id);

    // search
    if (searchTerm.trim()) {
      const s = searchTerm.trim();
      customersQuery = customersQuery.or(
        `name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`
      );
    }

    // filter VIP base
    if (filterBy === 'vip') customersQuery = customersQuery.eq('is_vip', true);

    // sort base fields (cuando el sort sea por name se puede aquí)
    if (sortBy === 'name') {
      customersQuery = customersQuery.order('name', { ascending: sortDirection === 'asc' });
    } else {
      // orden estable por created_at si no es name (luego ajustamos en memoria con métricas)
      customersQuery = customersQuery.order('created_at', { ascending: false });
    }

    // pagination
    const { data: customersData, error: customersError, count } = await customersQuery.range(from, to);

    if (customersError) {
      console.error(customersError);
      setLoadingList(false);
      showToast('error', 'Error', 'No se pudieron cargar los clientes');
      return;
    }

    setTotalCustomersCount(count || 0);

    const customersPage = customersData || [];
    const phones = customersPage.map(c => c.phone).filter(Boolean) as string[];

    // 2) Traer órdenes SOLO de esos teléfonos (mínimo necesario)
    //    (para métricas de la página)
    let ordersByPhone: Record<string, { totalOrders: number; totalSpent: number; lastOrderDate: string; orderTypes: Set<string> }> = {};
    if (phones.length > 0) {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_phone, status, total, created_at, order_type')
        .eq('restaurant_id', restaurant.id)
        .in('customer_phone', phones);

      if (ordersError) {
        console.error(ordersError);
        // seguimos con métricas en 0 si falla
      } else {
        for (const o of ordersData || []) {
          const phone = (o as any).customer_phone as string;
          if (!phone) continue;

          if (!ordersByPhone[phone]) {
            ordersByPhone[phone] = {
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: '',
              orderTypes: new Set<string>(),
            };
          }

          ordersByPhone[phone].totalOrders += 1;

          if ((o as any).status === 'delivered') {
            ordersByPhone[phone].totalSpent += Number((o as any).total) || 0;
          }

          const created = (o as any).created_at as string;
          if (!ordersByPhone[phone].lastOrderDate || new Date(created) > new Date(ordersByPhone[phone].lastOrderDate)) {
            ordersByPhone[phone].lastOrderDate = created;
          }

          const ot = (o as any).order_type as string;
          if (ot) ordersByPhone[phone].orderTypes.add(ot);
        }
      }
    }

    // 3) Construir rows con métricas
    let built: CustomerRow[] = customersPage.map((c: any) => {
      const metrics = ordersByPhone[c.phone] || {
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: '',
        orderTypes: new Set<string>(),
      };

      const lastOrderDate = metrics.lastOrderDate || c.created_at;

      return {
        ...c,
        totalOrders: metrics.totalOrders,
        totalSpent: metrics.totalSpent,
        lastOrderDate,
        orderTypes: Array.from(metrics.orderTypes),
        isVip: !!c.is_vip,
        delivery_instructions: '', // no lo cargamos en lista
        restaurant_id: restaurant.id,
        updated_at: c.updated_at || c.created_at,
        city: c.city || '',
        notes: c.notes || '',
      } as CustomerRow;
    });

    // 4) Aplicar filtros que dependen de métricas (frequent/regular/new, active/inactive)
    if (filterBy === 'frequent') built = built.filter(x => x.totalOrders >= 5);
    if (filterBy === 'regular') built = built.filter(x => x.totalOrders >= 2 && x.totalOrders <= 4);
    if (filterBy === 'new') built = built.filter(x => x.totalOrders <= 1);

    if (statusFilter !== 'all') {
      const cutoff = new Date(last30DaysCutoffISO());
      built = built.filter(x => {
        const isActive = new Date(x.lastOrderDate) >= cutoff;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    // 5) Sort por métricas (en memoria porque no las tenemos en customers table)
    const asc = sortDirection === 'asc';
    built.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'orders') cmp = a.totalOrders - b.totalOrders;
      if (sortBy === 'spent') cmp = a.totalSpent - b.totalSpent;
      if (sortBy === 'date') cmp = new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime();
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      return asc ? cmp : -cmp;
    });

    setRows(built);
    setLoadingList(false);

    // Al cambiar página, limpia selección de página (opcional, pero recomendado)
    setSelectedCustomers(new Set());
  };

  // ---------------------------
  // STATS CORRECTAS (globales)
  // ---------------------------
  const loadCustomerStats = async () => {
    if (!restaurant?.id) return;
    setLoadingStats(true);

    // Total customers + vip + etc desde customers
    const { data: customersAll, error: cErr } = await supabase
      .from('customers')
      .select('id, is_vip, created_at, phone')
      .eq('restaurant_id', restaurant.id);

    if (cErr) {
      console.error(cErr);
      setLoadingStats(false);
      return;
    }

    const phones = (customersAll || []).map((c: any) => c.phone).filter(Boolean) as string[];

    // Traer órdenes (mínimo) para stats globales
    // OJO: si tienes MUCHOS pedidos, esto puede ser pesado. Por eso la Opción B (vista/RPC) es mejor.
    const { data: ordersAll, error: oErr } = await supabase
      .from('orders')
      .select('customer_phone, status, total, created_at')
      .eq('restaurant_id', restaurant.id);

    if (oErr) {
      console.error(oErr);
      setLoadingStats(false);
      return;
    }

    const byPhone: Record<string, { orders: number; spent: number; last: string }> = {};
    for (const o of ordersAll || []) {
      const phone = (o as any).customer_phone as string;
      if (!phone) continue;
      if (!byPhone[phone]) byPhone[phone] = { orders: 0, spent: 0, last: '' };
      byPhone[phone].orders += 1;
      if ((o as any).status === 'delivered') byPhone[phone].spent += Number((o as any).total) || 0;

      const created = (o as any).created_at as string;
      if (!byPhone[phone].last || new Date(created) > new Date(byPhone[phone].last)) byPhone[phone].last = created;
    }

    const cutoff = new Date(last30DaysCutoffISO());

    const totalCustomers = (customersAll || []).length;
    const vipCustomers = (customersAll || []).filter((c: any) => !!c.is_vip).length;

    let frequentCustomers = 0;
    let regularCustomers = 0;
    let newCustomers = 0;
    let activeCustomers = 0;
    let inactiveCustomers = 0;

    let totalRevenue = 0;
    let totalOrders = 0;
    let topCustomerSpent = 0;

    for (const c of customersAll || []) {
      const phone = (c as any).phone as string;
      const m = phone ? byPhone[phone] : undefined;

      const orders = m?.orders ?? 0;
      const spent = m?.spent ?? 0;
      const last = m?.last || (c as any).created_at;

      totalOrders += orders;
      totalRevenue += spent;
      if (spent > topCustomerSpent) topCustomerSpent = spent;

      if (orders >= 5) frequentCustomers += 1;
      else if (orders >= 2) regularCustomers += 1;
      else newCustomers += 1;

      const isActive = new Date(last) >= cutoff;
      if (isActive) activeCustomers += 1;
      else inactiveCustomers += 1;
    }

    const averageSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    setStats({
      totalCustomers,
      vipCustomers,
      frequentCustomers,
      regularCustomers,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      totalRevenue,
      averageSpent,
      topCustomerSpent,
      totalOrders,
    });

    setLoadingStats(false);
  };

  // ---------------------------
  // Selection
  // ---------------------------
  const toggleCustomerSelection = (customerId: string) => {
    const next = new Set(selectedCustomers);
    if (next.has(customerId)) next.delete(customerId);
    else next.add(customerId);
    setSelectedCustomers(next);
  };

  const toggleSelectAll = () => {
    const ids = rows.map(r => r.id);
    const allSelected = ids.length > 0 && ids.every(id => selectedCustomers.has(id));

    const next = new Set(selectedCustomers);
    if (allSelected) ids.forEach(id => next.delete(id));
    else ids.forEach(id => next.add(id));

    setSelectedCustomers(next);
  };

  // ---------------------------
  // Edit (cargar SOLO ese cliente)
  // ---------------------------
  const loadSingleCustomerForEdit = async (customerId: string) => {
    if (!restaurant?.id) return;

    const { data, error } = await supabase
      .from('customers')
      .select('id, restaurant_id, name, phone, email, address, delivery_instructions, is_vip, created_at, updated_at')
      .eq('restaurant_id', restaurant.id)
      .eq('id', customerId)
      .single();

    if (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo cargar el cliente');
      return;
    }

    // métricas del cliente (solo ese phone)
    const phone = (data as any).phone as string;
    let totalOrders = 0;
    let totalSpent = 0;
    let lastOrderDate = (data as any).created_at as string;
    let orderTypes: string[] = [];

    if (phone) {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, total, created_at, order_type')
        .eq('restaurant_id', restaurant.id)
        .eq('customer_phone', phone);

      const setTypes = new Set<string>();
      for (const o of ordersData || []) {
        totalOrders += 1;
        if ((o as any).status === 'delivered') totalSpent += Number((o as any).total) || 0;
        const created = (o as any).created_at as string;
        if (new Date(created) > new Date(lastOrderDate)) lastOrderDate = created;
        if ((o as any).order_type) setTypes.add((o as any).order_type);
      }
      orderTypes = Array.from(setTypes);
    }

    const customer: CustomerRow = {
      ...(data as any),
      totalOrders,
      totalSpent,
      lastOrderDate,
      orderTypes,
      isVip: !!(data as any).is_vip,
    };

    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      delivery_instructions: customer.delivery_instructions || '',
      isVip: customer.isVip,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCustomer(null);
    setEditForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      delivery_instructions: '',
      isVip: false,
    });
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer || !restaurant?.id) return;

    if (!editForm.name.trim()) {
      showToast('warning', t('validationError'), t('nameRequiredError'), 3000);
      return;
    }
    if (!editForm.phone.trim()) {
      showToast('warning', t('validationError'), t('phoneRequiredError'), 3000);
      return;
    }
    if (editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email.trim())) {
        showToast('warning', t('validationError'), t('emailInvalid'), 3000);
        return;
      }
    }

    const { error } = await supabase
      .from('customers')
      .update({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || null,
        address: editForm.address.trim() || null,
        delivery_instructions: editForm.delivery_instructions.trim() || '',
        is_vip: editForm.isVip,
        updated_at: new Date().toISOString(),
      })
      .eq('restaurant_id', restaurant.id)
      .eq('id', editingCustomer.id);

    if (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo actualizar el cliente');
      return;
    }

    handleCloseEditModal();
    await loadCustomersPage();
    await loadCustomerStats();

    showToast('success', t('customerUpdated'), t('customerInfoUpdatedSuccessfully'), 4000);
  };

  // ---------------------------
  // Create
  // ---------------------------
  const handleCreateCustomer = async () => {
    if (!restaurant?.id) return;

    if (!createForm.name.trim()) {
      showToast('warning', t('validationError'), t('nameRequiredError'), 3000);
      return;
    }
    if (!createForm.phone.trim()) {
      showToast('warning', t('validationError'), t('phoneRequiredError'), 3000);
      return;
    }
    if (createForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createForm.email.trim())) {
        showToast('warning', t('validationError'), t('emailInvalid'), 3000);
        return;
      }
    }

    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('phone', createForm.phone.trim())
      .maybeSingle();

    if (existing) {
      showToast('warning', t('validationError'), t('customerAlreadyExists'), 3000);
      return;
    }

    const { error } = await supabase.from('customers').insert({
      restaurant_id: restaurant.id,
      name: createForm.name.trim(),
      phone: createForm.phone.trim(),
      email: createForm.email.trim() || null,
      address: createForm.address.trim() || null,
      delivery_instructions: createForm.delivery_instructions.trim() || '',
      is_vip: createForm.isVip,
    });

    if (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo crear el cliente');
      return;
    }

    setShowCreateModal(false);
    setCreateForm({ name: '', phone: '', email: '', address: '', delivery_instructions: '', isVip: false });

    await loadCustomersPage();
    await loadCustomerStats();

    showToast('success', 'Cliente creado', `${createForm.name} ha sido agregado exitosamente`, 4000);
  };

  // ---------------------------
  // VIP toggle (solo DB)
  // ---------------------------
  const toggleVipStatus = async (customerId: string) => {
    if (!restaurant?.id) return;
    const row = rows.find(r => r.id === customerId);
    if (!row) return;

    const { error } = await supabase
      .from('customers')
      .update({ is_vip: !row.isVip, updated_at: new Date().toISOString() })
      .eq('restaurant_id', restaurant.id)
      .eq('id', customerId);

    if (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo actualizar el estado VIP');
      return;
    }

    await loadCustomersPage();
    await loadCustomerStats();
  };

  // ---------------------------
  // Delete
  // ---------------------------
  const handleDeleteCustomer = (customerId: string) => {
    const row = rows.find(r => r.id === customerId);
    if (!row) return;
    setCustomerToDelete(row);
    setShowDeleteModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!restaurant?.id || !customerToDelete) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('restaurant_id', restaurant.id)
      .eq('id', customerToDelete.id);

    if (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo eliminar el cliente');
      return;
    }

    setShowDeleteModal(false);
    setCustomerToDelete(null);

    await loadCustomersPage();
    await loadCustomerStats();
  };

  // ---------------------------
  // Bulk edit
  // ---------------------------
  const handleBulkEdit = () => {
    if (selectedCustomers.size === 0) {
      showToast('warning', t('noSelection'), t('selectAtLeastOneCustomer'), 4000);
      return;
    }
    setShowBulkEditModal(true);
  };

  const executeBulkEdit = async () => {
    if (!restaurant?.id) return;

    const ids = Array.from(selectedCustomers);
    if (ids.length === 0) return;

    if (bulkEditAction === 'vip') {
      const { error } = await supabase
        .from('customers')
        .update({ is_vip: true, updated_at: new Date().toISOString() })
        .eq('restaurant_id', restaurant.id)
        .in('id', ids);

      if (error) {
        console.error(error);
        showToast('error', 'Error', 'No se pudo actualizar el estado VIP');
        return;
      }
    }

    if (bulkEditAction === 'remove_vip') {
      const { error } = await supabase
        .from('customers')
        .update({ is_vip: false, updated_at: new Date().toISOString() })
        .eq('restaurant_id', restaurant.id)
        .in('id', ids);

      if (error) {
        console.error(error);
        showToast('error', 'Error', 'No se pudo remover el estado VIP');
        return;
      }
    }

    if (bulkEditAction === 'delete') {
      if (!confirm(`${t('confirmDeleteMultiple')} ${ids.length} cliente${ids.length !== 1 ? 's' : ''}? ${t('warningDeleteAction')}`)) {
        return;
      }
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('restaurant_id', restaurant.id)
        .in('id', ids);

      if (error) {
        console.error(error);
        showToast('error', 'Error', 'No se pudieron eliminar los clientes');
        return;
      }
    }

    setSelectedCustomers(new Set());
    setShowBulkEditModal(false);
    setBulkEditAction('vip');

    await loadCustomersPage();
    await loadCustomerStats();
  };

  // ---------------------------
  // CSV Export (exporta SOLO lo filtrado en UI actual = página actual)
  // Si quieres exportar TODOS los resultados del filtro global, dime y lo hago server-side.
  // ---------------------------
  const exportToCSV = () => {
    const dataToExport = rows;

    if (dataToExport.length === 0) {
      showToast('warning', t('noDataToExport'), t('noCustomersMatchFilters'), 4000);
      return;
    }

    const headers = [
      t('name'),
      t('phone'),
      t('email'),
      t('address'),
      t('totalOrders'),
      t('totalSpent'),
      t('averagePerOrder'),
      t('orderTypes'),
      t('isVip'),
      t('lastOrder'),
    ];

    const delimiter = ';';
    const BOM = '\uFEFF';

    const csvData = dataToExport.map(c => [
      c.name,
      c.phone,
      c.email || '',
      c.address || '',
      c.totalOrders,
      formatCurrency(c.totalSpent, currency),
      formatCurrency(safeAvg(c.totalSpent, c.totalOrders), currency),
      (c.orderTypes || []).join(', '),
      c.isVip ? t('yes') : t('no'),
      new Date(c.lastOrderDate).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(delimiter),
      ...csvData.map(row => row.map(field => {
        const s = String(field ?? '');
        return (s.includes(delimiter) || s.includes('\n') || s.includes('"'))
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(delimiter))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const today = new Date().toISOString().split('T')[0];
    const fileName = `${t('customers')}_${restaurant?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.csv`;

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', t('csvExported'), t('exportedSuccessfullyPlural', { count: dataToExport.length }), 4000);
  };

  // ---------------------------
  // CSV Import (tu lógica original casi igual)
  // ---------------------------
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text: string) => {
    text = text.replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      setImportErrors([t('csvEmptyOrNoData')]);
      setShowImportModal(true);
      return;
    }

    const delimiter = detectDelimiter(text);
    const headers = parseCSVLine(lines[0], delimiter);
    const requiredHeaders = [t('name'), t('phone')];
    const missing = requiredHeaders.filter(h => !headers.includes(h));

    if (missing.length > 0) {
      setImportErrors([t('missingRequiredColumns', { columns: missing.join(', '), found: headers.join(', ') })]);
      setShowImportModal(true);
      return;
    }

    const errors: string[] = [];
    const preview: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      if (values.length !== headers.length) {
        errors.push(t('lineIncorrectColumns', { line: i + 1, expected: headers.length, got: values.length, values: values.join(' | ') }));
        continue;
      }

      const row: any = {};
      headers.forEach((h, idx) => row[h] = values[idx]);

      if (!row[t('name')]?.trim()) { errors.push(t('lineNameRequired', { line: i + 1 })); continue; }
      if (!row[t('phone')]?.trim()) { errors.push(t('linePhoneRequired', { line: i + 1 })); continue; }

      preview.push({
        name: row[t('name')].trim(),
        phone: row[t('phone')].trim(),
        email: row[t('email')]?.trim() || '',
        address: row[t('address')]?.trim() || '',
        delivery_instructions: row[t('deliveryInstructions')]?.trim() || '',
        isVip: (row[t('isVip')] || '').toLowerCase() === t('yes').toLowerCase() || (row[t('isVip')] || '').toLowerCase() === 'yes',
        lineNumber: i + 1
      });
    }

    setImportErrors(errors);
    setImportPreview(preview);
    setShowImportModal(true);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast('error', t('invalidFile'), t('pleaseSelectValidCSV'), 4000);
      return;
    }

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim() === '') {
        showToast('error', t('emptyFile'), t('csvFileIsEmpty'), 4000);
        return;
      }
      parseCSV(text);
    };

    reader.onerror = () => showToast('error', t('readError'), t('couldNotReadFile'), 4000);
    reader.readAsText(file, 'UTF-8');
  };

  const executeImport = async () => {
    if (!restaurant?.id) return;
    if (importPreview.length === 0) return;

    const customersToInsert = importPreview.map((c) => ({
      restaurant_id: restaurant.id,
      name: c.name,
      phone: c.phone,
      email: c.email || null,
      address: c.address || null,
      delivery_instructions: c.delivery_instructions || '',
      is_vip: c.isVip,
    }));

    const { error } = await supabase.from('customers').insert(customersToInsert);

    if (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudieron importar los clientes');
      return;
    }

    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    await loadCustomersPage();
    await loadCustomerStats();

    showToast('success', t('importSuccessful'), t('customersImportedSuccessfully', { count: customersToInsert.length }), 4000);
  };

  const cancelImport = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------
  // Render
  // ---------------------------
  if (status?.isExpired || !status?.isActive) {
    return (
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {t('customerManagement')}
          </h1>
        </div>
        <SubscriptionBlocker planName={status?.planName} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          {t('customerManagement')}
        </h1>

        <div className="flex flex-wrap justify-start md:justify-end gap-2 w-full md:w-auto">
          {selectedCustomers.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={Users}
              onClick={handleBulkEdit}
              className="bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              {t('edit')} {selectedCustomers.size} {t('selectedPlural', { count: selectedCustomers.size })}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={exportToCSV}
            className="bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            {t('exportCSV')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            className="bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            {t('importCSV')}
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportFile} className="hidden" />

          <Button
            variant="outline"
            size="sm"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
            className={
              (showFilters ? 'bg-gray-700 text-white' : 'bg-gray-600 text-white') +
              ' border-gray-600 hover:bg-gray-600 hover:text-white hover:border-gray-600'
            }
          >
            {t('filtersAndSearch')}
          </Button>

          <Button icon={UserPlus} onClick={() => setShowCreateModal(true)}>
            {t('newCustomer')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-900 mb-1">{t('totalCustomers')}</p>
              <p className="text-3xl font-bold text-blue-900">
                {loadingStats ? '…' : stats.totalCustomers}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-blue-200">
            <span className="text-xs text-blue-700 font-medium">{t('customerBase')}</span>
            <span className="text-sm font-bold text-blue-800">
              {loadingStats ? '…' : `${stats.newCustomers} ${t('new')}`}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border border-purple-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-purple-900 mb-1">{t('vipCustomers')}</p>
              <p className="text-3xl font-bold text-purple-900">
                {loadingStats ? '…' : stats.vipCustomers}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-purple-200">
            <span className="text-xs text-purple-700 font-medium">{t('assignedManually')}</span>
            <span className="text-sm font-bold text-purple-800">
              {loadingStats ? '…' : `${((stats.vipCustomers / stats.totalCustomers) * 100 || 0).toFixed(1)}%`}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-900 mb-1">{t('frequentCustomers')}</p>
              <p className="text-3xl font-bold text-green-900">
                {loadingStats ? '…' : stats.frequentCustomers}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-green-200">
            <span className="text-xs text-green-700 font-medium">{t('ordersPlus')}</span>
            <span className="text-sm font-bold text-green-800">
              {loadingStats ? '…' : `${((stats.frequentCustomers / stats.totalCustomers) * 100 || 0).toFixed(1)}%`}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-md border border-orange-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-orange-900 mb-1">{t('averageSpending')}</p>
              <p className="text-3xl font-bold text-orange-900">
                {loadingStats ? '…' : formatCurrency(stats.averageSpent, currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-orange-200">
            <span className="text-xs text-orange-700 font-medium">{t('perCustomer')}</span>
            <span className="text-sm font-bold text-green-700">
              {loadingStats ? '…' : formatCurrency(stats.totalRevenue, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchCustomersPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
              >
                <option value="all">{t('allStatuses')}</option>
                <option value="active">{t('activeLast30Days')}</option>
                <option value="inactive">{t('inactivePlus30Days')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2 whitespace-nowrap">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
              >
                <option value="all">{t('allSegments')}</option>
                <option value="vip">{t('onlyVip')}</option>
                <option value="frequent">{t('onlyFrequent')}</option>
                <option value="regular">{t('onlyRegular')}</option>
                <option value="new">{t('onlyNew')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2 whitespace-nowrap">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
              >
                <option value="name">{t('sortByName')}</option>
                <option value="orders">{t('sortByOrders')}</option>
                <option value="spent">{t('sortBySpent')}</option>
                <option value="date">{t('sortByDate')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2 whitespace-nowrap">
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50 transition-colors flex items-center gap-1"
                title={sortDirection === 'asc' ? t('changeToDescending') : t('changeToAscending')}
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loadingList ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
          {t('loading')}…
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('noCustomersFound')}
          </h3>
          <p className="text-gray-600">{t('tryDifferentSearch')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every(c => selectedCustomers.has(c.id))}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('customer')}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('contact')}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ordersCount')}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('totalSpent')}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('orderTypes')}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                    <div className="flex items-center relative">
                      {t('segment')}
                      <Info className="w-3 h-3 ml-1 text-gray-400" />
                    </div>
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('lastOrder')}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.has(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          {customer.address && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {customer.address.length > 30 ? `${customer.address.substring(0, 30)}...` : customer.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {customer.email}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.totalOrders}</div>
                      <div className="text-sm text-gray-500">{t('orders')}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(customer.totalSpent, currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(safeAvg(customer.totalSpent, customer.totalOrders), currency)} {t('avg')}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(customer.orderTypes || []).map(type => (
                          <div key={type}>{getOrderTypeBadge(type)}</div>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCustomerSegmentBadges(customer.totalOrders, customer.isVip)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => loadSingleCustomerForEdit(customer.id)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200 mr-2"
                        title={t('editCustomer')}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                      </button>

                      <button
                        onClick={() => toggleVipStatus(customer.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          customer.isVip
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } mr-2`}
                        title={customer.isVip ? t('removeVip') : t('makeVip')}
                      >
                        <Star className={`w-3 h-3 mr-1 ${customer.isVip ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors bg-red-100 text-red-800 hover:bg-red-200"
                        title={t('deleteCustomer')}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages} · {totalCustomersCount} clientes
            </span>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title={t('editCustomer')} size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('fullNameRequired')}
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('customerName')}
            />
            <Input
              label={t('phoneRequired')}
              value={editForm.phone}
              onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <Input
            label={t('email')}
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t('emailPlaceholder')}
          />

          <Input
            label={t('address')}
            value={editForm.address}
            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
            placeholder={t('fullAddress')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('deliveryInstructions')}
            </label>
            <textarea
              value={editForm.delivery_instructions}
              onChange={(e) => setEditForm(prev => ({ ...prev, delivery_instructions: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('deliveryInstructionsPlaceholder')}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={editForm.isVip}
              onChange={(e) => setEditForm(prev => ({ ...prev, isVip: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              {t('vipCustomer')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={handleCloseEditModal}>{t('cancel')}</Button>

            <Button
              variant="danger"
              onClick={() => {
                if (editingCustomer) {
                  setCustomerToDelete(editingCustomer);
                  setShowDeleteModal(true);
                  handleCloseEditModal();
                }
              }}
            >
              {t('deleteCustomer')}
            </Button>

            <Button onClick={handleSaveCustomer} disabled={!editForm.name.trim() || !editForm.phone.trim()}>
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ name: '', phone: '', email: '', address: '', delivery_instructions: '', isVip: false });
        }}
        title={t('newCustomer')}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('fullNameRequired')}
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('customerName')}
            />
            <Input
              label={t('phoneRequired')}
              value={createForm.phone}
              onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <Input
            label={t('email')}
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t('emailPlaceholder')}
          />

          <Input
            label={t('address')}
            value={createForm.address}
            onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
            placeholder={t('fullAddress')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('deliveryInstructions')}</label>
            <textarea
              value={createForm.delivery_instructions}
              onChange={(e) => setCreateForm(prev => ({ ...prev, delivery_instructions: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('deliveryInstructionsPlaceholder')}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={createForm.isVip}
              onChange={(e) => setCreateForm(prev => ({ ...prev, isVip: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
            />
            <label className="text-sm font-medium text-gray-700">{t('vipCustomer')}</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreateCustomer} disabled={!createForm.name.trim() || !createForm.phone.trim()}>{t('create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setCustomerToDelete(null); }}
        title={t('confirmDeletion')}
        size="md"
      >
        {customerToDelete && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('deleteCustomerConfirm')} "{customerToDelete.name}"?
              </h3>
              <p className="text-gray-600 mb-4">{t('actionWillDeletePermanently')}</p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• {t('allCustomerInfo')}</li>
                  <li>• {customerToDelete.totalOrders} {t('orders', { count: customerToDelete.totalOrders })}</li>
                  <li>• {t('purchaseHistory')} ({formatCurrency(customerToDelete.totalSpent, currency)})</li>
                  {customerToDelete.isVip && <li>• {t('customerVipStatus')}</li>}
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                <strong>{t('actionCannotBeUndone')}</strong>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setCustomerToDelete(null); }}>
                {t('cancel')}
              </Button>
              <Button variant="danger" onClick={confirmDeleteCustomer} icon={Trash2}>
                {t('deleteCustomer')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={showBulkEditModal}
        onClose={() => { setShowBulkEditModal(false); setBulkEditAction('vip'); }}
        title={t('bulkEdit')}
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                {selectedCustomers.size} {t('customerPlural', { count: selectedCustomers.size })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('selectActionToPerform')}
            </label>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulkAction"
                  value="vip"
                  checked={bulkEditAction === 'vip'}
                  onChange={(e) => setBulkEditAction(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{t('markAsVip')}</span>
                  <p className="text-xs text-gray-500">{t('addVipStatusToSelected')}</p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulkAction"
                  value="remove_vip"
                  checked={bulkEditAction === 'remove_vip'}
                  onChange={(e) => setBulkEditAction(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">{t('removeVip')}</span>
                  <p className="text-xs text-gray-500">{t('removeVipStatusFromSelected')}</p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="bulkAction"
                  value="delete"
                  checked={bulkEditAction === 'delete'}
                  onChange={(e) => setBulkEditAction(e.target.value as any)}
                  className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500 mr-3"
                />
                <div>
                  <span className="text-sm font-medium text-red-900">{t('deleteCustomers')}</span>
                  <p className="text-xs text-red-500">⚠️ {t('permanentlyDeleteAllCustomersAndOrders')}</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={() => { setShowBulkEditModal(false); setBulkEditAction('vip'); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={executeBulkEdit}
              variant={bulkEditAction === 'delete' ? 'danger' : 'primary'}
              icon={bulkEditAction === 'delete' ? Trash2 : Users}
            >
              {bulkEditAction === 'vip' && t('markAsVip')}
              {bulkEditAction === 'remove_vip' && t('removeVip')}
              {bulkEditAction === 'delete' && t('deleteCustomers')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import CSV Modal */}
      <Modal isOpen={showImportModal} onClose={cancelImport} title={t('importCustomersFromCSV')} size="lg">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">{t('csvFileFormat')}</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>{t('name')}</strong> ({t('required')}): {t('customerFullName')}</li>
                  <li><strong>{t('phone')}</strong> ({t('required')}): {t('uniquePhoneNumber')}</li>
                  <li><strong>{t('email')}</strong> ({t('optional')}): {t('emailAddress')}</li>
                  <li><strong>{t('address')}</strong> ({t('optional')}): {t('fullAddress')}</li>
                  <li><strong>{t('deliveryInstructions')}</strong> ({t('optional')}): {t('additionalDirections')}</li>
                  <li><strong>{t('isVip')}</strong> ({t('optional')}): "{t('yes')}" {t('or')} "{t('no')}"</li>
                </ul>
              </div>
            </div>
          </div>

          {importErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-2">
                    {t('errorsFound', { count: importErrors.length })}
                  </p>
                  <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {importErrors.map((error, idx) => <li key={idx}>• {error}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {importPreview.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {t('preview')}: {importPreview.length} {t('customerPlural', { count: importPreview.length })}
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {importPreview.map((c, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{c.name}</span>
                            {c.isVip && <Badge variant="success" size="sm">VIP</Badge>}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>
                            {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</div>}
                            {c.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.address}</div>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{t('line')} {c.lineNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={cancelImport}>{t('cancel')}</Button>
            <Button onClick={executeImport} disabled={importPreview.length === 0} icon={Upload}>
              {t('import')} {importPreview.length} {t('customerPlural', { count: importPreview.length })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
