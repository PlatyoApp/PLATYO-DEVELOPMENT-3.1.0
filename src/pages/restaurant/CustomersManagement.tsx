import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, MapPin, Calendar, ShoppingBag, Filter, Search, Star, Pencil as Edit, ArrowUpDown, Trash2, Info, Download, CheckSquare, Square, Users, DollarSign, TrendingUp, UserCheck, UserPlus, Upload } from 'lucide-react';
import { Order, Customer, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/currencyUtils';

interface CustomerData extends Customer {
  id: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orderTypes: string[];
  isVip: boolean;
}

export const CustomersManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const currency = restaurant?.settings?.currency || 'USD';
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'vip' | 'frequent' | 'regular' | 'new'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditAction, setBulkEditAction] = useState<'vip' | 'remove_vip' | 'delete'>('vip');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    delivery_instructions: '',
    isVip: false,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    delivery_instructions: '',
    isVip: false,
  });

  useEffect(() => {
    if (restaurant) {
      loadCustomersData();
    }
  }, [restaurant]);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, sortBy, sortDirection, filterBy, statusFilter]);

  const loadCustomersData = async () => {
    if (!restaurant?.id) return;

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurant.id);

    const { data: customersData, error } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurant.id);

    if (error) {
      console.error('Error loading customers:', error);
      showToast('error', 'Error', 'No se pudieron cargar los clientes');
      return;
    }

    const customerMap = new Map<string, CustomerData>();

    customersData?.forEach((customer) => {
      const customerOrders = ordersData?.filter(o => o.customer_phone === customer.phone) || [];
      const totalOrders = customerOrders.length;
      const totalSpent = customerOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0);
      const lastOrder = customerOrders.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      customerMap.set(customer.phone || '', {
        ...customer,
        totalOrders,
        totalSpent,
        lastOrderDate: lastOrder?.created_at || customer.created_at,
        orderTypes: [...new Set(customerOrders.map(o => o.order_type))],
        isVip: customer.is_vip || false,
      });
    });

    (ordersData || []).forEach((order: any) => {
      if (!order.customer_phone) return;

      if (!customerMap.has(order.customer_phone)) {
        const customerOrders = ordersData?.filter(o => o.customer_phone === order.customer_phone) || [];
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + o.total, 0);

        customerMap.set(order.customer_phone, {
          id: `temp-${order.customer_phone}`,
          restaurant_id: restaurant.id,
          name: order.customer_name || 'Cliente',
          phone: order.customer_phone,
          email: order.customer_email || '',
          address: order.delivery_address || '',
          delivery_instructions: '',
          totalOrders,
          totalSpent,
          lastOrderDate: order.created_at,
          orderTypes: [...new Set(customerOrders.map(o => o.order_type))],
          isVip: false,
          is_vip: false,
          created_at: order.created_at,
          city: '',
          notes: '',
          updated_at: order.created_at,
        });
      }
    });

    setCustomers(Array.from(customerMap.values()));
  };

  const filterAndSortCustomers = () => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply segment filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(customer => {
        switch (filterBy) {
          case 'vip':
            return customer.isVip;
          case 'frequent':
            return customer.totalOrders >= 5;
          case 'regular':
            return customer.totalOrders >= 2 && customer.totalOrders <= 4;
          case 'new':
            return customer.totalOrders === 1 || customer.totalOrders === 0;
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => {
        if (customer.totalOrders === 0) {
          return statusFilter === 'inactive';
        }
        const daysSinceLastOrder = Math.ceil((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
        const isActive = daysSinceLastOrder <= 30;

        if (statusFilter === 'active') {
          return isActive;
        } else if (statusFilter === 'inactive') {
          return !isActive;
        }
        return true;
      });
    }

    // Sort customers
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'orders':
          comparison = a.totalOrders - b.totalOrders;
          break;
        case 'spent':
          comparison = a.totalSpent - b.totalSpent;
          break;
        case 'date':
          comparison = new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredCustomers(filtered);
  };

  const toggleVipStatus = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    if (customer.id.startsWith('temp-')) {
      showToast('warning', t('cannotModify'), 'Primero debes guardar este cliente en la base de datos', 3000);
      return;
    }

    const { error } = await supabase
      .from('customers')
      .update({
        is_vip: !customer.isVip,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (error) {
      console.error('Error updating VIP status:', error);
      showToast('error', 'Error', 'No se pudo actualizar el estado VIP');
      return;
    }

    await loadCustomersData();

    showToast(
      'success',
      customer.isVip ? t('vipCustomerRemoved') : t('vipCustomerAdded'),
      customer.isVip
        ? `${customer.name} ${t('noLongerVipCustomer')}`
        : `${customer.name} ${t('nowVipCustomer')}`,
      4000
    );
  };

  const toggleCustomerSelection = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const handleBulkEdit = () => {
    if (selectedCustomers.size === 0) {
      showToast('warning', t('noSelection'), t('selectAtLeastOneCustomer'), 4000);
      return;
    }
    setShowBulkEditModal(true);
  };

  const handleCreateCustomer = async () => {
    if (!restaurant) return;

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

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('phone', createForm.phone.trim())
      .maybeSingle();

    if (existingCustomer) {
      showToast('warning', t('validationError'), t('customerAlreadyExists'), 3000);
      return;
    }

    const { error } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurant.id,
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || null,
        address: createForm.address.trim() || null,
        delivery_instructions: createForm.delivery_instructions.trim() || '',
        is_vip: createForm.isVip,
      });

    if (error) {
      console.error('Error creating customer:', error);
      showToast('error', 'Error', 'No se pudo crear el cliente');
      return;
    }

    await loadCustomersData();
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      delivery_instructions: '',
      isVip: false,
    });

    showToast('success', 'Cliente creado', `${createForm.name} ha sido agregado exitosamente`, 4000);
  };

  const executeBulkEdit = async () => {
    const selectedCustomersList = customers.filter(c => selectedCustomers.has(c.id));
    const validCustomers = selectedCustomersList.filter(c => !c.id.startsWith('temp-'));

    if (validCustomers.length === 0) {
      showToast('warning', t('cannotModify'), 'Solo puedes editar clientes guardados en la base de datos', 3000);
      setShowBulkEditModal(false);
      return;
    }

    switch (bulkEditAction) {
      case 'vip':
        const { error: vipError } = await supabase
          .from('customers')
          .update({ is_vip: true, updated_at: new Date().toISOString() })
          .in('id', validCustomers.map(c => c.id));

        if (vipError) {
          console.error('Error updating VIP status:', vipError);
          showToast('error', 'Error', 'No se pudo actualizar el estado VIP');
          return;
        }

        await loadCustomersData();
        showToast('success', t('vipAssigned'), `${validCustomers.length} ${t('customerPlural', { count: validCustomers.length })} ${t('markedAsVip', { count: validCustomers.length })}`, 4000);
        break;

      case 'remove_vip':
        const { error: removeVipError } = await supabase
          .from('customers')
          .update({ is_vip: false, updated_at: new Date().toISOString() })
          .in('id', validCustomers.map(c => c.id));

        if (removeVipError) {
          console.error('Error removing VIP status:', removeVipError);
          showToast('error', 'Error', 'No se pudo remover el estado VIP');
          return;
        }

        await loadCustomersData();
        showToast('info', t('vipRemoved'), `${validCustomers.length} ${t('customerPlural', { count: validCustomers.length })} ${t('noLongerVip', { count: validCustomers.length })}`, 4000);
        break;

      case 'delete':
        if (confirm(`${t('confirmDeleteMultiple')} ${validCustomers.length} cliente${validCustomers.length !== 1 ? 's' : ''}? ${t('warningDeleteAction')}`)) {
          const { error: deleteError } = await supabase
            .from('customers')
            .delete()
            .in('id', validCustomers.map(c => c.id));

          if (deleteError) {
            console.error('Error deleting customers:', deleteError);
            showToast('error', 'Error', 'No se pudieron eliminar los clientes');
            return;
          }

          await loadCustomersData();
          showToast('info', t('customersDeleted'), `${validCustomers.length} ${t('customerPlural', { count: validCustomers.length })} ${t('deletedSuccessfully', { count: validCustomers.length })}`, 5000);
        }
        break;
    }

    setSelectedCustomers(new Set());
    setShowBulkEditModal(false);
  };

  const handleEditCustomer = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      delivery_instructions: customer.delivery_instructions || '',
      isVip: customer.isVip,
    });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;

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

    if (editingCustomer.id.startsWith('temp-')) {
      const { error } = await supabase
        .from('customers')
        .insert({
          restaurant_id: restaurant?.id,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim() || null,
          address: editForm.address.trim() || null,
          delivery_instructions: editForm.delivery_instructions.trim() || '',
          is_vip: editForm.isVip,
        });

      if (error) {
        console.error('Error creating customer:', error);
        showToast('error', 'Error', 'No se pudo crear el cliente');
        return;
      }
    } else {
      const { error } = await supabase
        .from('customers')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim() || null,
          address: editForm.address.trim() || null,
          delivery_instructions: editForm.delivery_instructions.trim() || '',
          is_vip: editForm.isVip,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCustomer.id);

      if (error) {
        console.error('Error updating customer:', error);
        showToast('error', 'Error', 'No se pudo actualizar el cliente');
        return;
      }
    }

    await loadCustomersData();
    setShowEditModal(false);
    setEditingCustomer(null);

    showToast(
      'success',
      t('customerUpdated'),
      t('customerInfoUpdatedSuccessfully'),
      4000
    );
  };

  const handleDeleteCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    await deleteCustomerData(customerToDelete);
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  const deleteCustomerData = async (customer: CustomerData) => {
    if (customer.id.startsWith('temp-')) {
      await loadCustomersData();
      showToast('info', t('customerDeleted'), 'Cliente temporal eliminado', 3000);
      return;
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customer.id);

    if (error) {
      console.error('Error deleting customer:', error);
      showToast('error', 'Error', 'No se pudo eliminar el cliente');
      return;
    }

    await loadCustomersData();

    showToast(
      'info',
      t('customerDeleted'),
      t('customerAndOrdersDeleted', { name: customer.name }),
      5000
    );
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

  const getCustomerSegment = (totalSpent: number, totalOrders: number) => {
    const segments = [];

    if (totalOrders === 0 || totalOrders === 1) {
      segments.push(<Badge key="new" variant="info">{t('newCustomer')}</Badge>);
    } else if (totalOrders >= 2 && totalOrders <= 4) {
      segments.push(<Badge key="regular" variant="gray">{t('regular')}</Badge>);
    } else if (totalOrders >= 5) {
      segments.push(<Badge key="frequent" variant="warning">{t('frequent')}</Badge>);
    }

    return (
      <div className="flex flex-wrap gap-1">
        {segments}
      </div>
    );
  };

  const exportToCSV = () => {
    // Usar los clientes filtrados actuales
    const dataToExport = filteredCustomers;
    
    if (dataToExport.length === 0) {
      showToast(
        'warning',
        t('noDataToExport'),
        t('noCustomersMatchFilters'),
        4000
      );
      return;
    }

    // Definir las columnas del CSV
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
      t('segment'),
      t('lastOrder'),
      t('deliveryInstructions')
    ];

    // Función para obtener el segmento como texto
    const getSegmentText = (totalOrders: number, isVip: boolean) => {
      const segments = [];
      
      if (isVip) segments.push('VIP');
      
      if (totalOrders === 1) {
        segments.push(t('new'));
      } else if (totalOrders >= 2 && totalOrders <= 4) {
        segments.push(t('regular'));
      } else if (totalOrders >= 5) {
        segments.push(t('frequent'));
      }
      
      return segments.join(', ');
    };

    // Convertir datos a formato CSV
    const csvData = dataToExport.map(customer => [
      customer.name,
      customer.phone,
      customer.email || '',
      customer.address || '',
      customer.totalOrders,
      formatCurrency(customer.totalSpent, currency),
      formatCurrency(customer.totalSpent / customer.totalOrders, currency),
      customer.orderTypes.join(', '),
      customer.isVip ? t('yes') : t('no'),
      getSegmentText(customer.totalOrders, customer.isVip),
      new Date(customer.lastOrderDate).toLocaleDateString(),
      customer.delivery_instructions || ''
    ]);

    // Crear contenido CSV con punto y coma como delimitador
    const delimiter = ';';
    const BOM = '\uFEFF';
    const csvContent = [
      headers.join(delimiter),
      ...csvData.map(row =>
        row.map(field =>
          // Escapar comillas y envolver en comillas si contiene el delimitador, saltos de línea o comillas
          typeof field === 'string' && (field.includes(delimiter) || field.includes('\n') || field.includes('"'))
            ? `"${field.replace(/"/g, '""')}"`
            : field
        ).join(delimiter)
      )
    ].join('\n');

    // Crear y descargar archivo con BOM para UTF-8
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generar nombre de archivo con fecha y filtros aplicados
      const today = new Date().toISOString().split('T')[0];
      let fileName = `${t('customers')}_${restaurant?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${today}`;
      
      // Añadir información de filtros al nombre
      if (searchTerm) {
        fileName += `_${t('search')}_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      if (filterBy !== 'all') {
        fileName += `_${filterBy}`;
      }
      if (statusFilter !== 'all') {
        fileName += `_${statusFilter}`;
      }
      
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(
      'success',
      t('csvExported'),
      t('exportedSuccessfullyPlural'
        
        , { count: dataToExport.length }),
      4000
    );
  };

  const downloadCSVTemplate = () => {
    const headers = [
      t('name'),
      t('phone'),
      t('email'),
      t('address'),
      t('deliveryInstructions'),
      t('isVip')
    ];

    const exampleRows = [
      [
        'Juan Pérez',
        '+573001234567',
        'juan.perez@email.com',
        'Calle 123 #45-67 Bogotá',
        t('exampleDeliveryInstruction1'),
        t('yes')
      ],
      [
        'María González',
        '+573009876543',
        'maria.gonzalez@email.com',
        'Carrera 45 #12-34 Medellín',
        t('exampleDeliveryInstruction2'),
        t('no')
      ]
    ];

    const delimiter = ';';

    const csvContent = [
      headers.join(delimiter),
      ...exampleRows.map(row =>
        row.map(field =>
          typeof field === 'string' && (field.includes(delimiter) || field.includes('\n') || field.includes('"'))
            ? `"${field.replace(/"/g, '""')}"`
            : field
        ).join(delimiter)
      )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${t('customersTemplate')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(
      'success',
      t('templateDownloaded'),
      t('useTemplateAsGuide'),
      4000
    );
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

    reader.onerror = () => {
      showToast('error', t('readError'), t('couldNotReadFile'), 4000);
    };

    reader.readAsText(file, 'UTF-8');
  };

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
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      setImportErrors([t('missingRequiredColumns', { columns: missingHeaders.join(', '), found: headers.join(', ') })]);
      setShowImportModal(true);
      return;
    }

    const errors: string[] = [];
    const preview: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line, delimiter);

      if (values.length !== headers.length) {
        errors.push(t('lineIncorrectColumns', { line: i + 1, expected: headers.length, got: values.length, values: values.join(' | ') }));
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      if (!row[t('name')] || !row[t('name')].trim()) {
        errors.push(t('lineNameRequired', { line: i + 1 }));
        continue;
      }

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(row[t('name')].trim())) {
        errors.push(t('lineNameOnlyLetters', { line: i + 1, name: row[t('name')] }));
        continue;
      }

      if (!row[t('phone')] || !row[t('phone')].trim()) {
        errors.push(t('linePhoneRequired', { line: i + 1 }));
        continue;
      }

      if (!/^[\d+\s()-]+$/.test(row[t('phone')].trim())) {
        errors.push(t('linePhoneOnlyNumbers', { line: i + 1, phone: row[t('phone')] }));
        continue;
      }

      if (row[t('email')] && row[t('email')].trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[t('email')].trim())) {
        errors.push(t('lineEmailInvalidFormat', { line: i + 1, email: row[t('email')] }));
        continue;
      }

      const existingCustomer = customers.find(c => c.phone === row[t('phone')]);
      if (existingCustomer) {
        errors.push(t('lineCustomerAlreadyExists', { line: i + 1, phone: row[t('phone')] }));
        continue;
      }

      preview.push({
        name: row[t('name')],
        phone: row[t('phone')],
        email: row[t('email')] || '',
        address: row[t('address')] || '',
        delivery_instructions: row[t('deliveryInstructions')] || '',
        isVip: row[t('isVip')]?.toLowerCase() === t('yes').toLowerCase() || row[t('isVip')]?.toLowerCase() === 'yes',
        lineNumber: i + 1
      });
    }

    setImportErrors(errors);
    setImportPreview(preview);
    setShowImportModal(true);

    if (preview.length === 0 && errors.length === 0) {
      showToast('error', t('noData'), t('fileContainsNoData'), 4000);
    } else if (preview.length === 0 && errors.length > 0) {
      showToast('error', t('validationErrors'), t('errorsFoundReview', { count: errors.length }), 5000);
    } else if (preview.length > 0 && errors.length > 0) {
      showToast('warning', t('partialImport'), t('validRecordsAndErrors', { valid: preview.length, errors: errors.length }), 5000);
    } else {
      showToast('success', t('dataValidated'), t('customersReadyToImport', { count: preview.length }), 3000);
    }
  };

  const executeImport = async () => {
    if (importPreview.length === 0) return;

    const customersToInsert = importPreview.map((customer) => ({
      restaurant_id: restaurant?.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address || null,
      delivery_instructions: customer.delivery_instructions || '',
      is_vip: customer.isVip,
    }));

    const { error } = await supabase
      .from('customers')
      .insert(customersToInsert);

    if (error) {
      console.error('Error importing customers:', error);
      showToast('error', 'Error', 'No se pudieron importar los clientes');
      return;
    }

    await loadCustomersData();

    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    showToast(
      'success',
      t('importSuccessful'),
      t('customersImportedSuccessfully', { count: importPreview.length }),
      4000
    );
  };

  const cancelImport = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const stats = {
    totalCustomers: customers.length,
    vipCustomers: customers.filter(c => c.isVip).length,
    frequentCustomers: customers.filter(c => c.totalOrders >= 5).length,
    regularCustomers: customers.filter(c => c.totalOrders >= 2 && c.totalOrders <= 4).length,
    newCustomers: customers.filter(c => c.totalOrders === 1 || c.totalOrders === 0).length,
    activeCustomers: customers.filter(c => {
      const daysSinceLastOrder = Math.ceil((new Date().getTime() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastOrder <= 30;
    }).length,
    inactiveCustomers: customers.filter(c => {
      const daysSinceLastOrder = Math.ceil((new Date().getTime() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastOrder > 30;
    }).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    averageSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0,
    topCustomerSpent: customers.length > 0 ? Math.max(...customers.map(c => c.totalSpent)) : 0,
    totalOrders: customers.reduce((sum, c) => sum + c.totalOrders, 0),
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
  {/* Título */}
  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
    {t('customerManagement')}
  </h1>

  {/* Botones */}
  <div className="flex flex-wrap justify-start md:justify-end gap-2 w-full md:w-auto">
    {selectedCustomers.size > 0 && (
    <Button
      variant="outline"
      size="sm"
      icon={Users}
      onClick={handleBulkEdit}
      className="bg-purple-600 text-white hover:bg-purple-700 transition-colors"
    >
      {t('edit')} {selectedCustomers.size}{' '}
      {t('selectedPlural', { count: selectedCustomers.size })}
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
    <input
      ref={fileInputRef}
      type="file"
      accept=".csv"
      onChange={handleImportFile}
      className="hidden"
    />
    <Button
      variant="outline"
      size="sm"
      icon={Filter}
      onClick={() => setShowFilters(!showFilters)}
      className={
        (showFilters
          ? 'bg-gray-700 text-white'
          : 'bg-gray-600 text-white') +
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
              <p className="text-3xl font-bold text-blue-900">{stats.totalCustomers}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-blue-200">
            <span className="text-xs text-blue-700 font-medium">{t('customerBase')}</span>
            <span className="text-sm font-bold text-blue-800">
              {stats.newCustomers} {t('new')}
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
              <p className="text-3xl font-bold text-purple-900">{stats.vipCustomers}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-purple-200">
            <span className="text-xs text-purple-700 font-medium">{t('assignedManually')}</span>
            <span className="text-sm font-bold text-purple-800">
              {((stats.vipCustomers / stats.totalCustomers) * 100 || 0).toFixed(1)}%
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
              <p className="text-3xl font-bold text-green-900">{stats.frequentCustomers}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-green-200">
            <span className="text-xs text-green-700 font-medium">{t('ordersPlus')}</span>
            <span className="text-sm font-bold text-green-800">
              {((stats.frequentCustomers / stats.totalCustomers) * 100 || 0).toFixed(1)}%
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
              <p className="text-3xl font-bold text-orange-900">{formatCurrency(stats.averageSpent, currency)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-orange-200">
            <span className="text-xs text-orange-700 font-medium">{t('perCustomer')}</span>
            <span className="text-sm font-bold text-green-700">
              {formatCurrency(stats.totalRevenue, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Filters and Search */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          {/* Search Bar */}
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
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
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
            
            {/* Segment Filter */}
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
            
            {/* Sort Filter */}
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
            
            {/* Sort Direction Arrow Button */}
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

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {customers.length === 0 ? t('noRegisteredCustomers') : t('noCustomersFound')}
          </h3>
          <p className="text-gray-600">
            {customers.length === 0 
              ? t('customersWillAppear')
              : t('tryDifferentSearch')
            }
          </p>
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
                      checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
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
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block bg-white text-gray-800 text-xs rounded-lg p-3 w-64 shadow-xl border border-gray-200 z-50">
                        <div className="space-y-1">
                          <div><strong className="text-green-600">VIP:</strong> {t('segmentVipDescription')}</div>
                          <div><strong className="text-blue-600">{t('new')}:</strong> {t('segmentNewDescription')}</div>
                          <div><strong className="text-gray-600">{t('regular')}:</strong> {t('segmentRegularDescription')}</div>
                          <div><strong className="text-orange-600">{t('frequent')}:</strong> {t('segmentFrequentDescription')}</div>
                          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                            {t('segmentNote')}
                          </div>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                      </div>
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
                {filteredCustomers.map((customer) => (
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
                              {customer.address.substring(0, 30)}...
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
                      <div className="text-sm font-medium text-gray-900">
                        {customer.totalOrders}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('orders')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(customer.totalSpent, currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(customer.totalSpent / customer.totalOrders, currency)} {t('avg')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {customer.orderTypes.map(type => (
                          <div key={type}>
                            {getOrderTypeBadge(type)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {customer.isVip && <Badge variant="success">VIP</Badge>}
                        {getCustomerSegment(customer.totalSpent, customer.totalOrders)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEditCustomer(customer)}
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
        </div>
      )}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={t('editCustomer')}
        size="lg"
      >
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
            <Button
              variant="ghost"
              onClick={handleCloseEditModal}
            >
              {t('cancel')}
            </Button>
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
            <Button
              onClick={handleSaveCustomer}
              disabled={!editForm.name.trim() || !editForm.phone.trim()}
            >
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({
            name: '',
            phone: '',
            email: '',
            address: '',
            delivery_instructions: '',
            isVip: false,
          });
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('deliveryInstructions')}
            </label>
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
            <label className="text-sm font-medium text-gray-700">
              {t('vipCustomer')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm({
                  name: '',
                  phone: '',
                  email: '',
                  address: '',
                  delivery_instructions: '',
                  isVip: false,
                });
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={!createForm.name.trim() || !createForm.phone.trim()}
            >
              {t('create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCustomerToDelete(null);
        }}
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
              <p className="text-gray-600 mb-4">
                {t('actionWillDeletePermanently')}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• {t('allCustomerInfo')}</li>
                  <li>• {customerToDelete.totalOrders} {t('orders', { count: customerToDelete.totalOrders })} </li>
                  <li>• {t('purchaseHistory')} ({formatCurrency(customerToDelete.totalSpent, currency)})</li>
                  {customerToDelete.isVip && <li>• {t('customerVipStatus')}</li>}
                </ul>
              </div>
              <p className="text-sm text-gray-500">
                <strong>{t('actionCannotBeUndone')}</strong>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCustomerToDelete(null);
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteCustomer}
                icon={Trash2}
              >
                {t('deleteCustomer')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        isOpen={showBulkEditModal}
        onClose={() => {
          setShowBulkEditModal(false);
          setBulkEditAction('vip');
        }}
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
            <Button
              variant="ghost"
              onClick={() => {
                setShowBulkEditModal(false);
                setBulkEditAction('vip');
              }}
            >
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
      <Modal
        isOpen={showImportModal}
        onClose={cancelImport}
        title={t('importCustomersFromCSV')}
        size="lg"
      >
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
                <button
                  onClick={downloadCSVTemplate}
                  className="mt-3 text-xs font-medium text-blue-700 hover:text-blue-800 underline"
                >
                  {t('downloadExampleTemplate')}
                </button>
              </div>
            </div>
          </div>

          {importErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-2">{t('errorsFound', { count: importErrors.length })}</p>
                  <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {importErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {importPreview.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {t('preview')}: {importPreview.length} {t('customerPlural', { count: importPreview.length })} {t('validPlural', { count: importPreview.length })}
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {importPreview.map((customer, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{customer.name}</span>
                            {customer.isVip && <Badge variant="success" size="sm">VIP</Badge>}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {customer.address}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{t('line')} {customer.lineNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={cancelImport}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={executeImport}
              disabled={importPreview.length === 0}
              icon={Upload}
            >
              {t('import')} {importPreview.length} {t('customerPlural', { count: importPreview.length })}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};