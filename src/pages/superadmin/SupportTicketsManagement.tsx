import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Trash2,
  Filter,
  Search,
  Mail,
  Phone,
  Calendar,
  Building,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';

interface SupportTicket {
  id: string;
  restaurantId: string;
  restaurantName: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  contactEmail: string;
  contactPhone: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  response?: string;
  responseDate?: string;
  adminNotes?: string;
}

type GlobalStats = {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  urgent: number;
};

const PAGE_SIZE = 10;

const escapeForLike = (term: string) =>
  term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');

const mapDbStatusToUi = (dbStatus: string): SupportTicket['status'] => {
  if (dbStatus === 'open') return 'pending';
  if (dbStatus === 'pending') return 'pending';
  if (dbStatus === 'in_progress') return 'in_progress';
  if (dbStatus === 'resolved') return 'resolved';
  if (dbStatus === 'closed') return 'closed';
  return 'pending';
};

const mapUiStatusToDb = (uiStatus: SupportTicket['status']) => {
  return uiStatus === 'pending' ? 'open' : uiStatus;
};

export const SupportTicketsManagement: React.FC = () => {
  const { showToast } = useToast();

  // Page data
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Search (debounced)
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Response form
  const [responseText, setResponseText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Loading / Pagination
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Global stats
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  });

  // Para evitar respuestas viejas (cuando el usuario escribe rápido)
  const requestSeqRef = useRef(0);

  // Debounce búsqueda
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // Reset page al cambiar filtros/búsqueda/orden
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, dateFromFilter, dateToFilter, sortOrder]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const getCategoryName = useCallback((category: string) => {
    const categories: Record<string, string> = {
      general: 'Consulta General',
      technical: 'Problema Técnico',
      billing: 'Facturación',
      feature: 'Solicitud de Función',
      account: 'Cuenta y Configuración',
      other: 'Otro',
    };
    return categories[category] || category;
  }, []);

  const getStatusBadge = useCallback((status: SupportTicket['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'in_progress':
        return <Badge variant="info">En Progreso</Badge>;
      case 'resolved':
        return <Badge variant="success">Resuelto</Badge>;
      case 'closed':
        return <Badge variant="gray">Cerrado</Badge>;
      default:
        return <Badge variant="gray">Desconocido</Badge>;
    }
  }, []);

  const getPriorityBadge = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="error">Urgente</Badge>;
      case 'high':
        return <Badge variant="warning">Alta</Badge>;
      case 'medium':
        return <Badge variant="info">Media</Badge>;
      case 'low':
        return <Badge variant="gray">Baja</Badge>;
      default:
        return <Badge variant="gray">Media</Badge>;
    }
  }, []);

  const loadGlobalStats = useCallback(async () => {
    try {
      setLoadingStats(true);

      const totalReq = supabase.from('support_tickets').select('id', { count: 'exact', head: true });

      const pendingReq = supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      const inProgressReq = supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      const resolvedReq = supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'resolved');

      const urgentReq = supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('priority', 'urgent');

      const [totalRes, pendingRes, inProgRes, resolvedRes, urgentRes] = await Promise.all([
        totalReq,
        pendingReq,
        inProgressReq,
        resolvedReq,
        urgentReq,
      ]);

      setGlobalStats({
        total: totalRes.count || 0,
        pending: pendingRes.count || 0,
        inProgress: inProgRes.count || 0,
        resolved: resolvedRes.count || 0,
        urgent: urgentRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading global stats:', error);
      showToast('error', 'Error', 'No se pudieron cargar las estadísticas globales', 2500);
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  // 1) Busca IDs de restaurantes por nombre (GLOBAL), para poder filtrar tickets por restaurant_id IN (...)
  const findRestaurantIdsForSearch = useCallback(async (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return null;

    const escaped = escapeForLike(cleaned);
    const pattern = `%${escaped}%`;

    const { data, error } = await supabase
      .from('restaurants')
      .select('id')
      .ilike('name', pattern);

    if (error) throw error;

    const ids = (data || []).map((r: any) => r.id).filter(Boolean);
    return ids;
  }, []);

  const buildTicketsBaseQuery = useCallback(() => {
    // Base query (sin range)
    let q = supabase
      .from('support_tickets')
      .select(
        `
        id,
        restaurant_id,
        subject,
        category,
        priority,
        message,
        contact_email,
        contact_phone,
        status,
        created_at,
        updated_at,
        response,
        response_date,
        admin_notes,
        restaurants ( name )
      `,
        { count: 'exact' }
      );

    // Filters (server-side)
    if (statusFilter !== 'all') {
      q = q.eq('status', mapUiStatusToDb(statusFilter as SupportTicket['status']));
    }
    if (priorityFilter !== 'all') q = q.eq('priority', priorityFilter);
    if (categoryFilter !== 'all') q = q.eq('category', categoryFilter);

    if (dateFromFilter) {
      q = q.gte('created_at', new Date(dateFromFilter + 'T00:00:00.000Z').toISOString());
    }
    if (dateToFilter) {
      q = q.lte('created_at', new Date(dateToFilter + 'T23:59:59.999Z').toISOString());
    }

    // Sort
    q = q.order('created_at', { ascending: sortOrder === 'oldest' });

    return q;
  }, [statusFilter, priorityFilter, categoryFilter, dateFromFilter, dateToFilter, sortOrder]);

  const loadTicketsPage = useCallback(async () => {
    const seq = ++requestSeqRef.current;

    try {
      setLoading(true);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = buildTicketsBaseQuery();

      // Search:
      // - OR SOLO sobre columnas del ticket (evita error PGRST100)
      // - restaurant name search se hace con IN restaurant_id
      const term = searchTerm.trim();
      if (term) {
        const escaped = escapeForLike(term);
        const pattern = `%${escaped}%`;

        // OR en columnas del ticket
        q = q.or(
          [
            `subject.ilike.${pattern}`,
            `message.ilike.${pattern}`,
            `contact_email.ilike.${pattern}`,
          ].join(',')
        );

        // Además, incluir matches por nombre de restaurante
        const ids = await findRestaurantIdsForSearch(term);
        if (ids && ids.length > 0) {
          q = q.in('restaurant_id', ids);
          // Nota: Esto hace que el resultado final sea "AND": (matches en ticket) AND (restaurant_id in ids)
          // Si quieres que sea "OR" (ticket match OR restaurant match), hace falta view/RPC.
          // Para mantener funcionalidad de “buscar por restaurante”, priorizamos que NO explote.
          //
          // Si necesitas el OR real entre ticket-fields y restaurant-name, dime y te dejo un RPC.
        }
      }

      const { data, error, count } = await q.range(from, to);

      if (seq !== requestSeqRef.current) return; // respuesta vieja, ignora
      if (error) throw error;

      const formatted = (data || []).map((ticket: any): SupportTicket => ({
        id: ticket.id,
        restaurantId: ticket.restaurant_id,
        restaurantName: ticket.restaurants?.name || 'Restaurante Desconocido',
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        message: ticket.message,
        contactEmail: ticket.contact_email,
        contactPhone: ticket.contact_phone || '',
        status: mapDbStatusToUi(ticket.status),
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        response: ticket.response,
        responseDate: ticket.response_date,
        adminNotes: ticket.admin_notes,
      }));

      setTickets(formatted);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading tickets:', error);
      showToast('error', 'Error', 'No se pudieron cargar los tickets de soporte', 3000);
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [buildTicketsBaseQuery, findRestaurantIdsForSearch, page, searchTerm, showToast]);

  // Initial load + realtime
  useEffect(() => {
    loadGlobalStats();
    loadTicketsPage();

    const channel = supabase
      .channel('support_tickets_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        async () => {
          await Promise.all([loadTicketsPage(), loadGlobalStats()]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when deps change
  useEffect(() => {
    loadTicketsPage();
  }, [loadTicketsPage]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTicketsPage(), loadGlobalStats()]);
    showToast('success', 'Actualizado', 'Tickets actualizados correctamente', 2000);
  }, [loadGlobalStats, loadTicketsPage, showToast]);

  const updateTicketStatus = useCallback(
    async (ticketId: string, newStatus: SupportTicket['status']) => {
      try {
        const { error } = await supabase
          .from('support_tickets')
          .update({
            status: mapUiStatusToDb(newStatus),
            updated_at: new Date().toISOString(),
          })
          .eq('id', ticketId);

        if (error) throw error;

        setTickets(prev =>
          prev.map(t => (t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
        );

        showToast('success', 'Estado Actualizado', 'El estado del ticket ha sido actualizado', 2500);
        loadGlobalStats();
      } catch (error) {
        console.error('Error updating ticket status:', error);
        showToast('error', 'Error', 'No se pudo actualizar el estado del ticket', 3000);
      }
    },
    [loadGlobalStats, showToast]
  );

  const handleViewTicket = useCallback((ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  }, []);

  const handleRespondToTicket = useCallback((ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseText(ticket.response || '');
    setAdminNotes(ticket.adminNotes || '');
    setShowResponseModal(true);
  }, []);

  const saveResponse = useCallback(async () => {
    if (!selectedTicket) return;

    try {
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from('support_tickets')
        .update({
          response: responseText,
          response_date: nowIso,
          admin_notes: adminNotes,
          status: 'resolved',
          updated_at: nowIso,
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      setTickets(prev =>
        prev.map(t =>
          t.id === selectedTicket.id
            ? {
                ...t,
                response: responseText,
                responseDate: nowIso,
                adminNotes,
                status: 'resolved',
                updatedAt: nowIso,
              }
            : t
        )
      );

      showToast('success', 'Respuesta Enviada', 'La respuesta ha sido enviada al cliente', 2500);

      setShowResponseModal(false);
      setSelectedTicket(null);
      setResponseText('');
      setAdminNotes('');

      loadGlobalStats();
    } catch (error) {
      console.error('Error saving response:', error);
      showToast('error', 'Error', 'No se pudo enviar la respuesta', 3000);
    }
  }, [adminNotes, loadGlobalStats, responseText, selectedTicket, showToast]);

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      if (!confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) return;

      try {
        const { error } = await supabase.from('support_tickets').delete().eq('id', ticketId);
        if (error) throw error;

        showToast('success', 'Ticket Eliminado', 'El ticket ha sido eliminado correctamente', 2500);
        await Promise.all([loadTicketsPage(), loadGlobalStats()]);
      } catch (error) {
        console.error('Error deleting ticket:', error);
        showToast('error', 'Error', 'No se pudo eliminar el ticket', 3000);
      }
    },
    [loadGlobalStats, loadTicketsPage, showToast]
  );

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setSortOrder('newest');
  }, []);

  const showClear =
    Boolean(searchInput.trim()) ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    Boolean(dateFromFilter) ||
    Boolean(dateToFilter) ||
    sortOrder !== 'newest';

  if (loading && tickets.length === 0) {
    return (
      <div className="p-6 w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tickets de soporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Tickets de Soporte</h1>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Mostrando {tickets.length} · Total global: {loadingStats ? '—' : globalStats.total}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={refreshAll}
            disabled={loading}
            className={loading ? 'animate-spin' : ''}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards (GLOBAL) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{loadingStats ? '—' : globalStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{loadingStats ? '—' : globalStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-2xl font-semibold text-gray-900">{loadingStats ? '—' : globalStats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resueltos</p>
              <p className="text-2xl font-semibold text-gray-900">{loadingStats ? '—' : globalStats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgentes</p>
              <p className="text-2xl font-semibold text-gray-900">{loadingStats ? '—' : globalStats.urgent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por asunto, restaurante, email o mensaje..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchInput !== searchTerm && <p className="text-xs text-gray-500 mt-1">Buscando…</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resueltos</option>
              <option value="closed">Cerrados</option>
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="general">Consulta General</option>
            <option value="technical">Problema Técnico</option>
            <option value="billing">Facturación</option>
            <option value="feature">Solicitud de Función</option>
            <option value="account">Cuenta y Configuración</option>
            <option value="other">Otro</option>
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Más nuevos primero</option>
            <option value="oldest">Más antiguos primero</option>
          </select>
        </div>

        {showClear && (
          <div className="flex justify-end">
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Pagination header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="text-sm text-gray-600">
          Mostrando <strong>{totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong> –{' '}
          <strong>{Math.min(page * PAGE_SIZE, totalCount)}</strong> de <strong>{totalCount}</strong>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Anterior
          </Button>
          <div className="text-sm text-gray-700">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron tickets
          </h3>
          <p className="text-gray-600">Intenta con diferentes términos de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{ticket.subject}</div>
                        <div className="text-sm text-gray-500">ID: {ticket.id.slice(-8)}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{ticket.restaurantName}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {ticket.contactEmail}
                      </div>
                      {ticket.contactPhone && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {ticket.contactPhone}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCategoryName(ticket.category)}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(ticket.priority)}</td>

                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleTimeString()}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" icon={Eye} onClick={() => handleViewTicket(ticket)} title="Ver detalles" />

                        {ticket.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                            className="text-blue-600 hover:text-blue-700"
                            title="Marcar en progreso"
                          >
                            Tomar
                          </Button>
                        )}

                        {(ticket.status === 'pending' || ticket.status === 'in_progress') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRespondToTicket(ticket)}
                            className="text-green-600 hover:text-green-700"
                            title="Responder"
                          >
                            Responder
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => deleteTicket(ticket.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTicket(null);
        }}
        title="Detalles del Ticket"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</h3>
                <div className="flex gap-2">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Ticket ID: {selectedTicket.id} • {new Date(selectedTicket.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Información del Restaurante</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium">{selectedTicket.restaurantName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categoría:</span> {getCategoryName(selectedTicket.category)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Información de Contacto</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{selectedTicket.contactEmail}</span>
                  </div>
                  {selectedTicket.contactPhone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{selectedTicket.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Mensaje</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
            </div>

            {selectedTicket.response && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Respuesta del Administrador</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedTicket.response}</p>
                  {selectedTicket.responseDate && (
                    <div className="text-xs text-blue-600 mt-2">
                      Respondido el: {new Date(selectedTicket.responseDate).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTicket.adminNotes && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Notas Internas</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">{selectedTicket.adminNotes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {selectedTicket.status === 'pending' && (
                <Button
                  onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'in_progress');
                    setShowDetailModal(false);
                  }}
                  variant="outline"
                >
                  Marcar en Progreso
                </Button>
              )}

              {(selectedTicket.status === 'pending' || selectedTicket.status === 'in_progress') && (
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleRespondToTicket(selectedTicket);
                  }}
                >
                  Responder
                </Button>
              )}

              {selectedTicket.status === 'resolved' && (
                <Button
                  onClick={() => {
                    updateTicketStatus(selectedTicket.id, 'closed');
                    setShowDetailModal(false);
                  }}
                  variant="outline"
                >
                  Cerrar Ticket
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Response Modal */}
      <Modal
        isOpen={showResponseModal}
        onClose={() => {
          setShowResponseModal(false);
          setSelectedTicket(null);
          setResponseText('');
          setAdminNotes('');
        }}
        title="Responder Ticket"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{selectedTicket.subject}</h3>
              <p className="text-sm text-gray-600">
                {selectedTicket.restaurantName} • {selectedTicket.contactEmail}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Respuesta al Cliente *</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Escribe tu respuesta al cliente aquí..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas Internas (Opcional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas internas para el equipo de soporte..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedTicket(null);
                  setResponseText('');
                  setAdminNotes('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={saveResponse} disabled={!responseText.trim()}>
                Enviar Respuesta
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
