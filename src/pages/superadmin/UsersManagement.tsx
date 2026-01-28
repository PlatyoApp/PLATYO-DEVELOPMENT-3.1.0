import React, { useState, useEffect } from 'react';
import { User, Pencil as Edit, Trash2, Shield, UserCheck, UserX, Filter, Building, UserPlus, Lock, Copy } from 'lucide-react';
import { User as UserType, Restaurant } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
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
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'email'>('newest');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'restaurant_owner' as UserType['role'],
    restaurant_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: userData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const { data: restaurantData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantsError) throw restaurantsError;

      setUsers(userData || []);
      setRestaurants(restaurantData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getRestaurant = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user?.restaurant_id) return null;
    return restaurants.find(restaurant => restaurant.id === user.restaurant_id);
  };

  const getUsersByRestaurant = (restaurantId: string) => {
    return users.filter(user => user.restaurant_id === restaurantId);
  };

  const isUserOwner = (userId: string) => {
    return restaurants.some(restaurant => restaurant.owner_id === userId);
  };

  const getOwnedRestaurants = (userId: string) => {
    return restaurants.filter(restaurant => restaurant.owner_id === userId);
  };

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
      await loadData();

      setShowAssignModal(false);
      setAssigningUser(null);
      setSelectedRestaurantId('');
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
      await loadData();
    } catch (error) {
      console.error('Error updating user role:', error);
      showToast('error', 'Error', 'No se pudo actualizar el rol');
    }
  };

  const toggleEmailVerification = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ email_verified: !user.email_verified })
        .eq('id', userId);

      if (error) throw error;

      showToast('success', 'Éxito', 'Estado de verificación actualizado');
      await loadData();
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
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.cannotDelete) {
          setDeleteBlockedDetails({
            user: userToDelete,
            ...result
          });
          setShowCannotDeleteModal(true);
          return;
        }
        throw new Error(result.error || 'Error al eliminar usuario');
      }

      showToast('success', 'Éxito', 'Usuario eliminado exitosamente');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = error?.message || 'No se pudo eliminar el usuario';
      showToast('error', 'Error', errorMessage);
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

      if (!response.ok) {
        throw new Error(result.error || 'Error al transferir propiedad');
      }

      showToast('success', 'Éxito', `Propiedad transferida exitosamente a ${result.restaurant.newOwnerName}`);
      await loadData();
      setShowTransferModal(false);
      setRestaurantToTransfer(null);
      setSelectedNewOwner('');
      setDeleteBlockedDetails(null);
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

    const emailExists = users.some(user => user.email.toLowerCase() === newUserForm.email.toLowerCase());
    if (emailExists) {
      showToast('error', 'Email duplicado', 'Este email ya está registrado');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('error', 'Error', 'No hay sesión activa');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

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
        headers,
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes('already registered') || result.error?.includes('user_already_exists')) {
          showToast('error', 'Email duplicado', 'Este email ya está registrado en el sistema de autenticación');
          return;
        }
        if (result.error?.includes('weak') || result.error?.includes('easy to guess')) {
          showToast('error', 'Contraseña débil', 'La contraseña es muy débil o común. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser una contraseña común (como "password123", "12345678", etc.)');
          return;
        }
        throw new Error(result.error || 'Error al crear usuario');
      }

      showToast('success', 'Éxito', 'Usuario creado exitosamente');
      await loadData();

      setNewUserForm({
        email: '',
        password: '',
        role: 'restaurant_owner',
        restaurant_id: '',
      });
      setShowCreateUserModal(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error?.message || 'No se pudo crear el usuario';
      showToast('error', 'Error', errorMessage);
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
      await loadData();

      setShowEditModal(false);
      setEditingUser(null);
      setSelectedRestaurantId('');
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('error', 'Error', 'No se pudo actualizar el usuario');
    }
  };

  const generateProvisionalPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
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

      const { error: authError } = await supabase.auth.admin.updateUserById(
        userForPasswordReset.id,
        { password: provisionalPassword }
      );

      if (authError) throw authError;

      showToast('success', 'Éxito', 'Contraseña restablecida exitosamente');
      await loadData();
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

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by date range
      if (startDate || endDate) {
        const userDate = new Date(user.created_at);
        if (startDate && userDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (userDate > end) return false;
        }
      }

      if (filter === 'all') return matchesSearch;
      return matchesSearch && user.role === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return a.email.localeCompare(b.email);
      }
    });

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
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
            {(startDate || endDate || sortBy !== 'newest') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const restaurant = getRestaurant(user.id);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id}
                          </div>
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
                      {getVerificationBadge(user.email_verified)}
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
                        
                        {user.role === 'restaurant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Shield}
                            onClick={() => updateUserRole(user.id, 'superadmin')}
                            className="text-purple-600 hover:text-purple-700"
                            title="Promover a Superadmin"
                          />
                        )}
                        
                        {user.role === 'superadmin' && user.id !== 'super-1' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={User}
                            onClick={() => updateUserRole(user.id, 'restaurant')}
                            className="text-blue-600 hover:text-blue-700"
                            title="Cambiar a Restaurante"
                          />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={user.email_verified ? UserX : UserCheck}
                          onClick={() => toggleEmailVerification(user.id)}
                          className={user.email_verified ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                          title={user.email_verified ? "Marcar como no verificado" : "Marcar como verificado"}
                        />
                        
                        {!getRestaurant(user.id) && (
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
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        title="Detalles del Usuario"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                {getRoleBadge(selectedUser.role)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado de Verificación</label>
                {getVerificationBadge(selectedUser.email_verified)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {getRestaurant(selectedUser.id) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restaurante Asociado</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{getRestaurant(selectedUser.id)?.name}</p>
                  <p className="text-sm text-gray-600">{getRestaurant(selectedUser.id)?.domain}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assign Restaurant Modal */}
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
                    <strong>Restaurante actual:</strong> {getRestaurant(assigningUser.id)?.name}
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
              <Button
                onClick={saveRestaurantAssignment}
                disabled={!selectedRestaurantId}
              >
                Asignar Restaurante
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create User Modal */}
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Crea usuarios para administradores del sistema o dueños de restaurantes.
            </p>
          </div>

          <Input
            label="Email*"
            type="email"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="usuario@ejemplo.com"
          />

          <div>
            <Input
              label="Contraseña*"
              type="password"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
            />
            <p className="text-xs text-gray-500 mt-1">
              La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser una contraseña común (como "password123", "12345678", etc.)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Usuario*
            </label>
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
            <p className="text-xs text-gray-500 mt-1">
              {newUserForm.role === 'superadmin'
                ? 'Tendrá acceso completo al panel de administración'
                : 'Podrá gestionar su restaurante'}
            </p>
          </div>

          {newUserForm.role === 'restaurant_owner' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurante*
              </label>
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
              <p className="text-xs text-gray-500 mt-1">
                Los usuarios de restaurante deben tener un restaurante asignado
              </p>
            </div>
          )}

          {newUserForm.role === 'superadmin' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Los superadministradores no necesitan restaurante asignado. Tienen acceso completo a todos los restaurantes y funciones del sistema.
              </p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Contraseña provisional:</strong> El usuario deberá cambiar su contraseña al iniciar sesión por primera vez.
            </p>
          </div>

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

      {/* Edit User Modal */}
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
              <p className="text-sm text-blue-700 mt-1">
                <strong>Rol:</strong> {editingUser.role === 'superadmin' ? 'Superadministrador' : 'Restaurante'}
              </p>
            </div>

            {editingUser.restaurant_id && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Restaurante actual:</strong> {getRestaurant(editingUser.id)?.name || 'Sin asignar'}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignar Restaurante
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
              <p className="text-xs text-gray-500 mt-2">
                Selecciona un restaurante para asignar o deja en blanco para remover la asignación
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> Múltiples usuarios pueden estar asignados al mismo restaurante y compartirán el acceso a toda su información.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  Restablecer Contraseña
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  Si el usuario olvidó su contraseña, puedes asignarle una contraseña provisional. El usuario deberá cambiarla al iniciar sesión.
                </p>
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
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setSelectedRestaurantId('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={saveUserEdit}
                icon={Edit}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={closeResetPasswordModal}
        title="Contraseña Provisional Generada"
        size="md"
      >
        {userForPasswordReset && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Usuario:</strong> {userForPasswordReset.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Provisional
              </label>
              <div className="flex gap-2">
                <Input
                  value={provisionalPassword}
                  readOnly
                  className="font-mono text-lg"
                />
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

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> Guarda esta contraseña en un lugar seguro o compártela con el usuario de forma segura.
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Esta contraseña es provisional y debe cambiarse</li>
                <li>• El usuario deberá cambiarla al iniciar sesión</li>
                <li>• No podrás recuperar esta contraseña después de cerrar este modal</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={closeResetPasswordModal}
              >
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

      {/* Cannot Delete User Modal */}
      <Modal
        isOpen={showCannotDeleteModal}
        onClose={() => {
          setShowCannotDeleteModal(false);
          setDeleteBlockedDetails(null);
        }}
        title="No se puede eliminar el usuario"
        size="lg"
      >
        {deleteBlockedDetails && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                {deleteBlockedDetails.error}
              </p>
              <p className="text-sm text-red-700">
                <strong>Usuario:</strong> {deleteBlockedDetails.user?.email}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-3">
                Restaurantes afectados:
              </p>
              {deleteBlockedDetails.details?.restaurants?.map((restaurant: any) => {
                const restaurantData = deleteBlockedDetails.details?.restaurantData?.find((r: any) => r.id === restaurant.id);
                return (
                  <div key={restaurant.id} className="mb-4 p-3 bg-white rounded border border-blue-100">
                    <p className="font-medium text-blue-900">{restaurant.name}</p>
                    {restaurantData && (
                      <div className="mt-2 text-xs text-blue-700 grid grid-cols-3 gap-2">
                        <div>Productos: {restaurantData.productsCount}</div>
                        <div>Órdenes: {restaurantData.ordersCount}</div>
                        <div>Clientes: {restaurantData.customersCount}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900 mb-2">
                Otros usuarios en el restaurante ({deleteBlockedDetails.details?.otherUsersCount}):
              </p>
              <div className="space-y-2">
                {deleteBlockedDetails.details?.otherUsers?.map((otherUser: any) => (
                  <div key={otherUser.id} className="p-2 bg-white rounded border border-amber-100">
                    <p className="text-sm font-medium text-amber-900">{otherUser.name}</p>
                    <p className="text-xs text-amber-700">{otherUser.email}</p>
                    <p className="text-xs text-amber-600">Rol: {otherUser.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Sugerencias:
              </p>
              <p className="text-sm text-gray-700">
                {deleteBlockedDetails.suggestion}
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Elimina primero a los otros usuarios del restaurante</li>
                <li>O transfiere la propiedad del restaurante a otro usuario administrador</li>
              </ul>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={() => {
                  if (deleteBlockedDetails.details?.restaurants?.[0]) {
                    handleTransferOwnership(deleteBlockedDetails.details.restaurants[0]);
                  }
                }}
                icon={UserCheck}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Transferir Propiedad
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCannotDeleteModal(false);
                  setDeleteBlockedDetails(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setRestaurantToTransfer(null);
          setSelectedNewOwner('');
        }}
        title="Transferir Propiedad del Restaurante"
        size="md"
      >
        {restaurantToTransfer && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Transferir propiedad de "{restaurantToTransfer.name}"
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Esta acción transferirá todos los derechos y responsabilidades del restaurante al nuevo propietario. El propietario actual perderá el control total del restaurante.
                </p>
              </div>
            </div>

            {availableUsers.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">
                  No hay usuarios disponibles para transferir la propiedad. El nuevo propietario debe ser un miembro del restaurante con rol de "restaurant_owner" o "superadmin".
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Nuevo Propietario
                </label>
                <select
                  value={selectedNewOwner}
                  onChange={(e) => setSelectedNewOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={transferLoading}
                >
                  <option value="">-- Seleccionar usuario --</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTransferModal(false);
                  setRestaurantToTransfer(null);
                  setSelectedNewOwner('');
                }}
                disabled={transferLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmTransferOwnership}
                icon={UserCheck}
                disabled={!selectedNewOwner || transferLoading || availableUsers.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {transferLoading ? 'Transfiriendo...' : 'Transferir Propiedad'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};