import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, Clock, AlertTriangle, CheckCircle, Eye, Trash2, Filter, Search, Mail, Phone, Calendar, User, Building, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
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

export const SupportTicketsManagement: React.FC = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [responseText, setResponseText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();

    const channel = supabase
      .channel('support_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, dateFromFilter, dateToFilter, sortOrder]);

  const loadTickets = async () => {
    try {
      const wasInitialLoad = loading && tickets.length === 0;
      if (wasInitialLoad) {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          restaurants (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets = (data || []).map((ticket: any) => ({
        id: ticket.id,
        restaurantId: ticket.restaurant_id,
        restaurantName: ticket.restaurants?.name || 'Restaurante Desconocido',
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        message: ticket.message,
        contactEmail: ticket.contact_email,
        contactPhone: ticket.contact_phone || '',
        status: ticket.status === 'open' ? 'pending' : ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        response: ticket.response,
        responseDate: ticket.response_date,
        adminNotes: ticket.admin_notes,
      }));

      setTickets(formattedTickets);

      if (!wasInitialLoad) {
        showToast('success', 'Actualizado', 'Tickets actualizados correctamente', 2000);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      showToast('error', 'Error', 'No se pudieron cargar los tickets de soporte', 3000);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets.filter(ticket => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

      // Date filtering
      const ticketDate = new Date(ticket.createdAt);
      const matchesDateFrom = !dateFromFilter || ticketDate >= new Date(dateFromFilter + 'T00:00:00');
      const matchesDateTo = !dateToFilter || ticketDate <= new Date(dateToFilter + 'T23:59:59');

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDateFrom && matchesDateTo;
    });

    // Sort based on user selection
    filtered.sort((a, b) => {
      // Apply sort order based on user selection
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      if (sortOrder === 'newest') {
        return bTime - aTime; // Newer first
      } else {
        return aTime - bTime; // Older first
      }
    });

    setFilteredTickets(filtered);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus === 'pending' ? 'open' : newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
          : ticket
      );
      setTickets(updatedTickets);
      showToast('success', 'Estado Actualizado', 'El estado del ticket ha sido actualizado', 3000);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showToast('error', 'Error', 'No se pudo actualizar el estado del ticket', 3000);
    }
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleRespondToTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseText(ticket.response || '');
    setAdminNotes(ticket.adminNotes || '');
    setShowResponseModal(true);
  };

  const saveResponse = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          response: responseText,
          response_date: new Date().toISOString(),
          admin_notes: adminNotes,
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      const updatedTickets = tickets.map(ticket =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              response: responseText,
              responseDate: new Date().toISOString(),
              adminNotes: adminNotes,
              status: 'resolved' as const,
              updatedAt: new Date().toISOString()
            }
          : ticket
      );

      setTickets(updatedTickets);
      showToast('success', 'Respuesta Enviada', 'La respuesta ha sido enviada al cliente', 3000);
      setShowResponseModal(false);
      setSelectedTicket(null);
      setResponseText('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error saving response:', error);
      showToast('error', 'Error', 'No se pudo enviar la respuesta', 3000);
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      const updatedTickets = tickets.filter(ticket => ticket.id !== ticketId);
      setTickets(updatedTickets);
      showToast('success', 'Ticket Eliminado', 'El ticket ha sido eliminado correctamente', 3000);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showToast('error', 'Error', 'No se pudo eliminar el ticket', 3000);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
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
  };

  const getPriorityBadge = (priority: string) => {
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
  };

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      general: 'Consulta General',
      technical: 'Problema Técnico',
      billing: 'Facturación',
      feature: 'Solicitud de Función',
      account: 'Cuenta y Configuración',
      other: 'Otro'
    };
    return categories[category] || category;
  };

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  };

  if (loading) {
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
            {filteredTickets.length} de {tickets.length} tickets
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadTickets}
            disabled={loading}
            className={loading ? 'animate-spin' : ''}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resueltos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgentes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.urgent}</p>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
              placeholder="Desde"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              placeholder="Hasta"
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

        {(dateFromFilter || dateToFilter || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setDateFromFilter('');
                setDateToFilter('');
                setSortOrder('newest');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {tickets.length === 0 ? 'No hay tickets de soporte' : 'No se encontraron tickets'}
          </h3>
          <p className="text-gray-600">
            {tickets.length === 0 
              ? 'Los tickets de soporte aparecerán aquí cuando los restaurantes envíen consultas.'
              : 'Intenta con diferentes términos de búsqueda o filtros.'
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
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {ticket.subject}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {ticket.id.slice(-8)}
                        </div>
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
                      <div className="text-sm text-gray-900">
                        {getCategoryName(ticket.category)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewTicket(ticket)}
                          title="Ver detalles"
                        />
                        
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
            {/* Header */}
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

            {/* Restaurant and Contact Info */}
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

            {/* Message */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Mensaje</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
            </div>

            {/* Response */}
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

            {/* Admin Notes */}
            {selectedTicket.adminNotes && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Notas Internas</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">{selectedTicket.adminNotes}</p>
                </div>
              </div>
            )}

            {/* Actions */}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Respuesta al Cliente *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Internas (Opcional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas internas para el equipo de soporte..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium mb-2">Información del ticket:</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <p><strong>Mensaje original:</strong></p>
                <p className="bg-white p-2 rounded border text-gray-700 text-xs max-h-20 overflow-y-auto">
                  {selectedTicket.message}
                </p>
              </div>
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
              <Button
                onClick={saveResponse}
                disabled={!responseText.trim()}
              >
                Enviar Respuesta
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};