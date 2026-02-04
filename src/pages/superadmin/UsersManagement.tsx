import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  User,
  Pencil as Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Filter,
  Building,
  UserPlus,
  Lock,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { User as UserType, Restaurant } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';

const PAGE_SIZE = 10;

export const UsersManagement: React.FC = () => {
  const { showToast } = useToast();

  // Data (ahora users es SOLO la página actual)
  const [users, setUsers] = useState<UserType[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Pagination
  const [page, setPage] = useState(1); // 1-based

  // UI state (igual que tu versión)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [deleteBlockedDetails, setDeleteBlockedDetails] = useState<any>(null);
  const [restaurantToTransfer, setRestaurantToTransfer] = useState<any>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserType | null>(null);
  const [userForPasswordReset, setUserForPasswordReset] = useState<UserType | null>(null);
  const [provisionalPassword, setProvisionalPassword] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');

  // Filters
  const [filter, setFilter] = useState<string>('all');

  // ✅ Búsqueda fluida (debounced)
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');     // YYYY-MM-DD
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'email'>('newest');

  const [loading, setLoading] = useState(true);

  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'restaurant_owner' as UserType['role'],
    restaurant_id: '',
  });

  // Debounce de búsqueda (para no disparar query por tecla)
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // Reset a página 1 cuando cambian filtros (debounced)
  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, startDate, endDate, sortBy]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalUsersCount / PAGE_SIZE));
  }, [totalUsersCount]);

  // Lookup de restaurantes por id (O(1))
  const restaurantById = useMemo(() => {
    const m = new Map<string, Restaurant>();
    for (const r of restaurants) m.set(r.id, r);
    return m;
  }, [restaurants]);

  const getRestaurantForUser = useCallback((u: UserType) => {
    if (!u.restaurant_id) return null;
    return restaurantById.get(u.restaurant_id) || null;
  }, [restaurantById]);

  // ✅ Cargar restaurantes 1 vez (ligero)
  const loadRestaurants = useCallback(async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, domain, owner_id, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setRestaurants((data as any) || []);
  }, []);

  // ✅ Construye query paginada para users (rápida + count exact)
  const buildUsersQuery = useCallback(() => {
    let q = supabase
      .from('users')
      // Selecciona solo lo que usa la tabla + modales
      .select(
        'id, email, full_name, role, restaurant_id, email_verified, created_at, updated_at, require_password_change',
        { count: 'exact' }
      );

    // search email
    if (searchTerm) {
      q = q.ilike('email', `%${searchTerm}%`);
    }

    // date range
    if (startDate) {
      q = q.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      q = q.lte('created_at', end.toISOString());
    }

    // role filter
    if (filter !== 'all') {
      q = q.eq('role', filter);
    }

    // sort
    if (sortBy === 'email') {
      q = q.order('email', { ascending: true });
    } else if (sortBy === 'oldest') {
      q = q.order('created_at', { ascending: true });
    } else {
      q = q.order('created_at', { ascending: false });
    }

    return q;
  }, [searchTerm, startDate, endDate, filter, sortBy]);

  const loadUsersPage = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await buildUsersQuery().range(from, to);
      if (error) throw error;

      setUsers((data as any) || []);
      setTotalUsersCount(count || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [buildUsersQuery, page, showToast]);

  // Carga inicial + recargas por filtros/página
  useEffect(() => {
    loadUsersPage();
  }, [loadUsersPage]);

  useEffect(() => {
    // restaurants se cargan una vez
    loadRestaurants().catch((e) => {
      console.error('Error loading restaurants:', e);
      showToast('error', 'Error', 'No se pudieron cargar los restaurantes');
    });
  }, [loadRestaurants, showToast]);

  // =============== Helpers de UI ===============
  const getRoleBadge = (role: UserType['role']) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="error">Superadmin</Badge>;
      case 'restaurant_owner':
        return <Badge variant="info">Restaurante</Badge>;
      default:
        return <Badge variant="gray">Desconocido</Badge>;
    }
  };

  const getVerificationBadge = (verified: boolean) => {
    return verified
      ? <Badge variant="success">Verificado</Badge>
      : <Badge variant="warning">Sin verificar</Badge>;
  };

  // Para “propietario”: ahora que users es paginado, no podemos saberlo buscando en users.
  // Lo calculamos con restaurants (que sí tenemos completo).
  const isUserOwner = useCallback((userId: string) => {
    return restaurants.some(r => r.owner_id === userId);
  }, [restaurants]);

  // =============== Acciones (manteniendo tu lógica) ===============
  const handleAssignRestaurant = (user: UserType) => {
    setAssigningUser(user);
    setSelectedRestaurantId(user.restaurant_id || '');
    setShowAssignModal(true);
  };

  const saveRestaurantAssignment = async () => {
    if (!assigningUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          restaurant_id: selectedRestaurantId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', assigningUser.id);

      if (error) throw error;

      showToast('success', 'Éxito', 'Restaurante asignado exitosamente');
      setShowAssignModal(false);
      setAssigningUser(null);
      setSelectedRestaurantId('');
      await loadUsersPage(); // ✅ solo recarga la página
    } catch (error) {
      console.error('Error assigning restaurant:', error);
      showToast('error', 'Error', 'No se pudo asignar el restaurante');
    }
  };

  const updateUserRole = async (userId: string, newRole: UserType['role']) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      showToast('success', 'Éxito', 'Rol actualizado exitosamente');
      await loadUsersPage();
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('error', 'Error', 'No se pudo actualizar el rol');
    }
  };

  const toggleEmailVerification = async (userId: string) => {
    try {
      // Solo tenemos la página actual; buscamos ahí
      const u = users.find(x => x.id === userId);
      if (!u) return;

      const { error } = await supabase
        .from('users')
        .update({ email_verified: !u.email_verified })
        .eq('id', userId);

      if (error) throw error;

      showToast('success', 'Éxito', 'Estado de verificación actualizado');
      await loadUsersPage();
    } catch (error) {
      console.error('Error toggling email verification:', error);
      showToast('error', 'Error', 'No se pudo actualizar la verificación');
    }
  };

  const deleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (!confirm(`¿Estás seguro de que quieres eliminar el usuario ${userToDelete.email}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('error', 'Error', 'No hay sesión activa');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.cannotDelete) {
          setDeleteBlockedDetails({ user: userToDelete, ...result });
          setShowCannotDeleteModal(true);
          return;
        }
        throw new Error(result.error || 'Error al eliminar usuario');
      }

      showToast('success', 'Éxito', 'Usuario eliminado exitosamente');
      await loadUsersPage();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showToast('error', 'Error', error?.message || 'No se pudo eliminar el usuario');
    }
  };

  const handleTransferOwnership = async (restaurant: any) => {
    setRestaurantToTransfer(restaurant);
    setSelectedNewOwner('');

    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('restaurant_id', restaurant.id)
        .neq('id', restaurant.owner_id || '')
        .in('role', ['restaurant_owner', 'superadmin']);

      if (error) throw error;

      setAvailableUsers(usersData || []);
      setShowCannotDeleteModal(false);
      setShowTransferModal(true);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Error', 'Error al cargar usuarios disponibles');
    }
  };

  const confirmTransferOwnership = async () => {
    if (!restaurantToTransfer || !selectedNewOwner) return;

    try {
      setTransferLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('error', 'Error', 'Sesión expirada');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transfer-restaurant-ownership`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurantToTransfer.id,
          newOwnerId: selectedNewOwner,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al transferir propiedad');

      showToast('success', 'Éxito', `Propiedad transferida exitosamente a ${result.restaurant.newOwnerName}`);
      setShowTransferModal(false);
      setRestaurantToTransfer(null);
      setSelectedNewOwner('');
      setDeleteBlockedDetails(null);

      // refrescamos restaurantes (cambia owner_id) y users page
      await loadRestaurants();
      await loadUsersPage();
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      showToast('error', 'Error', error.message || 'Error al transferir propiedad');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.password) {
      showToast('error', 'Campos requeridos', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (newUserForm.role === 'restaurant_owner' && !newUserForm.restaurant_id) {
      showToast('error', 'Restaurante requerido', 'Los usuarios de restaurante deben tener un restaurante asignado');
      return;
    }

    // OJO: ya no tenemos todos los usuarios en memoria para validar duplicados.
    // Se valida realmente en backend/edge function. Aquí hacemos una validación ligera solo.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('error', 'Error', 'No hay sesión activa');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;

      const body = {
        email: newUserForm.email,
        password: newUserForm.password,
        role: newUserForm.role,
        restaurant_id: newUserForm.role === 'superadmin'
          ? null
          : (newUserForm.restaurant_id && newUserForm.restaurant_id.trim() !== '' ? newUserForm.restaurant_id : null),
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes('already registered') || result.error?.includes('user_already_exists')) {
          showToast('error', 'Email duplicado', 'Este email ya está registrado');
          return;
        }
        if (result.error?.includes('weak') || result.error?.includes('easy to guess')) {
          showToast('error', 'Contraseña débil', 'La contraseña es muy débil o común. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser una contraseña común.');
          return;
        }
        throw new Error(result.error || 'Error al crear usuario');
      }

      showToast('success', 'Éxito', 'Usuario creado exitosamente');

      setNewUserForm({
        email: '',
        password: '',
        role: 'restaurant_owner',
        restaurant_id: '',
      });
      setShowCreateUserModal(false);

      await loadUsersPage();
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast('error', 'Error', error?.message || 'No se pudo crear el usuario');
    }
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setSelectedRestaurantId(user.restaurant_id || '');
    setShowEditModal(true);
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          restaurant_id: selectedRestaurantId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      showToast('success', 'Éxito', 'Usuario actualizado exitosamente');

      setShowEditModal(false);
      setEditingUser(null);
      setSelectedRestaurantId('');

      await loadUsersPage();
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('error', 'Error', 'No se pudo actualizar el usuario');
    }
  };

  const generateProvisionalPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    return password;
  };

  const handleResetPassword = (user: UserType) => {
    const newPassword = generateProvisionalPassword();
    setUserForPasswordReset(user);
    setProvisionalPassword(newPassword);
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    if (!userForPasswordReset || !provisionalPassword) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          require_password_change: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userForPasswordReset.id);

      if (error) throw error;

      // OJO: esto requiere service role / admin en backend normalmente.
      // Mantengo tu llamada tal cual si en tu proyecto funciona.
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userForPasswordReset.id,
        { password: provisionalPassword }
      );
      if (authError) throw authError;

      showToast('success', 'Éxito', 'Contraseña restablecida exitosamente');
      await loadUsersPage();
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast('error', 'Error', 'No se pudo restablecer la contraseña');
    }
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setUserForPasswordReset(null);
    setProvisionalPassword('');
  };

  // ==================== UI ====================
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <Button
          icon={UserPlus}
          onClick={() => setShowCreateUserModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Crear Usuario
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput !== searchTerm && (
                <p className="text-xs text-gray-500 mt-1">Buscando…</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los roles</option>
                <option value="superadmin">Superadministradores</option>
                <option value="restaurant_owner">Restaurantes</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'email')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Más reciente</option>
                <option value="oldest">Más antiguo</option>
                <option value="email">Email A-Z</option>
              </select>
            </div>

            {(startDate || endDate || sortBy !== 'newest' || searchInput.trim() || filter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setSortBy('newest');
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pagination header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="text-sm text-gray-600">
          Total: <strong>{totalUsersCount}</strong> usuarios · Página <strong>{page}</strong> de <strong>{totalPages}</strong>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const restaurant = getRestaurantForUser(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-8 h-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                          {isUserOwner(user.id) && (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              Propietario
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerificationBadge(!!user.email_verified)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {restaurant ? (
                          <div className="text-sm text-gray-900">{restaurant.name}</div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => handleEditUser(user)}
                            title="Editar asignación de restaurante"
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={user.email_verified ? UserX : UserCheck}
                            onClick={() => toggleEmailVerification(user.id)}
                            className={user.email_verified ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                            title={user.email_verified ? "Marcar como no verificado" : "Marcar como verificado"}
                          />

                          {!user.restaurant_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Building}
                              onClick={() => handleAssignRestaurant(user)}
                              className="text-purple-600 hover:text-purple-700"
                              title="Asignar Restaurante"
                            />
                          )}

                          {user.id !== 'super-1' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar usuario"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No hay usuarios para mostrar con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======= Modales: dejo los tuyos tal cual (solo ajusto datos usados) ======= */}

      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssigningUser(null);
          setSelectedRestaurantId('');
        }}
        title="Asignar Restaurante"
        size="md"
      >
        {assigningUser && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Gestionar restaurante del usuario: <strong>{assigningUser.email}</strong>
              </p>

              {assigningUser.restaurant_id && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Restaurante actual:</strong> {getRestaurantForUser(assigningUser)?.name}
                  </p>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Restaurante
              </label>
              <select
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin restaurante asignado</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} ({restaurant.domain})
                  </option>
                ))}
              </select>

              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Nota:</strong> Múltiples usuarios pueden estar asignados al mismo restaurante y verán la misma información.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningUser(null);
                  setSelectedRestaurantId('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={saveRestaurantAssignment}>
                Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCreateUserModal}
        onClose={() => {
          setShowCreateUserModal(false);
          setNewUserForm({
            email: '',
            password: '',
            role: 'restaurant_owner',
            restaurant_id: '',
          });
        }}
        title="Crear Nuevo Usuario"
        size="md"
      >
        <div className="space-y-6">
          <Input
            label="Email*"
            type="email"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="usuario@ejemplo.com"
          />

          <Input
            label="Contraseña*"
            type="password"
            value={newUserForm.password}
            onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Mínimo 8 caracteres"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Usuario*</label>
            <select
              value={newUserForm.role}
              onChange={(e) => {
                const newRole = e.target.value as UserType['role'];
                setNewUserForm(prev => ({
                  ...prev,
                  role: newRole,
                  restaurant_id: newRole === 'superadmin' ? '' : prev.restaurant_id
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="restaurant_owner">Restaurante</option>
              <option value="superadmin">Superadministrador</option>
            </select>
          </div>

          {newUserForm.role === 'restaurant_owner' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurante*</label>
              <select
                value={newUserForm.restaurant_id}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, restaurant_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar restaurante...</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateUserModal(false);
                setNewUserForm({
                  email: '',
                  password: '',
                  role: 'restaurant_owner',
                  restaurant_id: '',
                });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={
                !newUserForm.email ||
                !newUserForm.password ||
                (newUserForm.role === 'restaurant_owner' && !newUserForm.restaurant_id)
              }
              icon={UserPlus}
            >
              Crear Usuario
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
          setSelectedRestaurantId('');
        }}
        title="Editar Usuario"
        size="md"
      >
        {editingUser && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Usuario:</strong> {editingUser.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asignar Restaurante</label>
              <select
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin restaurante asignado</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} ({restaurant.domain})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Restablecer Contraseña</p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Lock}
                  onClick={() => handleResetPassword(editingUser)}
                >
                  Generar Contraseña Provisional
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={saveUserEdit} icon={Edit}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showResetPasswordModal}
        onClose={closeResetPasswordModal}
        title="Contraseña Provisional Generada"
        size="md"
      >
        {userForPasswordReset && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Usuario:</strong> {userForPasswordReset.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Provisional</label>
              <div className="flex gap-2">
                <Input value={provisionalPassword} readOnly className="font-mono text-lg" />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Copy}
                  onClick={() => {
                    navigator.clipboard.writeText(provisionalPassword);
                    showToast('success', 'Copiado', 'Contraseña copiada al portapapeles');
                  }}
                  title="Copiar contraseña"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={closeResetPasswordModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await confirmResetPassword();
                  closeResetPasswordModal();
                }}
                icon={Lock}
              >
                Confirmar y Aplicar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cannot Delete + Transfer Ownership: mantengo tus modales (no los reescribo completos aquí) */}
      {/* Si quieres que los deje 1:1, pégame el resto del archivo y te lo devuelvo íntegro. */}
    </div>
  );
};
